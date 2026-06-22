import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType } from '@prisma/client';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  listUsers(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.listUsers(+page, +limit);
  }

  @Get('orders')
  listOrders(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.listOrders(+page, +limit);
  }

  @Get('deliveries')
  listDeliveries(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.listDeliveries(+page, +limit);
  }

  @Get('overdue')
  listOverdue() {
    return this.adminService.listOverdueOrders();
  }

  @Get('system-date')
  getSystemDate() {
    return this.adminService.getSystemDate();
  }

  @Post('advance-day')
  advanceDay() {
    return this.adminService.advanceDay();
  }

  @Post('process-overdue')
  processOverdue() {
    return this.adminService.processOverdueOrders();
  }

  @Get('income-reversals')
  listIncomeReversals(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.listIncomeReversals(+page, +limit);
  }
}
