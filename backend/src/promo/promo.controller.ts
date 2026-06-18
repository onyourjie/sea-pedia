import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PromoService } from './promo.service';
import { CreatePromoDto } from '../voucher/voucher.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType } from '@prisma/client';

@ApiTags('promos')
@Controller('promos')
export class PromoController {
  constructor(private promoService: PromoService) {}

  @Get()
  list() {
    return this.promoService.list();
  }

  @Get('validate/:code')
  validate(@Param('code') code: string) {
    return this.promoService.validate(code);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.promoService.getById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  create(@Body() dto: CreatePromoDto) {
    return this.promoService.create(dto);
  }
}
