import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CheckoutDto } from './order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleType } from '@prisma/client';
import {
  ApiEndpoint,
  ApiIdParam,
  ApiPagination,
} from '../common/swagger/api-docs.decorator';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  // Buyer endpoints
  @Post('checkout')
  @UseGuards(RolesGuard)
  @Roles(RoleType.BUYER)
  @ApiEndpoint({
    summary: 'Checkout keranjang buyer',
    status: 201,
    auth: true,
    roles: ['BUYER'],
    successDescription: 'Pesanan dan pengiriman berhasil dibuat.',
    responseExample: {
      message: 'Checkout successful',
      orderId: 'clx1234567890',
    },
  })
  checkout(@CurrentUser() user: any, @Body() dto: CheckoutDto) {
    return this.orderService.checkout(user.id, dto);
  }

  @Get('buyer')
  @UseGuards(RolesGuard)
  @Roles(RoleType.BUYER)
  @ApiPagination()
  @ApiEndpoint({
    summary: 'Daftar pesanan buyer',
    auth: true,
    roles: ['BUYER'],
    successDescription: 'Daftar pesanan buyer dengan pagination.',
    responseExample: { data: [], total: 0, page: 1, limit: 20 },
  })
  getBuyerOrders(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.orderService.getBuyerOrders(user.id, +page, +limit);
  }

  @Get('buyer/report')
  @UseGuards(RolesGuard)
  @Roles(RoleType.BUYER)
  @ApiEndpoint({
    summary: 'Laporan pengeluaran buyer',
    auth: true,
    roles: ['BUYER'],
    successDescription: 'Ringkasan total belanja dan statistik pesanan buyer.',
  })
  getBuyerReport(@CurrentUser() user: any) {
    return this.orderService.getBuyerSpendingReport(user.id);
  }

  @Get('buyer/:orderId')
  @UseGuards(RolesGuard)
  @Roles(RoleType.BUYER)
  @ApiIdParam('orderId', 'ID pesanan buyer.')
  @ApiEndpoint({
    summary: 'Detail pesanan buyer',
    auth: true,
    roles: ['BUYER'],
    notFound: true,
    successDescription:
      'Detail pesanan, item, toko, pembayaran, dan pengiriman.',
  })
  getBuyerOrderDetail(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    return this.orderService.getBuyerOrderDetail(user.id, orderId);
  }

  // Seller endpoints
  @Get('seller')
  @UseGuards(RolesGuard)
  @Roles(RoleType.SELLER)
  @ApiPagination()
  @ApiEndpoint({
    summary: 'Daftar pesanan seller',
    auth: true,
    roles: ['SELLER'],
    successDescription: 'Daftar pesanan yang berisi produk seller.',
    responseExample: { data: [], total: 0, page: 1, limit: 20 },
  })
  getSellerOrders(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.orderService.getSellerOrders(user.id, +page, +limit);
  }

  @Get('seller/report')
  @UseGuards(RolesGuard)
  @Roles(RoleType.SELLER)
  @ApiEndpoint({
    summary: 'Laporan pendapatan seller',
    auth: true,
    roles: ['SELLER'],
    successDescription: 'Ringkasan pendapatan dan statistik penjualan seller.',
  })
  getSellerReport(@CurrentUser() user: any) {
    return this.orderService.getSellerIncomeReport(user.id);
  }

  @Get('seller/:orderId')
  @UseGuards(RolesGuard)
  @Roles(RoleType.SELLER)
  @ApiIdParam('orderId', 'ID pesanan seller.')
  @ApiEndpoint({
    summary: 'Detail pesanan seller',
    auth: true,
    roles: ['SELLER'],
    notFound: true,
    successDescription: 'Detail pesanan untuk seller terkait.',
  })
  getSellerOrderDetail(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    return this.orderService.getSellerOrderDetail(user.id, orderId);
  }

  @Post('seller/:orderId/process')
  @UseGuards(RolesGuard)
  @Roles(RoleType.SELLER)
  @ApiIdParam('orderId', 'ID pesanan yang akan diproses.')
  @ApiEndpoint({
    summary: 'Proses pesanan oleh seller',
    status: 201,
    auth: true,
    roles: ['SELLER'],
    notFound: true,
    successDescription:
      'Status pesanan diperbarui ke tahap pemrosesan berikutnya.',
  })
  processOrder(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.orderService.sellerProcessOrder(user.id, orderId);
  }
}
