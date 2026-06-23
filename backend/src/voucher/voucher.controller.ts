import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VoucherService } from './voucher.service';
import { CreateVoucherDto } from './voucher.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType } from '@prisma/client';
import { ApiEndpoint, ApiIdParam } from '../common/swagger/api-docs.decorator';

@ApiTags('vouchers')
@Controller('vouchers')
export class VoucherController {
  constructor(private voucherService: VoucherService) {}

  @Get()
  @ApiEndpoint({
    summary: 'Daftar voucher',
    successDescription: 'Daftar voucher diurutkan dari yang terbaru.',
    responseExample: [],
  })
  list() {
    return this.voucherService.list();
  }

  @Get('validate/:code')
  @ApiIdParam('code', 'Kode voucher yang divalidasi.', 'SAVE10')
  @ApiEndpoint({
    summary: 'Validasi kode voucher',
    successDescription: 'Status validitas beserta alasan atau detail voucher.',
    responseExample: { valid: true, voucher: {} },
  })
  validate(@Param('code') code: string) {
    return this.voucherService.validate(code);
  }

  @Get(':id')
  @ApiIdParam('id', 'ID voucher.')
  @ApiEndpoint({
    summary: 'Ambil detail voucher',
    notFound: true,
    successDescription: 'Detail voucher.',
  })
  getById(@Param('id') id: string) {
    return this.voucherService.getById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiEndpoint({
    summary: 'Buat voucher',
    status: 201,
    auth: true,
    roles: ['ADMIN'],
    successDescription: 'Voucher berhasil dibuat.',
  })
  create(@Body() dto: CreateVoucherDto) {
    return this.voucherService.create(dto);
  }
}
