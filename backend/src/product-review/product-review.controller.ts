import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProductReviewService } from './product-review.service';
import { CreateProductReviewDto } from './product-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleType } from '@prisma/client';
import { ApiEndpoint } from '../common/swagger/api-docs.decorator';

@ApiTags('product-reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.BUYER)
@Controller('product-reviews')
export class ProductReviewController {
  constructor(private service: ProductReviewService) {}

  @Post()
  @ApiEndpoint({
    summary: 'Buat ulasan produk',
    status: 201,
    auth: true,
    roles: ['BUYER'],
    notFound: true,
    successDescription: 'Ulasan produk berhasil dibuat untuk item pesanan.',
  })
  create(@CurrentUser() user: any, @Body() dto: CreateProductReviewDto) {
    return this.service.create(user.id, dto);
  }

  @Get('mine')
  @ApiEndpoint({
    summary: 'Daftar ulasan produk milik buyer',
    auth: true,
    roles: ['BUYER'],
    successDescription: 'Seluruh ulasan produk yang dibuat buyer.',
    responseExample: [],
  })
  listMine(@CurrentUser() user: any) {
    return this.service.listMyReviews(user.id);
  }
}
