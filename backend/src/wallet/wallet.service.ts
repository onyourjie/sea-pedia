import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TopUpDto } from './wallet.dto';
import { WalletTxType } from '@prisma/client';

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
    const wallet = await this.prisma.wallet.findUnique({
      where: { buyerId: buyer.id },
      select: { id: true, balance: true, updatedAt: true },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return { id: wallet.id, balance: Number(wallet.balance), updatedAt: wallet.updatedAt };
  }

  async getTransactions(userId: string, type?: string, limit = 50, offset = 0) {
    const buyer = await this.getBuyer(userId);
    const wallet = buyer.wallet;
    if (!wallet) throw new NotFoundException('Wallet not found');

    const where: { walletId: string; type?: WalletTxType } = { walletId: wallet.id };
    if (type && Object.values(WalletTxType).includes(type as WalletTxType)) {
      where.type = type as WalletTxType;
    }

    const [rawTxs, total] = await Promise.all([
      this.prisma.walletTx.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.walletTx.count({ where }),
    ]);

    const transactions = rawTxs.map((tx) => ({
      ...tx,
      amount: Number(tx.amount),
      balanceAfter: Number(tx.balanceAfter),
    }));

    return { transactions, total, balance: Number(wallet.balance) };
  }

  async topUp(userId: string, dto: TopUpDto) {
    const buyer = await this.getBuyer(userId);
    const wallet = await this.prisma.wallet.update({
      where: { buyerId: buyer.id },
      data: { balance: { increment: dto.amount } },
    });
    const newBalance = Number(wallet.balance);
    await this.prisma.walletTx.create({
      data: {
        walletId: wallet.id,
        type: 'TOPUP',
        amount: dto.amount,
        balanceAfter: newBalance,
        description: `Top-up Rp ${dto.amount.toLocaleString('id-ID')}`,
      },
    });
    return { balance: newBalance, message: 'Top-up successful' };
  }
}
