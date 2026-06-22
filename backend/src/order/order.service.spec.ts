import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderService } from './order.service';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryMethod, OrderStatus } from '@prisma/client';

// Helper: shape of a Prisma transaction callback
type TxFn = (tx: typeof mockPrisma) => Promise<unknown>;

const mockPrisma = {
  buyer: { findUnique: jest.fn() },
  cart: { findUnique: jest.fn(), update: jest.fn() },
  cartItem: { deleteMany: jest.fn() },
  address: { findUnique: jest.fn() },
  voucher: { findUnique: jest.fn(), update: jest.fn() },
  promo: { findUnique: jest.fn(), update: jest.fn() },
  product: { updateMany: jest.fn() },
  order: { create: jest.fn() },
  delivery: { create: jest.fn() },
  wallet: { update: jest.fn() },
  walletTx: { create: jest.fn() },
  $transaction: jest.fn(),
};

describe('OrderService.checkout — pricing math', () => {
  let service: OrderService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // $transaction passes mockPrisma as the tx client (same shape)
    mockPrisma.$transaction.mockImplementation(async (fn: TxFn) => fn(mockPrisma));
    mockPrisma.product.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.order.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'order-1', ...data, items: [], statusHistory: [] }),
    );
    mockPrisma.delivery.create.mockResolvedValue({ id: 'delivery-1' });
    mockPrisma.wallet.update.mockResolvedValue({ balance: 0 });
    mockPrisma.walletTx.create.mockResolvedValue({});
    mockPrisma.cartItem.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.cart.update.mockResolvedValue({});

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = moduleRef.get(OrderService);
  });

  function setupBuyerCart(opts: { balance: number; price: number; qty: number; stock?: number }) {
    mockPrisma.buyer.findUnique.mockResolvedValue({
      id: 'buyer-1',
      wallet: { id: 'wallet-1', balance: opts.balance },
    });
    mockPrisma.cart.findUnique.mockResolvedValue({
      id: 'cart-1',
      storeId: 'store-1',
      items: [
        {
          productId: 'prod-1',
          quantity: opts.qty,
          product: {
            id: 'prod-1',
            name: 'Tuna',
            price: opts.price,
            stock: opts.stock ?? opts.qty,
            isActive: true,
          },
        },
      ],
    });
    mockPrisma.address.findUnique.mockResolvedValue({ id: 'addr-1', buyerId: 'buyer-1' });
  }

  it('calculates PPN 12% on (subtotal + delivery_fee) when no discount', async () => {
    setupBuyerCart({ balance: 1_000_000, price: 100_000, qty: 1 });

    const result = await service.checkout('user-1', {
      addressId: 'addr-1',
      deliveryMethod: DeliveryMethod.REGULAR,
    });

    // subtotal=100000, deliveryFee=9000, taxBase=109000, ppn=13080, total=122080
    expect(result.summary.subtotal).toBe(100_000);
    expect(result.summary.deliveryFee).toBe(9000);
    expect(result.summary.discountAmount).toBe(0);
    expect(result.summary.ppn).toBeCloseTo(13_080, 2);
    expect(result.summary.total).toBeCloseTo(122_080, 2);
  });

  it('applies voucher discount BEFORE PPN', async () => {
    setupBuyerCart({ balance: 1_000_000, price: 100_000, qty: 1 });
    mockPrisma.voucher.findUnique.mockResolvedValue({
      id: 'v1',
      code: 'SAVE10',
      discountPct: 10,
      maxDiscount: null,
      minOrder: null,
      usageLimit: 100,
      usageCount: 0,
      expiresAt: new Date(Date.now() + 86400000),
    });
    mockPrisma.voucher.update.mockResolvedValue({});

    const result = await service.checkout('user-1', {
      addressId: 'addr-1',
      deliveryMethod: DeliveryMethod.REGULAR,
      voucherCode: 'SAVE10',
    });

    // subtotal=100k, discount=10k, discounted=90k, fee=9k, taxBase=99k, ppn=11880, total=110880
    expect(result.summary.discountAmount).toBe(10_000);
    expect(result.summary.ppn).toBeCloseTo(11_880, 2);
    expect(result.summary.total).toBeCloseTo(110_880, 2);
  });

  it('combines voucher + promo additively', async () => {
    setupBuyerCart({ balance: 1_000_000, price: 200_000, qty: 1 });
    mockPrisma.voucher.findUnique.mockResolvedValue({
      id: 'v1', discountAmount: 20_000, discountPct: null,
      maxDiscount: null, minOrder: null,
      usageLimit: 100, usageCount: 0, expiresAt: new Date(Date.now() + 86400000),
    });
    mockPrisma.promo.findUnique.mockResolvedValue({
      id: 'p1', discountAmount: 10_000, discountPct: null,
      maxDiscount: null, minOrder: null,
      usageLimit: 0, usageCount: 0, expiresAt: new Date(Date.now() + 86400000),
    });
    mockPrisma.voucher.update.mockResolvedValue({});
    mockPrisma.promo.update.mockResolvedValue({});

    const result = await service.checkout('user-1', {
      addressId: 'addr-1',
      deliveryMethod: DeliveryMethod.REGULAR,
      voucherCode: 'V', promoCode: 'P',
    });

    expect(result.summary.discountAmount).toBe(30_000);
  });

  it('rejects expired voucher', async () => {
    setupBuyerCart({ balance: 1_000_000, price: 100_000, qty: 1 });
    mockPrisma.voucher.findUnique.mockResolvedValue({
      id: 'v1', discountAmount: 10_000, discountPct: null,
      maxDiscount: null, minOrder: null,
      usageLimit: 100, usageCount: 0,
      expiresAt: new Date(Date.now() - 86400000),
    });

    await expect(
      service.checkout('user-1', {
        addressId: 'addr-1',
        deliveryMethod: DeliveryMethod.REGULAR,
        voucherCode: 'EXPIRED',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects voucher whose usage limit is full', async () => {
    setupBuyerCart({ balance: 1_000_000, price: 100_000, qty: 1 });
    mockPrisma.voucher.findUnique.mockResolvedValue({
      id: 'v1', discountAmount: 10_000, discountPct: null,
      maxDiscount: null, minOrder: null,
      usageLimit: 5, usageCount: 5,
      expiresAt: new Date(Date.now() + 86400000),
    });

    await expect(
      service.checkout('user-1', {
        addressId: 'addr-1',
        deliveryMethod: DeliveryMethod.REGULAR,
        voucherCode: 'FULL',
      }),
    ).rejects.toThrow(/usage limit/i);
  });

  it('rejects checkout with insufficient wallet balance', async () => {
    setupBuyerCart({ balance: 1000, price: 100_000, qty: 1 });

    await expect(
      service.checkout('user-1', {
        addressId: 'addr-1',
        deliveryMethod: DeliveryMethod.REGULAR,
      }),
    ).rejects.toThrow(/insufficient wallet/i);
  });

  it('uses correct delivery fee per method', async () => {
    const cases: Array<[DeliveryMethod, number]> = [
      [DeliveryMethod.INSTANT, 25_000],
      [DeliveryMethod.NEXT_DAY, 15_000],
      [DeliveryMethod.REGULAR, 9_000],
    ];

    for (const [method, expectedFee] of cases) {
      setupBuyerCart({ balance: 1_000_000, price: 50_000, qty: 1 });
      const r = await service.checkout('user-1', {
        addressId: 'addr-1',
        deliveryMethod: method,
      });
      expect(r.summary.deliveryFee).toBe(expectedFee);
    }
  });

  it('rejects address that does not belong to buyer', async () => {
    setupBuyerCart({ balance: 1_000_000, price: 100_000, qty: 1 });
    mockPrisma.address.findUnique.mockResolvedValue({ id: 'addr-1', buyerId: 'other-buyer' });

    await expect(
      service.checkout('user-1', {
        addressId: 'addr-1',
        deliveryMethod: DeliveryMethod.REGULAR,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('initial order status is SEDANG_DIKEMAS', async () => {
    setupBuyerCart({ balance: 1_000_000, price: 100_000, qty: 1 });

    await service.checkout('user-1', {
      addressId: 'addr-1',
      deliveryMethod: DeliveryMethod.REGULAR,
    });

    const orderArg = mockPrisma.order.create.mock.calls[0][0];
    expect(orderArg.data.status).toBe(OrderStatus.SEDANG_DIKEMAS);
  });
});
