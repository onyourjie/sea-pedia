import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, DeliveryMethod } from '@prisma/client';

// SLA in hours per delivery method
const SLA_HOURS: Record<DeliveryMethod, number> = {
  INSTANT: 4,
  NEXT_DAY: 24,
  REGULAR: 72,
};

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const [users, stores, products, orders, vouchers, promos, deliveries, overdueOrders] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.store.count(),
        this.prisma.product.count({ where: { isActive: true } }),
        this.prisma.order.groupBy({ by: ['status'], _count: true }),
        this.prisma.voucher.count(),
        this.prisma.promo.count(),
        this.prisma.delivery.count(),
        this.prisma.order.count({ where: { isOverdue: true } }),
      ]);

    return { users, stores, products, orders, vouchers, promos, deliveries, overdueOrders };
  }

  async listUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: { roles: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { data, total, page, limit };
  }

  async listOrders(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        include: {
          store: { select: { name: true } },
          buyer: { include: { user: { select: { username: true } } } },
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count(),
    ]);
    return { data, total, page, limit };
  }

  async listDeliveries(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.delivery.findMany({
        skip,
        take: limit,
        include: {
          order: { select: { status: true, deliveryMethod: true, total: true } },
          driver: { include: { user: { select: { username: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.delivery.count(),
    ]);
    return { data, total, page, limit };
  }

  async listOverdueOrders() {
    return this.prisma.order.findMany({
      where: { isOverdue: true },
      include: {
        store: { select: { name: true } },
        buyer: { include: { user: { select: { username: true } } } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSystemDate() {
    let sys = await this.prisma.systemDate.findUnique({ where: { id: 1 } });
    if (!sys) {
      sys = await this.prisma.systemDate.create({ data: { id: 1, currentDate: new Date() } });
    }
    return sys;
  }

  async advanceDay() {
    const sys = await this.getSystemDate();
    const next = new Date(sys.currentDate);
    next.setDate(next.getDate() + 1);
    const updated = await this.prisma.systemDate.update({
      where: { id: 1 },
      data: { currentDate: next },
    });
    // Run overdue check after advancing day
    const processed = await this.processOverdueOrders(next);
    return { currentDate: updated.currentDate, overdueProcessed: processed };
  }

  async processOverdueOrders(now?: Date) {
    const currentDate = now ?? (await this.getSystemDate()).currentDate;
    let processed = 0;

    // Only orders not yet completed and not already overdue are eligible.
    // PESANAN_SELESAI is a terminal success state and is never reversed by SLA.
    const activeOrders = await this.prisma.order.findMany({
      where: {
        isOverdue: false,
        status: { in: [OrderStatus.SEDANG_DIKEMAS, OrderStatus.MENUNGGU_PENGIRIM, OrderStatus.SEDANG_DIKIRIM] },
      },
      include: {
        items: true,
        buyer: { include: { wallet: true } },
        delivery: { include: { driver: true, earningLog: true } },
      },
    });

    for (const order of activeOrders) {
      const slaHours = SLA_HOURS[order.deliveryMethod];
      const deadline = new Date(order.createdAt);
      deadline.setHours(deadline.getHours() + slaHours);

      if (currentDate >= deadline) {
        await this.prisma.$transaction(async (tx) => {
          // Idempotency: re-check inside the transaction in case another worker raced us.
          const fresh = await tx.order.findUnique({ where: { id: order.id } });
          if (!fresh || fresh.isOverdue || fresh.status === OrderStatus.PESANAN_SELESAI) return;

          await tx.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.DIKEMBALIKAN,
              isOverdue: true,
              statusHistory: {
                create: {
                  status: OrderStatus.DIKEMBALIKAN,
                  note: `Auto-returned: SLA exceeded (${slaHours}h for ${order.deliveryMethod})`,
                },
              },
            },
          });

          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }

          if (order.buyer.wallet) {
            const updatedWallet = await tx.wallet.update({
              where: { id: order.buyer.wallet.id },
              data: { balance: { increment: order.total } },
            });
            await tx.walletTx.create({
              data: {
                walletId: order.buyer.wallet.id,
                type: 'REFUND',
                amount: order.total,
                balanceAfter: updatedWallet.balance,
                description: `Auto-refund for overdue order ${order.id}`,
                orderId: order.id,
              },
            });
          }

          // Income reversal audit: seller income (and any driver earning that may
          // already have been booked) is explicitly reversed for traceability.
          // Status DIKEMBALIKAN already excludes the order from income reports,
          // but spec L6 requires a visible reversal trace.
          let reversedEarning = 0;
          let driverIdForLog: string | null = null;
          if (order.delivery?.earningLog && order.delivery.driverId) {
            reversedEarning = Number(order.delivery.earningLog.amount);
            driverIdForLog = order.delivery.driverId;
            await tx.driver.update({
              where: { id: order.delivery.driverId },
              data: { earnings: { decrement: reversedEarning } },
            });
            await tx.driverEarningLog.delete({
              where: { id: order.delivery.earningLog.id },
            });
          }

          await tx.incomeReversalLog.create({
            data: {
              orderId: order.id,
              storeId: order.storeId,
              driverId: driverIdForLog,
              reversedIncome: order.total,
              reversedEarning,
              reason: `SLA exceeded (${slaHours}h for ${order.deliveryMethod})`,
            },
          });
        });
        processed++;
      }
    }

    return processed;
  }

  async listIncomeReversals(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.incomeReversalLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.incomeReversalLog.count(),
    ]);
    return { data, total, page, limit };
  }
}
