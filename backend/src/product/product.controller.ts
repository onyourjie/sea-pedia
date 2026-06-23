import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleType } from '@prisma/client';
import {
  ApiEndpoint,
  ApiIdParam,
  ApiLimit,
  ApiPagination,
} from '../common/swagger/api-docs.decorator';
import { ApiQuery } from '@nestjs/swagger';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get()
  @ApiPagination()
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Pencarian nama produk.',
  })
  @ApiQuery({
    name: 'storeId',
    required: false,
    type: String,
    description: 'Filter berdasarkan ID toko.',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['newest', 'price_asc', 'price_desc', 'bestseller'],
    description: 'Urutan hasil.',
  })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, minimum: 0 })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, minimum: 0 })
  @ApiQuery({
    name: 'promo',
    required: false,
    enum: ['0', '1'],
    description: 'Isi 1 untuk produk promo.',
  })
  @ApiEndpoint({
    summary: 'Cari dan filter produk',
    successDescription: 'Daftar produk publik dengan pagination dan rating.',
    responseExample: { data: [], total: 0, page: 1, limit: 20 },
  })
  listPublic(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('storeId') storeId?: string,
    @Query('sort') sort?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('promo') promo?: string,
  ) {
    return this.productService.listPublic(
      +page,
      +limit,
      search,
      storeId,
      sort,
      minPrice ? +minPrice : undefined,
      maxPrice ? +maxPrice : undefined,
      promo === '1',
    );
  }

  @Get('bestsellers')
  @ApiLimit()
  @ApiEndpoint({
    summary: 'Daftar produk terlaris',
    successDescription: 'Produk diurutkan berdasarkan jumlah penjualan.',
    responseExample: { data: [], total: 0, page: 1, limit: 10 },
  })
  listBestsellers(@Query('limit') limit = 10) {
    return this.productService.listBestsellers({ limit: +limit });
  }

  @Get('hot-deals')
  @ApiLimit()
  @ApiEndpoint({
    summary: 'Daftar promo produk terbaik',
    successDescription: 'Produk dengan diskon aktif terbesar.',
    responseExample: { data: [], total: 0 },
  })
  listHotDeals(@Query('limit') limit = 10) {
    return this.productService.listHotDeals(+limit);
  }

  @Get('new-arrivals')
  @ApiLimit()
  @ApiEndpoint({
    summary: 'Daftar produk terbaru',
    successDescription: 'Produk terbaru berdasarkan waktu pembuatan.',
    responseExample: { data: [], total: 0 },
  })
  listNewArrivals(@Query('limit') limit = 10) {
    return this.productService.listNewArrivals(+limit);
  }

  @Get('seller/list')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.SELLER)
  @ApiEndpoint({
    summary: 'Daftar produk milik seller',
    auth: true,
    roles: ['SELLER'],
    successDescription: 'Seluruh produk milik toko seller.',
    responseExample: [],
  })
  listMyProducts(@CurrentUser() user: any) {
    return this.productService.listSellerProducts(user.id);
  }

  @Post('seller')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.SELLER)
  @ApiEndpoint({
    summary: 'Buat produk seller',
    status: 201,
    auth: true,
    roles: ['SELLER'],
    successDescription: 'Produk berhasil dibuat.',
  })
  create(@CurrentUser() user: any, @Body() dto: CreateProductDto) {
    return this.productService.create(user.id, dto);
  }

  @Patch('seller/:productId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.SELLER)
  @ApiIdParam('productId', 'ID produk yang diperbarui.')
  @ApiEndpoint({
    summary: 'Perbarui produk seller',
    auth: true,
    roles: ['SELLER'],
    notFound: true,
    successDescription: 'Produk berhasil diperbarui.',
  })
  update(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(user.id, productId, dto);
  }

  @Delete('seller/:productId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.SELLER)
  @ApiIdParam('productId', 'ID produk yang dihapus.')
  @ApiEndpoint({
    summary: 'Hapus produk seller',
    auth: true,
    roles: ['SELLER'],
    notFound: true,
    successDescription: 'Produk berhasil dihapus.',
    responseExample: { message: 'Product deleted' },
  })
  remove(@CurrentUser() user: any, @Param('productId') productId: string) {
    return this.productService.remove(user.id, productId);
  }

  @Get(':productId/reviews')
  @ApiIdParam('productId', 'ID produk.')
  @ApiPagination()
  @ApiEndpoint({
    summary: 'Daftar ulasan produk',
    successDescription: 'Ulasan produk dengan pagination dan ringkasan rating.',
    responseExample: {
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      ratingAverage: 0,
    },
  })
  listReviews(
    @Param('productId') productId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.productService.listProductReviews(productId, +page, +limit);
  }

  @Get(':productId')
  @ApiIdParam('productId', 'ID produk.')
  @ApiEndpoint({
    summary: 'Ambil detail produk',
    notFound: true,
    successDescription: 'Detail produk publik beserta toko dan rating.',
  })
  getDetail(@Param('productId') productId: string) {
    return this.productService.getPublicDetail(productId);
  }
}
