import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StoreService } from './store.service';
import { CreateStoreDto, UpdateStoreDto } from './store.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleType } from '@prisma/client';

@ApiTags('stores')
@Controller('stores')
export class StoreController {
  constructor(private storeService: StoreService) {}

  @Get()
  listStores(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.storeService.listStores(+page, +limit);
  }

  @Get(':storeId')
  getStore(@Param('storeId') storeId: string) {
    return this.storeService.getStoreById(storeId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.SELLER)
  createStore(@CurrentUser() user: any, @Body() dto: CreateStoreDto) {
    return this.storeService.create(user.id, dto);
  }

  @Patch()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.SELLER)
  updateStore(@CurrentUser() user: any, @Body() dto: UpdateStoreDto) {
    return this.storeService.update(user.id, dto);
  }

  @Get('seller/my-store')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.SELLER)
  getMyStore(@CurrentUser() user: any) {
    return this.storeService.getMyStore(user.id);
  }
}
