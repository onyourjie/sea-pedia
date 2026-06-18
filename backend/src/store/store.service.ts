import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto, UpdateStoreDto } from './store.dto';

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateStoreDto) {
    const existing = await this.prisma.store.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Store name already taken');

    const hasStore = await this.prisma.store.findUnique({ where: { userId } });
    if (hasStore) throw new ConflictException('You already have a store');

    return this.prisma.store.create({ data: { userId, ...dto } });
  }

  async update(userId: string, dto: UpdateStoreDto) {
    const store = await this.prisma.store.findUnique({ where: { userId } });
    if (!store) throw new NotFoundException('Store not found');

    if (dto.name && dto.name !== store.name) {
      const taken = await this.prisma.store.findUnique({ where: { name: dto.name } });
      if (taken) throw new ConflictException('Store name already taken');
    }

    return this.prisma.store.update({ where: { userId }, data: dto });
  }

  async getMyStore(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
      include: { _count: { select: { products: true, orders: true } } },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async getStoreById(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: {
        products: { where: { isActive: true }, take: 10 },
        _count: { select: { products: true } },
      },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async listStores(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        skip,
        take: limit,
        include: { _count: { select: { products: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.store.count(),
    ]);
    return { data: stores, total, page, limit };
  }
}
