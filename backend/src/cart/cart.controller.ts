import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './cart.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleType } from '@prisma/client';
import { ApiEndpoint, ApiIdParam } from '../common/swagger/api-docs.decorator';

@ApiTags('cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.BUYER)
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  @ApiEndpoint({
    summary: 'Ambil keranjang buyer',
    auth: true,
    roles: ['BUYER'],
    successDescription: 'Keranjang buyer beserta item dan total harga.',
  })
  getCart(@CurrentUser() user: any) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  @ApiEndpoint({
    summary: 'Tambahkan produk ke keranjang',
    status: 201,
    auth: true,
    roles: ['BUYER'],
    notFound: true,
    successDescription:
      'Produk ditambahkan dan keranjang terbaru dikembalikan.',
  })
  addItem(@CurrentUser() user: any, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(user.id, dto);
  }

  @Patch('items/:productId')
  @ApiIdParam('productId', 'ID produk dalam keranjang.')
  @ApiEndpoint({
    summary: 'Ubah jumlah item keranjang',
    auth: true,
    roles: ['BUYER'],
    notFound: true,
    successDescription:
      'Jumlah item diperbarui dan keranjang terbaru dikembalikan.',
  })
  updateItem(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.id, productId, dto);
  }

  @Delete('items/:productId')
  @ApiIdParam('productId', 'ID produk yang dihapus dari keranjang.')
  @ApiEndpoint({
    summary: 'Hapus item dari keranjang',
    auth: true,
    roles: ['BUYER'],
    notFound: true,
    successDescription: 'Item dihapus dan keranjang terbaru dikembalikan.',
  })
  removeItem(@CurrentUser() user: any, @Param('productId') productId: string) {
    return this.cartService.removeItem(user.id, productId);
  }

  @Delete('clear')
  @ApiEndpoint({
    summary: 'Kosongkan keranjang',
    auth: true,
    roles: ['BUYER'],
    successDescription: 'Seluruh item keranjang dihapus.',
    responseExample: { message: 'Cart cleared' },
  })
  clearCart(@CurrentUser() user: any) {
    return this.cartService.clearCart(user.id);
  }
}
