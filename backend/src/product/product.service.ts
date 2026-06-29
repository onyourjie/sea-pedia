import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { OrderStatus } from '@prisma/client';

const CATEGORY_TERMS: Record<string, string[]> = {
  seafood: ['seafood', 'ikan', 'udang', 'cumi', 'kerapu', 'hasil laut'],
  pancing: ['pancing', 'joran', 'reel', 'jaring'],
  kapal: ['kapal', 'boat', 'perahu'],
  'suku-cadang': [
    'suku cadang',
    'sparepart',
    'mesin',
    'baling',
    'propeller',
    'onderdil',
    'filter',
    'impeller',
    'seal kit',
    'o-ring',
  ],
  navigasi: ['navigasi', 'gps', 'kompas', 'radar', 'radio', 'vhf', 'peta laut', 'chartplotter'],
  keselamatan: ['keselamatan', 'pelampung', 'life jacket', 'jaket', 'safety', 'flare', 'strobe', 'emergency'],
  'jasa-selam': ['jasa selam', 'selam', 'diving'],
};

const CATEGORY_EXCLUDED_TERMS: Record<string, string[]> = {
  seafood: ['jaring', 'pancing', 'joran', 'reel'],
};

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async listPublic(
    page = 1,
    limit = 20,
    search?: string,
    storeId?: string,
    category?: string,
    sort?: string,
    minPrice?: number,
    maxPrice?: number,
    promo?: boolean,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { isActive: true };
    const textFilters: any[] = [];
    if (search) textFilters.push(this.textSearchFilter([search]));
    if (category && CATEGORY_TERMS[category]) {
      textFilters.push(this.categorySearchFilter(category));
    }
    if (textFilters.length > 0) where.AND = textFilters;
    if (storeId) where.storeId = storeId;
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }
    if (promo) where.discount = { gt: 0 };

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    else if (sort === 'price_desc') orderBy = { price: 'desc' };
    else if (sort === 'newest') orderBy = { createdAt: 'desc' };
    else if (sort === 'discount') orderBy = { discount: 'desc' };

    if (sort === 'bestseller') {
      return this.listBestsellers({ page, limit, where });
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { store: { select: { id: true, name: true } } },
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);
    return { data: await this.attachRatings(products), total, page, limit };
  }

  private textSearchFilter(terms: string[]) {
    return {
      OR: terms.flatMap((term) => [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ]),
    };
  }

  private categorySearchFilter(category: string) {
    const excludedTerms = CATEGORY_EXCLUDED_TERMS[category] ?? [];
    return {
      ...this.textSearchFilter(CATEGORY_TERMS[category]),
      ...(excludedTerms.length > 0 ? { NOT: this.textSearchFilter(excludedTerms) } : {}),
    };
  }

  async listBestsellers(opts?: { page?: number; limit?: number; where?: any }) {
    const limit = opts?.limit ?? 20;
    const page = opts?.page ?? 1;
    const skip = (page - 1) * limit;

    // Aggregate from completed orders only (PESANAN_SELESAI) so an active
    // checkout that later returns doesn't inflate "bestseller" rank.
    const grouped = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { status: OrderStatus.PESANAN_SELESAI } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 100,
    });

    if (grouped.length === 0) {
      return { data: [], total: 0, page, limit };
    }

    const productIds = grouped.map((g) => g.productId);
    const baseWhere = { ...(opts?.where ?? { isActive: true }), id: { in: productIds } };
    const products = await this.prisma.product.findMany({
      where: baseWhere,
      include: { store: { select: { id: true, name: true } } },
    });

    const soldMap = new Map(grouped.map((g) => [g.productId, g._sum.quantity ?? 0]));
    const sorted = products
      .map((p) => ({ ...p, soldCount: soldMap.get(p.id) ?? 0 }))
      .sort((a, b) => b.soldCount - a.soldCount);

    const paged = sorted.slice(skip, skip + limit);
    return { data: await this.attachRatings(paged), total: sorted.length, page, limit };
  }

  async listHotDeals(limit = 10) {
    // Hot deals = active products with non-zero discount, ordered by discount desc.
    const products = await this.prisma.product.findMany({
      where: { isActive: true, discount: { gt: 0 } },
      include: { store: { select: { id: true, name: true } } },
      orderBy: [{ discount: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
    const data = await this.attachRatings(products);
    return { data, total: data.length };
  }

  async listNewArrivals(limit = 10) {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: { store: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    const data = await this.attachRatings(products);
    return { data, total: data.length };
  }

  // Attach aggregated rating + reviewCount to a list of products in one batch query.
  private async attachRatings<T extends { id: string }>(products: T[]) {
    if (products.length === 0) return [] as (T & { ratingAverage: number; reviewCount: number })[];
    const ids = products.map((p) => p.id);
    const grouped = await this.prisma.productReview.groupBy({
      by: ['productId'],
      where: { productId: { in: ids } },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const map = new Map(
      grouped.map((g) => [g.productId, { avg: g._avg.rating ?? 0, count: g._count._all }]),
    );
    return products.map((p) => {
      const r = map.get(p.id);
      return {
        ...p,
        ratingAverage: r?.avg ?? 0,
        reviewCount: r?.count ?? 0,
      };
    });
  }

  async getPublicDetail(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { store: { select: { id: true, name: true, description: true } } },
    });
    if (!product || !product.isActive) throw new NotFoundException('Product not found');

    const reviewAgg = await this.prisma.productReview.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return {
      ...product,
      ratingAverage: reviewAgg._avg.rating ?? 0,
      reviewCount: reviewAgg._count._all,
    };
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
      data: {
        storeId: store.id,
        ...dto,
        imageUrls: dto.imageUrls ?? [],
        specifications: dto.specifications ?? undefined,
      },
    });
  }

  async update(userId: string, productId: string, dto: UpdateProductDto) {
    const product = await this.findAndVerifyOwner(userId, productId);
    return this.prisma.product.update({
      where: { id: product.id },
      data: {
        ...dto,
        specifications: dto.specifications ?? undefined,
      },
    });
  }

  async remove(userId: string, productId: string) {
    const product = await this.findAndVerifyOwner(userId, productId);
    await this.prisma.product.update({ where: { id: product.id }, data: { isActive: false } });
    return { message: 'Product deleted' };
  }

  async listProductReviews(productId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [reviews, total, agg] = await Promise.all([
      this.prisma.productReview.findMany({
        where: { productId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: { include: { user: { select: { username: true } } } },
        },
      }),
      this.prisma.productReview.count({ where: { productId } }),
      this.prisma.productReview.aggregate({
        where: { productId },
        _avg: { rating: true },
      }),
    ]);
    return {
      data: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        reviewerName: r.buyer.user.username,
      })),
      total,
      page,
      limit,
      averageRating: agg._avg.rating ?? 0,
    };
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
