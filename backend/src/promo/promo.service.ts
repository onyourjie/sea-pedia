import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromoDto } from '../voucher/voucher.dto';

@Injectable()
export class PromoService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePromoDto) {
    const existing = await this.prisma.promo.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Promo code already exists');
    return this.prisma.promo.create({ data: { ...dto, expiresAt: new Date(dto.expiresAt) } });
  }

  async list() {
    return this.prisma.promo.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getById(id: string) {
    const p = await this.prisma.promo.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Promo not found');
    return p;
  }

  async validate(code: string) {
    const p = await this.prisma.promo.findUnique({ where: { code } });
    if (!p) return { valid: false, reason: 'Promo not found' };
    if (p.expiresAt < new Date()) return { valid: false, reason: 'Promo expired' };
    if (p.usageLimit > 0 && p.usageCount >= p.usageLimit)
      return { valid: false, reason: 'Promo usage limit reached' };
    return { valid: true, promo: p };
  }
}
