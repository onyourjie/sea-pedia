import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

type TxFn = (tx: typeof mockPrisma) => Promise<unknown>;

const mockPrisma = {
  driver: { findUnique: jest.fn(), update: jest.fn() },
  delivery: { findUnique: jest.fn(), updateMany: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
  order: { update: jest.fn() },
  driverEarningLog: { create: jest.fn() },
  $transaction: jest.fn(),
};

describe('DeliveryService', () => {
  let service: DeliveryService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (fn: TxFn) => fn(mockPrisma));

    const moduleRef = await Test.createTestingModule({
      providers: [
        DeliveryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = moduleRef.get(DeliveryService);
  });

  describe('takeJob', () => {
    it('rejects when delivery already taken (race condition)', async () => {
      mockPrisma.driver.findUnique.mockResolvedValue({ id: 'd1' });
      mockPrisma.delivery.findUnique.mockResolvedValue({
        id: 'del-1', driverId: null, orderId: 'o1',
        order: { status: OrderStatus.MENUNGGU_PENGIRIM },
      });
      mockPrisma.delivery.findFirst.mockResolvedValue(null); // no active job
      // Simulate: another driver took it between check and update
      mockPrisma.delivery.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.takeJob('user-1', 'del-1')).rejects.toThrow(ConflictException);
    });

    it('rejects taking a job whose order is not MENUNGGU_PENGIRIM', async () => {
      mockPrisma.driver.findUnique.mockResolvedValue({ id: 'd1' });
      mockPrisma.delivery.findUnique.mockResolvedValue({
        id: 'del-1', driverId: null, orderId: 'o1',
        order: { status: OrderStatus.SEDANG_DIKEMAS },
      });

      await expect(service.takeJob('user-1', 'del-1')).rejects.toThrow(BadRequestException);
    });

    it('rejects driver who already has an active job', async () => {
      mockPrisma.driver.findUnique.mockResolvedValue({ id: 'd1' });
      mockPrisma.delivery.findUnique.mockResolvedValue({
        id: 'del-1', driverId: null, orderId: 'o1',
        order: { status: OrderStatus.MENUNGGU_PENGIRIM },
      });
      mockPrisma.delivery.findFirst.mockResolvedValue({ id: 'active-job' });

      await expect(service.takeJob('user-1', 'del-1')).rejects.toThrow(/active delivery job/i);
    });

    it('successfully takes job and moves order to SEDANG_DIKIRIM', async () => {
      mockPrisma.driver.findUnique.mockResolvedValue({ id: 'd1' });
      mockPrisma.delivery.findUnique.mockResolvedValue({
        id: 'del-1', driverId: null, orderId: 'o1',
        order: { status: OrderStatus.MENUNGGU_PENGIRIM },
      });
      mockPrisma.delivery.findFirst.mockResolvedValue(null);
      mockPrisma.delivery.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.order.update.mockResolvedValue({});

      const result = await service.takeJob('user-1', 'del-1');

      expect(result.deliveryId).toBe('del-1');
      const orderUpdate = mockPrisma.order.update.mock.calls[0][0];
      expect(orderUpdate.data.status).toBe(OrderStatus.SEDANG_DIKIRIM);
    });
  });

  describe('completeJob', () => {
    it('calculates 80% earning from delivery fee', async () => {
      mockPrisma.driver.findUnique.mockResolvedValue({ id: 'd1' });
      mockPrisma.delivery.findUnique.mockResolvedValue({
        id: 'del-1', driverId: 'd1', orderId: 'o1',
        order: { status: OrderStatus.SEDANG_DIKIRIM, deliveryFee: 25_000 },
      });
      mockPrisma.delivery.update.mockResolvedValue({});
      mockPrisma.order.update.mockResolvedValue({});
      mockPrisma.driver.update.mockResolvedValue({});
      mockPrisma.driverEarningLog.create.mockResolvedValue({});

      const result = await service.completeJob('user-1', 'del-1');

      expect(result.earning).toBe(20_000); // 25000 * 0.8
      const orderUpdate = mockPrisma.order.update.mock.calls[0][0];
      expect(orderUpdate.data.status).toBe(OrderStatus.PESANAN_SELESAI);
    });

    it('rejects completing a job that is not yours', async () => {
      mockPrisma.driver.findUnique.mockResolvedValue({ id: 'd1' });
      mockPrisma.delivery.findUnique.mockResolvedValue({
        id: 'del-1', driverId: 'other-driver',
        order: { status: OrderStatus.SEDANG_DIKIRIM, deliveryFee: 25_000 },
      });

      await expect(service.completeJob('user-1', 'del-1')).rejects.toThrow(/not your job/i);
    });

    it('rejects completing if order is not SEDANG_DIKIRIM', async () => {
      mockPrisma.driver.findUnique.mockResolvedValue({ id: 'd1' });
      mockPrisma.delivery.findUnique.mockResolvedValue({
        id: 'del-1', driverId: 'd1',
        order: { status: OrderStatus.MENUNGGU_PENGIRIM, deliveryFee: 25_000 },
      });

      await expect(service.completeJob('user-1', 'del-1')).rejects.toThrow(BadRequestException);
    });
  });
});
