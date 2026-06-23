import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  // Aggregate counts surfaced on the public landing hero. Real counts only —
  // we do not pad with marketing fluff.
  async getPublicStats() {
    const [products, stores, ratingAgg, completedOrders] = await Promise.all([
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.store.count(),
      this.prisma.productReview.aggregate({ _avg: { rating: true }, _count: { _all: true } }),
      this.prisma.order.count({ where: { status: OrderStatus.PESANAN_SELESAI } }),
    ]);
    return {
      activeProducts: products,
      stores,
      averageRating: ratingAgg._avg.rating ?? 0,
      totalReviews: ratingAgg._count._all,
      completedOrders,
    };
  }
}
