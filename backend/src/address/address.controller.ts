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
import { AddressService } from './address.service';
import { CreateAddressDto, UpdateAddressDto } from '../wallet/wallet.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleType } from '@prisma/client';
import { ApiEndpoint, ApiIdParam } from '../common/swagger/api-docs.decorator';

@ApiTags('addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.BUYER)
@Controller('addresses')
export class AddressController {
  constructor(private addressService: AddressService) {}

  @Get()
  @ApiEndpoint({
    summary: 'Daftar alamat buyer',
    auth: true,
    roles: ['BUYER'],
    successDescription:
      'Daftar alamat buyer, alamat utama berada di urutan pertama.',
    responseExample: [],
  })
  list(@CurrentUser() user: any) {
    return this.addressService.list(user.id);
  }

  @Post()
  @ApiEndpoint({
    summary: 'Tambah alamat buyer',
    status: 201,
    auth: true,
    roles: ['BUYER'],
    successDescription: 'Alamat baru berhasil dibuat.',
  })
  create(@CurrentUser() user: any, @Body() dto: CreateAddressDto) {
    return this.addressService.create(user.id, dto);
  }

  @Patch(':addressId')
  @ApiIdParam('addressId', 'ID alamat yang diperbarui.')
  @ApiEndpoint({
    summary: 'Perbarui alamat buyer',
    auth: true,
    roles: ['BUYER'],
    notFound: true,
    successDescription: 'Alamat berhasil diperbarui.',
  })
  update(
    @CurrentUser() user: any,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressService.update(user.id, addressId, dto);
  }

  @Delete(':addressId')
  @ApiIdParam('addressId', 'ID alamat yang dihapus.')
  @ApiEndpoint({
    summary: 'Hapus alamat buyer',
    auth: true,
    roles: ['BUYER'],
    notFound: true,
    successDescription: 'Alamat berhasil dihapus.',
    responseExample: { message: 'Address deleted' },
  })
  remove(@CurrentUser() user: any, @Param('addressId') addressId: string) {
    return this.addressService.remove(user.id, addressId);
  }
}
