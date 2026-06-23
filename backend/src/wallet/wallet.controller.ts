import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { TopUpDto } from './wallet.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleType } from '@prisma/client';
import { ApiEndpoint } from '../common/swagger/api-docs.decorator';
import { ApiQuery } from '@nestjs/swagger';

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.BUYER)
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get()
  @ApiEndpoint({
    summary: 'Ambil saldo wallet',
    auth: true,
    roles: ['BUYER'],
    successDescription: 'Saldo wallet buyer.',
    responseExample: {
      id: 'clx1234567890',
      balance: 100000,
      updatedAt: '2026-06-23T10:00:00.000Z',
    },
  })
  getWallet(@CurrentUser() user: any) {
    return this.walletService.getWallet(user.id);
  }

  @Get('transactions')
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description: 'Filter tipe transaksi.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    minimum: 1,
    maximum: 100,
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    minimum: 0,
    example: 0,
  })
  @ApiEndpoint({
    summary: 'Ambil riwayat transaksi wallet',
    auth: true,
    roles: ['BUYER'],
    successDescription: 'Daftar transaksi dan saldo wallet saat ini.',
    responseExample: { transactions: [], total: 0, balance: 100000 },
  })
  getTransactions(
    @CurrentUser() user: any,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.walletService.getTransactions(
      user.id,
      type,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  @Post('topup')
  @ApiEndpoint({
    summary: 'Top up wallet secara internal',
    status: 201,
    auth: true,
    roles: ['BUYER'],
    successDescription: 'Saldo wallet berhasil ditambahkan.',
    responseExample: { balance: 150000, message: 'Top-up successful' },
  })
  topUp(@CurrentUser() user: any, @Body() dto: TopUpDto) {
    return this.walletService.topUp(user.id, dto);
  }
}
