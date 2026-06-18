import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TopUpDto } from './wallet.dto';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  private async getBuyer(userId: string) {
    const buyer = await this.prisma.buyer.findUnique({
      where: { userId },
      include: { wallet: true },
    });
    if (!buyer) throw new NotFoundException('Buyer profile not found');
    return buyer;
  }

  async getWallet(userId: string) {
    const buyer = await this.getBuyer(userId);
    return this.prisma.wallet.findUnique({
      where: { buyerId: buyer.id },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
  }

  async topUp(userId: string, dto: TopUpDto) {
    const buyer = await this.getBuyer(userId);
    const wallet = await this.prisma.wallet.update({
      where: { buyerId: buyer.id },
      data: { balance: { increment: dto.amount } },
    });
    await this.prisma.walletTx.create({
      data: {
        walletId: wallet.id,
        type: 'TOPUP',
        amount: dto.amount,
        description: `Top-up Rp ${dto.amount.toLocaleString('id-ID')}`,
      },
    });
    return { balance: wallet.balance, message: 'Top-up successful' };
  }
}
