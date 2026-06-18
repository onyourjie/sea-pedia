import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AddressService } from './address.service';
import { CreateAddressDto, UpdateAddressDto } from '../wallet/wallet.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleType } from '@prisma/client';

@ApiTags('addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.BUYER)
@Controller('addresses')
export class AddressController {
  constructor(private addressService: AddressService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.addressService.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateAddressDto) {
    return this.addressService.create(user.id, dto);
  }

  @Patch(':addressId')
  update(@CurrentUser() user: any, @Param('addressId') addressId: string, @Body() dto: UpdateAddressDto) {
    return this.addressService.update(user.id, addressId, dto);
  }

  @Delete(':addressId')
  remove(@CurrentUser() user: any, @Param('addressId') addressId: string) {
    return this.addressService.remove(user.id, addressId);
  }
}
