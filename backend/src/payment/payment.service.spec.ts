import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';

type TxFn = (db: typeof mockPrisma) => Promise<unknown>;

const mockPrisma = {
  buyer: { findUnique: jest.fn() },
  walletTx: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  wallet: { update: jest.fn() },
  $transaction: jest.fn(),
};

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (fn: TxFn) => fn(mockPrisma));

    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) => {
              const env: Record<string, string> = {
                XENDIT_SECRET_KEY: 'xnd_test_key',
                XENDIT_WEBHOOK_TOKEN: 'webhook-secret-token',
                FRONTEND_BASE_URL: 'http://localhost:3000',
              };
              return env[key] ?? fallback;
            },
          },
        },
      ],
    }).compile();

    service = moduleRef.get(PaymentService);
  });

  describe('verifyWebhookToken', () => {
    it('accepts matching token', () => {
      expect(service.verifyWebhookToken('webhook-secret-token')).toBe(true);
    });
    it('rejects mismatched token', () => {
      expect(service.verifyWebhookToken('wrong')).toBe(false);
    });
    it('rejects missing token when secret is configured', () => {
      expect(service.verifyWebhookToken(undefined)).toBe(false);
    });
  });

  describe('handleInvoiceCallback', () => {
    function makeTx(overrides: Partial<{ status: string }> = {}) {
      return {
        id: 'tx-1',
        externalId: 'seapedia-topup-buyer1-123',
        walletId: 'wallet-1',
        amount: 100_000,
        status: overrides.status ?? 'PENDING',
      };
    }

    it('credits wallet when invoice is PAID', async () => {
      mockPrisma.walletTx.findUnique
        .mockResolvedValueOnce(makeTx())
        .mockResolvedValueOnce(makeTx());
      mockPrisma.wallet.update.mockResolvedValue({ balance: 100_000 });
      mockPrisma.walletTx.update.mockResolvedValue({});

      const r = await service.handleInvoiceCallback({
        external_id: 'seapedia-topup-buyer1-123',
        status: 'PAID',
      });

      expect(r).toEqual({ processed: true, status: 'PAID' });
      expect(mockPrisma.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-1' },
        data: { balance: { increment: 100_000 } },
      });
      const txUpdate = mockPrisma.walletTx.update.mock.calls[0][0];
      expect(txUpdate.data.status).toBe('PAID');
    });

    it('idempotent — second PAID callback does NOT credit wallet again', async () => {
      // First call: PENDING → PAID
      mockPrisma.walletTx.findUnique.mockResolvedValue(makeTx({ status: 'PAID' }));

      const r = await service.handleInvoiceCallback({
        external_id: 'seapedia-topup-buyer1-123',
        status: 'PAID',
      });

      expect(r).toEqual({ ignored: true, reason: 'already_paid' });
      expect(mockPrisma.wallet.update).not.toHaveBeenCalled();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('inside-tx race protection: second tx finds status already PAID and skips', async () => {
      // First findUnique (outer): PENDING → enters tx
      // Second findUnique (inside tx): another worker already flipped to PAID
      mockPrisma.walletTx.findUnique
        .mockResolvedValueOnce(makeTx({ status: 'PENDING' }))
        .mockResolvedValueOnce(makeTx({ status: 'PAID' }));

      await service.handleInvoiceCallback({
        external_id: 'seapedia-topup-buyer1-123',
        status: 'PAID',
      });

      expect(mockPrisma.wallet.update).not.toHaveBeenCalled();
      expect(mockPrisma.walletTx.update).not.toHaveBeenCalled();
    });

    it('marks expired/failed without crediting', async () => {
      mockPrisma.walletTx.findUnique.mockResolvedValueOnce(makeTx());
      mockPrisma.walletTx.update.mockResolvedValue({});

      const r = await service.handleInvoiceCallback({
        external_id: 'seapedia-topup-buyer1-123',
        status: 'EXPIRED',
      });

      expect(r).toEqual({ processed: true, status: 'EXPIRED' });
      expect(mockPrisma.wallet.update).not.toHaveBeenCalled();
      const u = mockPrisma.walletTx.update.mock.calls[0][0];
      expect(u.data.status).toBe('EXPIRED');
    });

    it('ignores webhook for unknown externalId', async () => {
      mockPrisma.walletTx.findUnique.mockResolvedValue(null);

      const r = await service.handleInvoiceCallback({
        external_id: 'unknown',
        status: 'PAID',
      });

      expect(r).toEqual({ ignored: true, reason: 'unknown_external_id' });
      expect(mockPrisma.wallet.update).not.toHaveBeenCalled();
    });

    it('rejects payload missing external_id', async () => {
      await expect(
        service.handleInvoiceCallback({ status: 'PAID' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
