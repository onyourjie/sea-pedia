import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './review.dto';
import sanitizeHtml from 'sanitize-html';

// Strict sanitization: strip ALL tags and attributes for plain-text comment storage
function sanitize(str: string): string {
  return sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim();
}

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReviewDto, userId?: string) {
    return this.prisma.review.create({
      data: {
        userId: userId ?? null,
        reviewerName: sanitize(dto.reviewerName),
        rating: dto.rating,
        comment: sanitize(dto.comment),
      },
    });
  }

  async list(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count(),
    ]);
    return { data: reviews, total, page, limit };
  }
}
