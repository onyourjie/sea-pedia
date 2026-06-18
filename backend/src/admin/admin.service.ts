import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, DeliveryMethod } from '@prisma/client';

// SLA in hours per delivery method
const SLA_HOURS: Record<DeliveryMethod, number> = {
  INSTANT: 4,
  NEXT_DAY: 24,
  REGULAR: 72,
};

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const [users, stores, products, orders, vouchers, promos, deliveries, overdueOrders] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.store.count(),
        this.prisma.product.count({ where: { isActive: true } }),
        this.prisma.order.groupBy({ by: ['status'], _count: true }),
        this.prisma.voucher.count(),
        this.prisma.promo.count(),
        this.prisma.delivery.count(),
        this.prisma.order.count({ where: { isOverdue: true } }),
      ]);

    return { users, stores, products, orders, vouchers, promos, deliveries, overdueOrders };
  }

  async listUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: { roles: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { data, total, page, limit };
  }

  async listOrders(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        include: {
          store: { select: { name: true } },
          buyer: { include: { user: { select: { username: true } } } },
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count(),
    ]);
    return { data, total, page, limit };
  }

  async listDeliveries(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.delivery.findMany({
        skip,
        take: limit,
        include: {
          order: { select: { status: true, deliveryMethod: true, total: true } },
          driver: { include: { user: { select: { username: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.delivery.count(),
    ]);
    return { data, total, page, limit };
  }

  async listOverdueOrders() {
    return this.prisma.order.findMany({
      where: { isOverdue: true },
      include: {
        store: { select: { name: true } },
        buyer: { include: { user: { select: { username: true } } } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSystemDate() {
    let sys = await this.prisma.systemDate.findUnique({ where: { id: 1 } });
    if (!sys) {
      sys = await this.prisma.systemDate.create({ data: { id: 1, currentDate: new Date() } });
    }
    return sys;
  }

  async advanceDay() {
    const sys = await this.getSystemDate();
    const next = new Date(sys.currentDate);
    next.setDate(next.getDate() + 1);
    const updated = await this.prisma.systemDate.update({
      where: { id: 1 },
      data: { currentDate: next },
    });
    // Run overdue check after advancing day
    const processed = await this.processOverdueOrders(next);
    return { currentDate: updated.currentDate, overdueProcessed: processed };
  }

  async processOverdueOrders(now?: Date) {
    const currentDate = now ?? (await this.getSystemDate()).currentDate;
    let processed = 0;

    // Find orders that are still in transit (SEDANG_DIKEMAS or SEDANG_DIKIRIM or MENUNGGU_PENGIRIM)
    const activeOrders = await this.prisma.order.findMany({
      where: {
        isOverdue: false,
        status: { in: [OrderStatus.SEDANG_DIKEMAS, OrderStatus.MENUNGGU_PENGIRIM, OrderStatus.SEDANG_DIKIRIM] },
      },
      include: {
        items: true,
        buyer: { include: { wallet: true } },
        delivery: true,
      },
    });

    for (const order of activeOrders) {
      const slaHours = SLA_HOURS[order.deliveryMethod];
      const deadline = new Date(order.createdAt);
      deadline.setHours(deadline.getHours() + slaHours);

      if (currentDate >= deadline) {
        await this.prisma.$transaction(async (tx) => {
          // Mark order as overdue and returned
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.DIKEMBALIKAN,
              isOverdue: true,
              statusHistory: {
                create: {
                  status: OrderStatus.DIKEMBALIKAN,
                  note: `Auto-returned: SLA exceeded (${slaHours}h for ${order.deliveryMethod})`,
                },
              },
            },
          });

          // Restore stock
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }

          // Refund buyer wallet
          if (order.buyer.wallet) {
            await tx.wallet.update({
              where: { id: order.buyer.wallet.id },
              data: { balance: { increment: order.total } },
            });
            await tx.walletTx.create({
              data: {
                walletId: order.buyer.wallet.id,
                type: 'REFUND',
                amount: order.total,
                description: `Auto-refund for overdue order ${order.id}`,
                orderId: order.id,
              },
            });
          }
        });
        processed++;
      }
    }

    return processed;
  }
}
