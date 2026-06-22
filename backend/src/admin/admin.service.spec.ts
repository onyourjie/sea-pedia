import { Test } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, DeliveryMethod } from '@prisma/client';

type TxFn = (tx: typeof mockPrisma) => Promise<unknown>;

const mockPrisma = {
  order: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), count: jest.fn() },
  product: { update: jest.fn() },
  wallet: { update: jest.fn() },
  walletTx: { create: jest.fn() },
  driver: { update: jest.fn() },
  driverEarningLog: { delete: jest.fn() },
  incomeReversalLog: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  systemDate: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  $transaction: jest.fn(),
};

describe('AdminService.processOverdueOrders', () => {
  let service: AdminService;

  function makeOrder(overrides: Partial<{
    id: string;
    status: OrderStatus;
    deliveryMethod: DeliveryMethod;
    createdAt: Date;
    isOverdue: boolean;
    total: number;
    hasEarning: boolean;
  }> = {}) {
    const o = {
      id: overrides.id ?? 'o1',
      status: overrides.status ?? OrderStatus.SEDANG_DIKEMAS,
      deliveryMethod: overrides.deliveryMethod ?? DeliveryMethod.INSTANT,
      createdAt: overrides.createdAt ?? new Date('2025-01-01T00:00:00Z'),
      isOverdue: overrides.isOverdue ?? false,
      total: overrides.total ?? 100_000,
      storeId: 'store-1',
      items: [{ productId: 'p1', quantity: 2 }],
      buyer: { wallet: { id: 'wallet-1' } },
      delivery: overrides.hasEarning
        ? {
            driverId: 'd1',
            earningLog: { id: 'log-1', amount: 20_000 },
          }
        : { driverId: null, earningLog: null },
    };
    return o;
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (fn: TxFn) => fn(mockPrisma));
    mockPrisma.wallet.update.mockResolvedValue({ balance: 200_000 });
    mockPrisma.systemDate.findUnique.mockResolvedValue({
      id: 1, currentDate: new Date('2025-01-05T00:00:00Z'),
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = moduleRef.get(AdminService);
  });

  it('marks SLA-exceeded orders as DIKEMBALIKAN and refunds buyer wallet', async () => {
    const order = makeOrder();
    mockPrisma.order.findMany.mockResolvedValue([order]);
    mockPrisma.order.findUnique.mockResolvedValue({ ...order });

    const processed = await service.processOverdueOrders(new Date('2025-01-05T00:00:00Z'));

    expect(processed).toBe(1);
    const orderUpdate = mockPrisma.order.update.mock.calls[0][0];
    expect(orderUpdate.data.status).toBe(OrderStatus.DIKEMBALIKAN);
    expect(orderUpdate.data.isOverdue).toBe(true);

    const refundTx = mockPrisma.walletTx.create.mock.calls[0][0];
    expect(refundTx.data.type).toBe('REFUND');
    expect(refundTx.data.amount).toBe(100_000);
  });

  it('restores stock for each item', async () => {
    const order = makeOrder();
    mockPrisma.order.findMany.mockResolvedValue([order]);
    mockPrisma.order.findUnique.mockResolvedValue({ ...order });

    await service.processOverdueOrders(new Date('2025-01-05T00:00:00Z'));

    const stockUpdate = mockPrisma.product.update.mock.calls[0][0];
    expect(stockUpdate.where.id).toBe('p1');
    expect(stockUpdate.data.stock).toEqual({ increment: 2 });
  });

  it('writes IncomeReversalLog for traceability (spec L6)', async () => {
    const order = makeOrder();
    mockPrisma.order.findMany.mockResolvedValue([order]);
    mockPrisma.order.findUnique.mockResolvedValue({ ...order });

    await service.processOverdueOrders(new Date('2025-01-05T00:00:00Z'));

    const log = mockPrisma.incomeReversalLog.create.mock.calls[0][0];
    expect(log.data.orderId).toBe('o1');
    expect(log.data.storeId).toBe('store-1');
    expect(log.data.reversedIncome).toBe(100_000);
    expect(log.data.reason).toMatch(/SLA exceeded/);
  });

  it('reverses driver earning if it was already booked', async () => {
    const order = makeOrder({ hasEarning: true });
    mockPrisma.order.findMany.mockResolvedValue([order]);
    mockPrisma.order.findUnique.mockResolvedValue({ ...order });

    await service.processOverdueOrders(new Date('2025-01-05T00:00:00Z'));

    const driverUpdate = mockPrisma.driver.update.mock.calls[0][0];
    expect(driverUpdate.where.id).toBe('d1');
    expect(driverUpdate.data.earnings).toEqual({ decrement: 20_000 });

    expect(mockPrisma.driverEarningLog.delete).toHaveBeenCalledWith({ where: { id: 'log-1' } });

    const log = mockPrisma.incomeReversalLog.create.mock.calls[0][0];
    expect(log.data.reversedEarning).toBe(20_000);
    expect(log.data.driverId).toBe('d1');
  });

  it('skips orders within SLA window', async () => {
    // INSTANT SLA = 4h; this order is 1 hour old
    const order = makeOrder({
      createdAt: new Date('2025-01-04T23:30:00Z'),
    });
    mockPrisma.order.findMany.mockResolvedValue([order]);

    const processed = await service.processOverdueOrders(new Date('2025-01-05T00:00:00Z'));

    expect(processed).toBe(0);
    expect(mockPrisma.order.update).not.toHaveBeenCalled();
  });

  it('idempotent: re-checking inside the transaction prevents double-refund', async () => {
    const order = makeOrder();
    mockPrisma.order.findMany.mockResolvedValue([order]);
    // Simulate: between findMany and inside-tx re-read, another worker already processed it
    mockPrisma.order.findUnique.mockResolvedValue({ ...order, isOverdue: true });

    await service.processOverdueOrders(new Date('2025-01-05T00:00:00Z'));

    expect(mockPrisma.order.update).not.toHaveBeenCalled();
    expect(mockPrisma.walletTx.create).not.toHaveBeenCalled();
    expect(mockPrisma.incomeReversalLog.create).not.toHaveBeenCalled();
  });

  it('never reverses a PESANAN_SELESAI order even if findUnique returns one (defense in depth)', async () => {
    const order = makeOrder();
    mockPrisma.order.findMany.mockResolvedValue([order]);
    // The findMany query already excludes PESANAN_SELESAI, but the inside-tx
    // re-read may catch a status transition. Defensively skip.
    mockPrisma.order.findUnique.mockResolvedValue({
      ...order,
      status: OrderStatus.PESANAN_SELESAI,
    });

    await service.processOverdueOrders(new Date('2025-01-05T00:00:00Z'));

    expect(mockPrisma.order.update).not.toHaveBeenCalled();
  });

  it('uses correct SLA per delivery method', async () => {
    // REGULAR SLA = 72h; 73 hours old → overdue
    const order = makeOrder({
      deliveryMethod: DeliveryMethod.REGULAR,
      createdAt: new Date('2025-01-01T00:00:00Z'),
    });
    mockPrisma.order.findMany.mockResolvedValue([order]);
    mockPrisma.order.findUnique.mockResolvedValue({ ...order });

    const processed = await service.processOverdueOrders(new Date('2025-01-04T01:00:00Z'));
    expect(processed).toBe(1);
  });
});
