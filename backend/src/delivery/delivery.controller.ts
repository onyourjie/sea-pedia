import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
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

@ApiTags('delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Get('jobs/available')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DRIVER)
  @ApiPagination()
  @ApiEndpoint({
    summary: 'Daftar pekerjaan pengiriman tersedia',
    auth: true,
    roles: ['DRIVER'],
    successDescription: 'Pekerjaan pengiriman yang belum diambil driver.',
    responseExample: { data: [], total: 0, page: 1, limit: 20 },
  })
  listAvailable(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.deliveryService.listAvailableJobs(+page, +limit);
  }

  @Get('jobs/my')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DRIVER)
  @ApiEndpoint({
    summary: 'Daftar pekerjaan driver',
    auth: true,
    roles: ['DRIVER'],
    successDescription: 'Pekerjaan driver beserta total pendapatan.',
    responseExample: { jobs: [], totalEarnings: 0 },
  })
  myJobs(@CurrentUser() user: any) {
    return this.deliveryService.getDriverJobs(user.id);
  }

  @Get('jobs/:deliveryId')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DRIVER)
  @ApiIdParam('deliveryId', 'ID pengiriman.')
  @ApiEndpoint({
    summary: 'Ambil detail pekerjaan pengiriman',
    auth: true,
    roles: ['DRIVER'],
    notFound: true,
    successDescription: 'Detail pekerjaan pengiriman.',
  })
  getJobDetail(@Param('deliveryId') deliveryId: string) {
    return this.deliveryService.getJobDetail(deliveryId);
  }

  @Post('jobs/:deliveryId/take')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DRIVER)
  @ApiIdParam('deliveryId', 'ID pengiriman yang diambil.')
  @ApiEndpoint({
    summary: 'Ambil pekerjaan pengiriman',
    status: 201,
    auth: true,
    roles: ['DRIVER'],
    notFound: true,
    successDescription: 'Pekerjaan berhasil ditugaskan ke driver.',
    responseExample: {
      message: 'Job taken successfully',
      deliveryId: 'clx1234567890',
    },
  })
  takeJob(@CurrentUser() user: any, @Param('deliveryId') deliveryId: string) {
    return this.deliveryService.takeJob(user.id, deliveryId);
  }

  @Post('jobs/:deliveryId/complete')
  @UseGuards(RolesGuard)
  @Roles(RoleType.DRIVER)
  @ApiIdParam('deliveryId', 'ID pengiriman yang diselesaikan.')
  @ApiEndpoint({
    summary: 'Selesaikan pekerjaan pengiriman',
    status: 201,
    auth: true,
    roles: ['DRIVER'],
    notFound: true,
    successDescription:
      'Pengiriman diselesaikan dan pendapatan driver dicatat.',
    responseExample: { message: 'Job completed', earning: 15000 },
  })
  completeJob(
    @CurrentUser() user: any,
    @Param('deliveryId') deliveryId: string,
  ) {
    return this.deliveryService.completeJob(user.id, deliveryId);
  }
}
