import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleType } from '@prisma/client';

@ApiTags('delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Get('jobs/available')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DRIVER)
  listAvailable(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.deliveryService.listAvailableJobs(+page, +limit);
  }

  @Get('jobs/my')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DRIVER)
  myJobs(@CurrentUser() user: any) {
    return this.deliveryService.getDriverJobs(user.id);
  }

  @Get('jobs/:deliveryId')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DRIVER)
  getJobDetail(@Param('deliveryId') deliveryId: string) {
    return this.deliveryService.getJobDetail(deliveryId);
  }

  @Post('jobs/:deliveryId/take')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DRIVER)
  takeJob(@CurrentUser() user: any, @Param('deliveryId') deliveryId: string) {
    return this.deliveryService.takeJob(user.id, deliveryId);
  }

  @Post('jobs/:deliveryId/complete')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DRIVER)
  completeJob(@CurrentUser() user: any, @Param('deliveryId') deliveryId: string) {
    return this.deliveryService.completeJob(user.id, deliveryId);
  }
}
