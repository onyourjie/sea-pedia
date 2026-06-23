import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StoreService } from './store.service';
import { CreateStoreDto, UpdateStoreDto } from './store.dto';
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

@ApiTags('stores')
@Controller('stores')
export class StoreController {
  constructor(private storeService: StoreService) {}

  @Get()
  @ApiPagination()
  @ApiEndpoint({
    summary: 'Daftar toko',
    successDescription: 'Daftar toko publik dengan pagination dan rating.',
    responseExample: { data: [], total: 0, page: 1, limit: 20 },
  })
  listStores(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.storeService.listStores(+page, +limit);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.SELLER)
  @ApiEndpoint({
    summary: 'Buat toko seller',
    status: 201,
    auth: true,
    roles: ['SELLER'],
    successDescription: 'Toko seller berhasil dibuat.',
  })
  createStore(@CurrentUser() user: any, @Body() dto: CreateStoreDto) {
    return this.storeService.create(user.id, dto);
  }

  @Patch()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.SELLER)
  @ApiEndpoint({
    summary: 'Perbarui toko seller',
    auth: true,
    roles: ['SELLER'],
    notFound: true,
    successDescription: 'Data toko berhasil diperbarui.',
  })
  updateStore(@CurrentUser() user: any, @Body() dto: UpdateStoreDto) {
    return this.storeService.update(user.id, dto);
  }

  @Get('seller/my-store')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.SELLER)
  @ApiEndpoint({
    summary: 'Ambil toko milik seller',
    auth: true,
    roles: ['SELLER'],
    notFound: true,
    successDescription: 'Detail toko milik seller beserta rating.',
  })
  getMyStore(@CurrentUser() user: any) {
    return this.storeService.getMyStore(user.id);
  }

  @Get(':storeId')
  @ApiIdParam('storeId', 'ID toko.')
  @ApiEndpoint({
    summary: 'Ambil detail toko',
    notFound: true,
    successDescription: 'Detail toko publik beserta rating.',
  })
  getStore(@Param('storeId') storeId: string) {
    return this.storeService.getStoreById(storeId);
  }
}
