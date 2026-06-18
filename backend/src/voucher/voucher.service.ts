import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVoucherDto } from './voucher.dto';

@Injectable()
export class VoucherService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateVoucherDto) {
    const existing = await this.prisma.voucher.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Voucher code already exists');
    return this.prisma.voucher.create({ data: { ...dto, expiresAt: new Date(dto.expiresAt) } });
  }

  async list() {
    return this.prisma.voucher.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getById(id: string) {
    const v = await this.prisma.voucher.findUnique({ where: { id } });
    if (!v) throw new NotFoundException('Voucher not found');
    return v;
  }

  async validate(code: string) {
    const v = await this.prisma.voucher.findUnique({ where: { code } });
    if (!v) return { valid: false, reason: 'Voucher not found' };
    if (v.expiresAt < new Date()) return { valid: false, reason: 'Voucher expired' };
    if (v.usageCount >= v.usageLimit) return { valid: false, reason: 'Usage limit reached' };
    return { valid: true, voucher: v };
  }
}
