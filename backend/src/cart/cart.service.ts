import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private async getBuyerId(userId: string) {
    const buyer = await this.prisma.buyer.findUnique({ where: { userId } });
    if (!buyer) throw new NotFoundException('Buyer profile not found');
    return buyer.id;
  }

  async getCart(userId: string) {
    const buyerId = await this.getBuyerId(userId);
    let cart = await this.prisma.cart.findUnique({
      where: { buyerId },
      include: {
        items: {
          include: { product: { include: { store: { select: { id: true, name: true } } } } },
        },
      },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { buyerId },
        include: {
          items: {
            include: { product: { include: { store: { select: { id: true, name: true } } } } },
          },
        },
      });
    }
    return cart;
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const buyerId = await this.getBuyerId(userId);

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { store: true },
    });
    if (!product || !product.isActive) throw new NotFoundException('Product not found');
    if (product.stock < dto.quantity) throw new BadRequestException('Insufficient stock');

    let cart = await this.prisma.cart.findUnique({ where: { buyerId } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { buyerId, storeId: product.storeId } });
    }

    // Single-store checkout rule
    if (cart.storeId && cart.storeId !== product.storeId) {
      throw new BadRequestException(
        'Cart already contains items from another store. Clear your cart first to add products from a different store.',
      );
    }

    if (!cart.storeId) {
      await this.prisma.cart.update({ where: { id: cart.id }, data: { storeId: product.storeId } });
    }

    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: dto.productId } },
    });

    if (existing) {
      const newQty = existing.quantity + dto.quantity;
      if (product.stock < newQty) throw new BadRequestException('Insufficient stock');
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { cartId: cart.id, productId: dto.productId, quantity: dto.quantity },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, productId: string, dto: UpdateCartItemDto) {
    const buyerId = await this.getBuyerId(userId);
    const cart = await this.prisma.cart.findUnique({ where: { buyerId } });
    if (!cart) throw new NotFoundException('Cart not found');

    const item = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
      include: { product: true },
    });
    if (!item) throw new NotFoundException('Item not in cart');
    if (item.product.stock < dto.quantity) throw new BadRequestException('Insufficient stock');

    await this.prisma.cartItem.update({ where: { id: item.id }, data: { quantity: dto.quantity } });
    return this.getCart(userId);
  }

  async removeItem(userId: string, productId: string) {
    const buyerId = await this.getBuyerId(userId);
    const cart = await this.prisma.cart.findUnique({ where: { buyerId } });
    if (!cart) throw new NotFoundException('Cart not found');

    const item = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    if (!item) throw new NotFoundException('Item not in cart');

    await this.prisma.cartItem.delete({ where: { id: item.id } });

    // If cart is now empty, clear storeId
    const remaining = await this.prisma.cartItem.count({ where: { cartId: cart.id } });
    if (remaining === 0) {
      await this.prisma.cart.update({ where: { id: cart.id }, data: { storeId: null } });
    }

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const buyerId = await this.getBuyerId(userId);
    const cart = await this.prisma.cart.findUnique({ where: { buyerId } });
    if (!cart) return { message: 'Cart already empty' };

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await this.prisma.cart.update({ where: { id: cart.id }, data: { storeId: null } });
    return { message: 'Cart cleared' };
  }
}
