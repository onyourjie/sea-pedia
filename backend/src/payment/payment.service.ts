import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { PrismaService } from '../prisma/prisma.service';

interface XenditInvoice {
  id: string;
  external_id: string;
  invoice_url: string;
  status: string;
  amount: number;
}

@Injectable()
export class PaymentService {
  private readonly log = new Logger(PaymentService.name);
  private readonly http: AxiosInstance;
  private readonly webhookToken: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const secret = this.config.get<string>('XENDIT_SECRET_KEY');
    if (!secret) throw new Error('XENDIT_SECRET_KEY is required');
    this.webhookToken = this.config.get<string>('XENDIT_WEBHOOK_TOKEN') ?? '';

    // Xendit uses HTTP Basic auth with the secret key as username, blank password.
    this.http = axios.create({
      baseURL: 'https://api.xendit.co',
      auth: { username: secret, password: '' },
      timeout: 15_000,
    });
  }

  async createTopUpInvoice(userId: string, amount: number, frontendBaseUrl: string) {
    if (amount < 10_000) throw new BadRequestException('Minimum top-up is Rp 10.000');

    const buyer = await this.prisma.buyer.findUnique({
      where: { userId },
      include: { wallet: true, user: { select: { email: true, username: true } } },
    });
    if (!buyer || !buyer.wallet) throw new BadRequestException('Buyer wallet not found');

    const externalId = `seapedia-topup-${buyer.id}-${Date.now()}`;

    const successUrl = `${frontendBaseUrl}/dashboard/buyer/wallet?topup=success`;
    const failureUrl = `${frontendBaseUrl}/dashboard/buyer/wallet?topup=failed`;

    const { data } = await this.http.post<XenditInvoice>('/v2/invoices', {
      external_id: externalId,
      amount,
      payer_email: buyer.user.email,
      description: `SEAPEDIA Wallet Top-up — ${buyer.user.username}`,
      success_redirect_url: successUrl,
      failure_redirect_url: failureUrl,
      currency: 'IDR',
    });

    // Pre-create a PENDING WalletTx so we have a row keyed by externalId.
    // Webhook will flip it to TOPUP/PAID and credit the wallet — atomically and idempotently.
    await this.prisma.walletTx.create({
      data: {
        walletId: buyer.wallet.id,
        type: 'TOPUP',
        amount,
        balanceAfter: buyer.wallet.balance,
        description: `Pending Xendit top-up (${data.id})`,
        externalId,
        status: 'PENDING',
      },
    });

    this.log.log(`Created Xendit invoice ${data.id} for ${externalId} (Rp ${amount})`);

    return {
      invoiceId: data.id,
      invoiceUrl: data.invoice_url,
      externalId,
      amount,
      status: data.status,
    };
  }

  /** Verify the x-callback-token header sent by Xendit. */
  verifyWebhookToken(headerToken: string | undefined): boolean {
    if (!this.webhookToken) {
      this.log.warn('XENDIT_WEBHOOK_TOKEN not set — webhook signature check disabled');
      return true;
    }
    return headerToken === this.webhookToken;
  }

  /**
   * Handle a Xendit invoice callback.
   * Idempotent: same externalId arriving twice will only credit the wallet once,
   * because the PENDING row's status is checked inside the transaction.
   */
  async handleInvoiceCallback(payload: {
    external_id?: string;
    status?: string;
    amount?: number;
    paid_amount?: number;
    id?: string;
  }) {
    const externalId = payload.external_id;
    const status = payload.status;
    if (!externalId || !status) {
      throw new BadRequestException('Missing external_id or status');
    }

    const tx = await this.prisma.walletTx.findUnique({ where: { externalId } });
    if (!tx) {
      this.log.warn(`Webhook for unknown externalId: ${externalId}`);
      return { ignored: true, reason: 'unknown_external_id' };
    }

    if (tx.status === 'PAID') {
      this.log.log(`Idempotent skip — ${externalId} already PAID`);
      return { ignored: true, reason: 'already_paid' };
    }

    if (status !== 'PAID') {
      // Mark as failed/expired without crediting wallet
      await this.prisma.walletTx.update({
        where: { externalId },
        data: { status, description: `Xendit invoice ${status.toLowerCase()}` },
      });
      this.log.log(`Marked ${externalId} as ${status}`);
      return { processed: true, status };
    }

    // PAID — credit wallet atomically
    await this.prisma.$transaction(async (db) => {
      const fresh = await db.walletTx.findUnique({ where: { externalId } });
      if (!fresh || fresh.status === 'PAID') return; // race protection

      const wallet = await db.wallet.update({
        where: { id: fresh.walletId },
        data: { balance: { increment: fresh.amount } },
      });

      await db.walletTx.update({
        where: { externalId },
        data: {
          status: 'PAID',
          balanceAfter: wallet.balance,
          description: `Xendit top-up Rp ${Number(fresh.amount).toLocaleString('id-ID')}`,
        },
      });
    });

    this.log.log(`Credited wallet for ${externalId}`);
    return { processed: true, status: 'PAID' };
  }
}
