import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        roles: { select: { role: true } },
        store: { select: { id: true, name: true } },
        buyer: {
          select: {
            id: true,
            wallet: { select: { balance: true } },
          },
        },
        driver: { select: { id: true, earnings: true } },
      },
    });
    if (!user) return null;
    return {
      ...user,
      roles: user.roles.map((r) => r.role),
      walletBalance: user.buyer?.wallet ? Number(user.buyer.wallet.balance) : null,
      driverEarnings: user.driver ? Number(user.driver.earnings) : null,
    };
  }
}
