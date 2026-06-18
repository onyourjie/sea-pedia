import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleType } from '@prisma/client';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get()
  listPublic(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.productService.listPublic(+page, +limit, search, storeId);
  }

  @Get(':productId')
  getDetail(@Param('productId') productId: string) {
    return this.productService.getPublicDetail(productId);
  }

  @Get('seller/list')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.SELLER)
  listMyProducts(@CurrentUser() user: any) {
    return this.productService.listSellerProducts(user.id);
  }

  @Post('seller')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.SELLER)
  create(@CurrentUser() user: any, @Body() dto: CreateProductDto) {
    return this.productService.create(user.id, dto);
  }

  @Patch('seller/:productId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.SELLER)
  update(@CurrentUser() user: any, @Param('productId') productId: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(user.id, productId, dto);
  }

  @Delete('seller/:productId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.SELLER)
  remove(@CurrentUser() user: any, @Param('productId') productId: string) {
    return this.productService.remove(user.id, productId);
  }
}
