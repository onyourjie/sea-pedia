import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PromoService } from './promo.service';
import { CreatePromoDto } from '../voucher/voucher.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType } from '@prisma/client';
import { ApiEndpoint, ApiIdParam } from '../common/swagger/api-docs.decorator';

@ApiTags('promos')
@Controller('promos')
export class PromoController {
  constructor(private promoService: PromoService) {}

  @Get()
  @ApiEndpoint({
    summary: 'Daftar promo',
    successDescription: 'Daftar promo diurutkan dari yang terbaru.',
    responseExample: [],
  })
  list() {
    return this.promoService.list();
  }

  @Get('validate/:code')
  @ApiIdParam('code', 'Kode promo yang divalidasi.', 'PROMO50K')
  @ApiEndpoint({
    summary: 'Validasi kode promo',
    successDescription: 'Status validitas beserta alasan atau detail promo.',
    responseExample: { valid: true, promo: {} },
  })
  validate(@Param('code') code: string) {
    return this.promoService.validate(code);
  }

  @Get(':id')
  @ApiIdParam('id', 'ID promo.')
  @ApiEndpoint({
    summary: 'Ambil detail promo',
    notFound: true,
    successDescription: 'Detail promo.',
  })
  getById(@Param('id') id: string) {
    return this.promoService.getById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiEndpoint({
    summary: 'Buat promo',
    status: 201,
    auth: true,
    roles: ['ADMIN'],
    successDescription: 'Promo berhasil dibuat.',
  })
  create(@Body() dto: CreatePromoDto) {
    return this.promoService.create(dto);
  }
}
