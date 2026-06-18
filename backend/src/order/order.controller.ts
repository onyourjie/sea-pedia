import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CheckoutDto } from './order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleType } from '@prisma/client';

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
  checkout(@CurrentUser() user: any, @Body() dto: CheckoutDto) {
    return this.orderService.checkout(user.id, dto);
  }

  @Get('buyer')
  @UseGuards(RolesGuard)
  @Roles(RoleType.BUYER)
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
  getBuyerReport(@CurrentUser() user: any) {
    return this.orderService.getBuyerSpendingReport(user.id);
  }

  @Get('buyer/:orderId')
  @UseGuards(RolesGuard)
  @Roles(RoleType.BUYER)
  getBuyerOrderDetail(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.orderService.getBuyerOrderDetail(user.id, orderId);
  }

  // Seller endpoints
  @Get('seller')
  @UseGuards(RolesGuard)
  @Roles(RoleType.SELLER)
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
  getSellerReport(@CurrentUser() user: any) {
    return this.orderService.getSellerIncomeReport(user.id);
  }

  @Get('seller/:orderId')
  @UseGuards(RolesGuard)
  @Roles(RoleType.SELLER)
  getSellerOrderDetail(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.orderService.getSellerOrderDetail(user.id, orderId);
  }

  @Post('seller/:orderId/process')
  @UseGuards(RolesGuard)
  @Roles(RoleType.SELLER)
  processOrder(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.orderService.sellerProcessOrder(user.id, orderId);
  }
}
