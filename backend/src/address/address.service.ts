import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from '../wallet/wallet.dto';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  private async getBuyerId(userId: string) {
    const buyer = await this.prisma.buyer.findUnique({ where: { userId } });
    if (!buyer) throw new NotFoundException('Buyer profile not found');
    return buyer.id;
  }

  async list(userId: string) {
    const buyerId = await this.getBuyerId(userId);
    return this.prisma.address.findMany({ where: { buyerId }, orderBy: { isDefault: 'desc' } });
  }

  async create(userId: string, dto: CreateAddressDto) {
    const buyerId = await this.getBuyerId(userId);
    if (dto.isDefault) {
      await this.prisma.address.updateMany({ where: { buyerId }, data: { isDefault: false } });
    }
    return this.prisma.address.create({ data: { buyerId, ...dto } });
  }

  async update(userId: string, addressId: string, dto: UpdateAddressDto) {
    const buyerId = await this.getBuyerId(userId);
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.buyerId !== buyerId) throw new NotFoundException('Address not found');
    if (dto.isDefault) {
      await this.prisma.address.updateMany({ where: { buyerId }, data: { isDefault: false } });
    }
    return this.prisma.address.update({ where: { id: addressId }, data: dto });
  }

  async remove(userId: string, addressId: string) {
    const buyerId = await this.getBuyerId(userId);
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.buyerId !== buyerId) throw new NotFoundException('Address not found');
    await this.prisma.address.delete({ where: { id: addressId } });
    return { message: 'Address deleted' };
  }
}
