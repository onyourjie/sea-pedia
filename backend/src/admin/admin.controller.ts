import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType, OrderStatus } from '@prisma/client';
import {
  ApiEndpoint,
  ApiPagination,
} from '../common/swagger/api-docs.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @ApiEndpoint({
    summary: 'Ringkasan dashboard admin',
    auth: true,
    roles: ['ADMIN'],
    successDescription: 'Jumlah entitas utama dan pesanan terlambat.',
    responseExample: {
      users: 0,
      stores: 0,
      products: 0,
      orders: 0,
      vouchers: 0,
      promos: 0,
      deliveries: 0,
      overdueOrders: 0,
    },
  })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  @ApiPagination()
  @ApiEndpoint({
    summary: 'Daftar pengguna untuk admin',
    auth: true,
    roles: ['ADMIN'],
    successDescription: 'Daftar pengguna dengan pagination.',
    responseExample: { data: [], total: 0, page: 1, limit: 20 },
  })
  listUsers(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.listUsers(+page, +limit);
  }

  @Get('orders')
  @ApiPagination()
  @ApiEndpoint({
    summary: 'Daftar pesanan untuk admin',
    auth: true,
    roles: ['ADMIN'],
    successDescription: 'Daftar seluruh pesanan dengan pagination.',
    responseExample: { data: [], total: 0, page: 1, limit: 20 },
  })
  listOrders(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: OrderStatus,
  ) {
    return this.adminService.listOrders(+page, +limit, status);
  }

  @Get('deliveries')
  @ApiPagination()
  @ApiEndpoint({
    summary: 'Daftar pengiriman untuk admin',
    auth: true,
    roles: ['ADMIN'],
    successDescription: 'Daftar seluruh pengiriman dengan pagination.',
    responseExample: { data: [], total: 0, page: 1, limit: 20 },
  })
  listDeliveries(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.listDeliveries(+page, +limit);
  }

  @Get('overdue')
  @ApiEndpoint({
    summary: 'Daftar pesanan terlambat',
    auth: true,
    roles: ['ADMIN'],
    successDescription: 'Pesanan yang melewati batas waktu pemrosesan.',
    responseExample: [],
  })
  listOverdue() {
    return this.adminService.listOverdueOrders();
  }

  @Get('system-date')
  @ApiEndpoint({
    summary: 'Ambil tanggal sistem simulasi',
    auth: true,
    roles: ['ADMIN'],
    successDescription: 'Tanggal sistem yang digunakan proses bisnis.',
    responseExample: { currentDate: '2026-06-23T00:00:00.000Z' },
  })
  getSystemDate() {
    return this.adminService.getSystemDate();
  }

  @Post('advance-day')
  @ApiEndpoint({
    summary: 'Majukan tanggal sistem satu hari',
    status: 201,
    auth: true,
    roles: ['ADMIN'],
    successDescription:
      'Tanggal sistem dimajukan dan pesanan terlambat diproses.',
    responseExample: {
      currentDate: '2026-06-24T00:00:00.000Z',
      overdueProcessed: 0,
    },
  })
  advanceDay() {
    return this.adminService.advanceDay();
  }

  @Post('process-overdue')
  @ApiEndpoint({
    summary: 'Proses pesanan terlambat',
    status: 201,
    auth: true,
    roles: ['ADMIN'],
    successDescription:
      'Pesanan terlambat diproses dan reversal terkait dicatat.',
  })
  processOverdue() {
    return this.adminService.processOverdueOrders();
  }

  @Get('income-reversals')
  @ApiPagination()
  @ApiEndpoint({
    summary: 'Daftar reversal pendapatan',
    auth: true,
    roles: ['ADMIN'],
    successDescription: 'Log pembalikan pendapatan dengan pagination.',
    responseExample: { data: [], total: 0, page: 1, limit: 20 },
  })
  listIncomeReversals(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.listIncomeReversals(+page, +limit);
  }
}
