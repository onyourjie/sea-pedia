import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './order.dto';
import { DeliveryMethod, OrderStatus } from '@prisma/client';

const DELIVERY_FEES: Record<DeliveryMethod, number> = {
  INSTANT: 25000,
  NEXT_DAY: 15000,
  REGULAR: 9000,
};

const PPN_RATE = 0.12;

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  private async getBuyer(userId: string) {
    const buyer = await this.prisma.buyer.findUnique({
      where: { userId },
      include: { wallet: true },
    });
    if (!buyer) throw new NotFoundException('Buyer profile not found');
    return buyer;
  }

  async checkout(userId: string, dto: CheckoutDto) {
    const buyer = await this.getBuyer(userId);

    // Get cart
    const cart = await this.prisma.cart.findUnique({
      where: { buyerId: buyer.id },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0) throw new BadRequestException('Cart is empty');

    // Validate address
    const address = await this.prisma.address.findUnique({ where: { id: dto.addressId } });
    if (!address || address.buyerId !== buyer.id) throw new NotFoundException('Address not found');

    // Validate stock
    for (const item of cart.items) {
      if (!item.product.isActive) throw new BadRequestException(`Product "${item.product.name}" is no longer available`);
      if (item.product.stock < item.quantity)
        throw new BadRequestException(`Insufficient stock for "${item.product.name}"`);
    }

    // Calculate subtotal using effective price (after product-level discount)
    const subtotal = cart.items.reduce((sum, item) => {
      const discountPct = Math.min(Math.max(item.product.discount ?? 0, 0), 90);
      const effectivePrice = Number(item.product.price) * (1 - discountPct / 100);
      return sum + effectivePrice * item.quantity;
    }, 0);

    // Validate and apply discount
    let discountAmount = 0;
    let voucherId: string | undefined;
    let promoId: string | undefined;

    if (dto.voucherCode) {
      const voucher = await this.prisma.voucher.findUnique({ where: { code: dto.voucherCode } });
      if (!voucher) throw new BadRequestException('Invalid voucher code');
      if (voucher.expiresAt < new Date()) throw new BadRequestException('Voucher has expired');
      if (voucher.usageCount >= voucher.usageLimit) throw new BadRequestException('Voucher usage limit reached');
      if (voucher.minOrder && subtotal < Number(voucher.minOrder))
        throw new BadRequestException(`Minimum order Rp ${voucher.minOrder} required for this voucher`);

      const raw = voucher.discountPct
        ? (subtotal * Number(voucher.discountPct)) / 100
        : Number(voucher.discountAmount ?? 0);
      discountAmount += voucher.maxDiscount ? Math.min(raw, Number(voucher.maxDiscount)) : raw;
      voucherId = voucher.id;
    }

    if (dto.promoCode) {
      const promo = await this.prisma.promo.findUnique({ where: { code: dto.promoCode } });
      if (!promo) throw new BadRequestException('Invalid promo code');
      if (promo.expiresAt < new Date()) throw new BadRequestException('Promo has expired');
      if (promo.usageLimit > 0 && promo.usageCount >= promo.usageLimit)
        throw new BadRequestException('Promo usage limit reached');
      if (promo.minOrder && subtotal < Number(promo.minOrder))
        throw new BadRequestException(`Minimum order Rp ${promo.minOrder} required for this promo`);

      const raw = promo.discountPct
        ? (subtotal * Number(promo.discountPct)) / 100
        : Number(promo.discountAmount ?? 0);
      discountAmount += promo.maxDiscount ? Math.min(raw, Number(promo.maxDiscount)) : raw;
      promoId = promo.id;
    }

    const deliveryFee = DELIVERY_FEES[dto.deliveryMethod];
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    // PPN 12% applied on (discounted subtotal + delivery fee)
    const taxBase = discountedSubtotal + deliveryFee;
    const ppn = taxBase * PPN_RATE;
    const total = taxBase + ppn;

    // Check wallet balance
    if (Number(buyer.wallet!.balance) < total) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // Create order in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Deduct stock atomically — prevents negative stock under concurrent checkouts
      for (const item of cart.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new BadRequestException(`Insufficient stock for "${item.product.name}"`);
        }
      }

      // Create order
      const newOrder = await tx.order.create({
        data: {
          buyerId: buyer.id,
          storeId: cart.storeId!,
          addressId: dto.addressId,
          deliveryMethod: dto.deliveryMethod,
          subtotal,
          discountAmount,
          deliveryFee,
          ppn,
          total,
          voucherId,
          promoId,
          status: OrderStatus.SEDANG_DIKEMAS,
          statusHistory: {
            create: { status: OrderStatus.SEDANG_DIKEMAS, note: 'Order placed' },
          },
          items: {
            create: cart.items.map((item) => {
              const discountPct = Math.min(Math.max(item.product.discount ?? 0, 0), 90);
              const effectivePrice = Number(item.product.price) * (1 - discountPct / 100);
              return {
                productId: item.productId,
                name: item.product.name,
                price: effectivePrice,
                quantity: item.quantity,
              };
            }),
          },
        },
        include: { items: true, statusHistory: true },
      });

      // Create delivery record
      await tx.delivery.create({ data: { orderId: newOrder.id } });

      // Deduct wallet
      const updatedWallet = await tx.wallet.update({
        where: { buyerId: buyer.id },
        data: { balance: { decrement: total } },
      });
      await tx.walletTx.create({
        data: {
          walletId: buyer.wallet!.id,
          type: 'PAYMENT',
          amount: total,
          balanceAfter: updatedWallet.balance,
          description: `Payment for order ${newOrder.id}`,
          orderId: newOrder.id,
        },
      });

      // Increment voucher usage
      if (voucherId) {
        await tx.voucher.update({ where: { id: voucherId }, data: { usageCount: { increment: 1 } } });
      }
      // Increment promo usage
      if (promoId) {
        await tx.promo.update({ where: { id: promoId }, data: { usageCount: { increment: 1 } } });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({ where: { id: cart.id }, data: { storeId: null } });

      return newOrder;
    });

    return {
      order,
      summary: { subtotal, discountAmount, deliveryFee, ppn, total },
    };
  }

  async getBuyerOrders(userId: string, page = 1, limit = 20) {
    const buyer = await this.getBuyer(userId);
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { buyerId: buyer.id },
        skip,
        take: limit,
        include: {
          store: { select: { id: true, name: true } },
          items: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
          delivery: { include: { driver: { include: { user: { select: { username: true } } } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where: { buyerId: buyer.id } }),
    ]);
    return { data: orders, total, page, limit };
  }

  async getBuyerOrderDetail(userId: string, orderId: string) {
    const buyer = await this.getBuyer(userId);
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: { select: { id: true, name: true } },
        items: { include: { review: true } },
        address: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        voucher: true,
        promo: true,
        delivery: { include: { driver: { include: { user: { select: { username: true } } } } } },
      },
    });
    if (!order || order.buyerId !== buyer.id) throw new NotFoundException('Order not found');
    return order;
  }

  async getSellerOrders(userId: string, page = 1, limit = 20) {
    const store = await this.prisma.store.findUnique({ where: { userId } });
    if (!store) throw new NotFoundException('Store not found');
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { storeId: store.id },
        skip,
        take: limit,
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
          buyer: { include: { user: { select: { username: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where: { storeId: store.id } }),
    ]);
    return { data: orders, total, page, limit };
  }

  async sellerProcessOrder(userId: string, orderId: string) {
    const store = await this.prisma.store.findUnique({ where: { userId } });
    if (!store) throw new NotFoundException('Store not found');

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.storeId !== store.id) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.SEDANG_DIKEMAS)
      throw new BadRequestException('Order cannot be processed in its current status');

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.MENUNGGU_PENGIRIM,
        statusHistory: {
          create: { status: OrderStatus.MENUNGGU_PENGIRIM, note: 'Seller processed the order' },
        },
      },
      include: { statusHistory: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async getSellerOrderDetail(userId: string, orderId: string) {
    const store = await this.prisma.store.findUnique({ where: { userId } });
    if (!store) throw new NotFoundException('Store not found');
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        address: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        buyer: { include: { user: { select: { username: true, email: true } } } },
        delivery: { include: { driver: { include: { user: { select: { username: true } } } } } },
      },
    });
    if (!order || order.storeId !== store.id) throw new NotFoundException('Order not found');
    return order;
  }

  async getSellerIncomeReport(userId: string) {
    const store = await this.prisma.store.findUnique({ where: { userId } });
    if (!store) throw new NotFoundException('Store not found');

    const [completedOrders, pendingOrders] = await Promise.all([
      this.prisma.order.findMany({
        where: { storeId: store.id, status: OrderStatus.PESANAN_SELESAI },
        include: { items: true },
      }),
      this.prisma.order.findMany({
        where: {
          storeId: store.id,
          status: { in: [OrderStatus.SEDANG_DIKEMAS, OrderStatus.MENUNGGU_PENGIRIM, OrderStatus.SEDANG_DIKIRIM] },
        },
        include: { items: true },
      }),
    ]);

    const totalIncome = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const pendingIncome = pendingOrders.reduce((sum, o) => sum + Number(o.total), 0);

    return {
      totalOrders: completedOrders.length,
      totalIncome,
      pendingOrders: pendingOrders.length,
      pendingIncome,
      orders: completedOrders,
    };
  }

  async getBuyerSpendingReport(userId: string) {
    const buyer = await this.getBuyer(userId);
    const orders = await this.prisma.order.findMany({
      where: { buyerId: buyer.id },
      include: { items: true, store: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const completed = orders.filter((o) => o.status === OrderStatus.PESANAN_SELESAI);
    const totalSpent = completed.reduce((sum, o) => sum + Number(o.total), 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const completedThisMonth = completed.filter((o) => o.updatedAt >= monthStart).length;

    return {
      totalOrders: orders.length,
      totalSpent,
      completedOrders: completed.length,
      completedThisMonth,
      orders,
    };
  }
}
