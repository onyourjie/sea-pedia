import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

const DRIVER_EARNING_RATE = 0.8; // Driver earns 80% of delivery fee

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  private async getDriver(userId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Driver profile not found');
    return driver;
  }

  async listAvailableJobs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [jobs, total] = await Promise.all([
      this.prisma.delivery.findMany({
        where: { driverId: null, order: { status: OrderStatus.MENUNGGU_PENGIRIM } },
        skip,
        take: limit,
        include: {
          order: {
            include: {
              store: { select: { id: true, name: true } },
              address: true,
              items: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.delivery.count({
        where: { driverId: null, order: { status: OrderStatus.MENUNGGU_PENGIRIM } },
      }),
    ]);
    return { data: jobs, total, page, limit };
  }

  async getJobDetail(deliveryId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          include: {
            store: { select: { id: true, name: true } },
            address: true,
            items: true,
            statusHistory: { orderBy: { createdAt: 'asc' } },
          },
        },
        driver: { include: { user: { select: { username: true } } } },
      },
    });
    if (!delivery) throw new NotFoundException('Delivery job not found');
    return delivery;
  }

  async takeJob(userId: string, deliveryId: string) {
    const driver = await this.getDriver(userId);

    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true },
    });
    if (!delivery) throw new NotFoundException('Delivery job not found');
    if (delivery.order.status !== OrderStatus.MENUNGGU_PENGIRIM)
      throw new BadRequestException('This job is not available for pickup');

    // Check driver doesn't already have an active job
    const activeJob = await this.prisma.delivery.findFirst({
      where: { driverId: driver.id, completedAt: null, order: { status: OrderStatus.SEDANG_DIKIRIM } },
    });
    if (activeJob) throw new BadRequestException('You already have an active delivery job');

    return this.prisma.$transaction(async (tx) => {
      // Atomic update: only succeeds if driverId is still null (race condition safe)
      const result = await tx.delivery.updateMany({
        where: { id: deliveryId, driverId: null },
        data: { driverId: driver.id, takenAt: new Date() },
      });
      if (result.count === 0) throw new ConflictException('Job already taken by another driver');

      await tx.order.update({
        where: { id: delivery.orderId },
        data: {
          status: OrderStatus.SEDANG_DIKIRIM,
          statusHistory: {
            create: { status: OrderStatus.SEDANG_DIKIRIM, note: `Driver took the job` },
          },
        },
      });
      return { message: 'Job taken successfully', deliveryId };
    });
  }

  async completeJob(userId: string, deliveryId: string) {
    const driver = await this.getDriver(userId);

    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true },
    });
    if (!delivery) throw new NotFoundException('Delivery job not found');
    if (delivery.driverId !== driver.id) throw new BadRequestException('This is not your job');
    if (delivery.order.status !== OrderStatus.SEDANG_DIKIRIM)
      throw new BadRequestException('Cannot complete job in current status');

    const earning = Number(delivery.order.deliveryFee) * DRIVER_EARNING_RATE;

    return this.prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: deliveryId },
        data: { completedAt: new Date() },
      });
      await tx.order.update({
        where: { id: delivery.orderId },
        data: {
          status: OrderStatus.PESANAN_SELESAI,
          statusHistory: {
            create: { status: OrderStatus.PESANAN_SELESAI, note: 'Delivery completed by driver' },
          },
        },
      });
      await tx.driver.update({
        where: { id: driver.id },
        data: { earnings: { increment: earning } },
      });
      await tx.driverEarningLog.create({
        data: {
          driverId: driver.id,
          deliveryId,
          orderId: delivery.orderId,
          amount: earning,
          deliveryFee: delivery.order.deliveryFee,
        },
      });
      return { message: 'Job completed', earning };
    });
  }

  async getDriverJobs(userId: string) {
    const driver = await this.getDriver(userId);
    const jobs = await this.prisma.delivery.findMany({
      where: { driverId: driver.id },
      include: {
        order: {
          include: {
            store: { select: { id: true, name: true } },
            address: true,
          },
        },
        earningLog: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    const earning = Number(driver.earnings);
    return { jobs, totalEarnings: earning };
  }
}
