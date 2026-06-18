import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async listPublic(page = 1, limit = 20, search?: string, storeId?: string) {
    const skip = (page - 1) * limit;
    const where: any = { isActive: true };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (storeId) where.storeId = storeId;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { store: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { data: products, total, page, limit };
  }

  async getPublicDetail(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { store: { select: { id: true, name: true, description: true } } },
    });
    if (!product || !product.isActive) throw new NotFoundException('Product not found');
    return product;
  }

  async listSellerProducts(userId: string) {
    const store = await this.prisma.store.findUnique({ where: { userId } });
    if (!store) throw new NotFoundException('Store not found. Create a store first.');
    return this.prisma.product.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateProductDto) {
    const store = await this.prisma.store.findUnique({ where: { userId } });
    if (!store) throw new NotFoundException('Store not found. Create a store first.');
    return this.prisma.product.create({
      data: { storeId: store.id, ...dto },
    });
  }

  async update(userId: string, productId: string, dto: UpdateProductDto) {
    const product = await this.findAndVerifyOwner(userId, productId);
    return this.prisma.product.update({ where: { id: product.id }, data: dto });
  }

  async remove(userId: string, productId: string) {
    const product = await this.findAndVerifyOwner(userId, productId);
    await this.prisma.product.update({ where: { id: product.id }, data: { isActive: false } });
    return { message: 'Product deleted' };
  }

  private async findAndVerifyOwner(userId: string, productId: string) {
    const store = await this.prisma.store.findUnique({ where: { userId } });
    if (!store) throw new NotFoundException('Store not found');
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.storeId !== store.id) throw new ForbiddenException('Not your product');
    return product;
  }
}
