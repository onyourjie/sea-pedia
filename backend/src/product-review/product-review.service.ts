import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductReviewDto } from './product-review.dto';
import { OrderStatus } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';

function sanitize(str: string): string {
  return sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim();
}

@Injectable()
export class ProductReviewService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateProductReviewDto) {
    const buyer = await this.prisma.buyer.findUnique({ where: { userId } });
    if (!buyer) throw new NotFoundException('Buyer profile not found');

    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: dto.orderItemId },
      include: { order: true, review: true },
    });
    if (!orderItem) throw new NotFoundException('Order item not found');
    if (orderItem.order.buyerId !== buyer.id)
      throw new BadRequestException('You can only review your own orders');
    if (orderItem.order.status !== OrderStatus.PESANAN_SELESAI)
      throw new BadRequestException('You can only review completed orders');
    if (orderItem.review) throw new ConflictException('Review already submitted for this item');

    const cleanComment = sanitize(dto.comment);
    if (!cleanComment) throw new BadRequestException('Comment cannot be empty');

    return this.prisma.productReview.create({
      data: {
        productId: orderItem.productId,
        buyerId: buyer.id,
        orderItemId: orderItem.id,
        rating: dto.rating,
        comment: cleanComment,
      },
    });
  }

  async listMyReviews(userId: string) {
    const buyer = await this.prisma.buyer.findUnique({ where: { userId } });
    if (!buyer) throw new NotFoundException('Buyer profile not found');
    return this.prisma.productReview.findMany({
      where: { buyerId: buyer.id },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, imageUrl: true } },
      },
    });
  }
}
