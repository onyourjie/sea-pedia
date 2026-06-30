import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenerativeAI, Tool, SchemaType } from '@google/generative-ai';
import { ChatRequestDto } from './chat.dto';

const SYSTEM_PROMPT = `Kamu adalah asisten belanja SEAPEDIA, marketplace produk laut Indonesia. Kamu membantu buyer dengan:
- Cek status dan detail pesanan mereka
- Informasi kebijakan pengiriman dan refund
- Rekomendasi produk dari katalog
- FAQ umum seputar platform

Gunakan Bahasa Indonesia yang ramah dan singkat. Jika butuh data nyata (pesanan/produk), gunakan function yang tersedia.
Jangan buat-buat data pesanan — selalu ambil dari function. Jika user belum login dan tanya tentang pesanan, minta mereka login dulu.`;

const TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'get_my_orders',
        description: 'Ambil daftar pesanan milik user yang sedang login. Gunakan ini saat user tanya status pesanan.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            limit: {
              type: SchemaType.INTEGER,
              description: 'Jumlah pesanan yang diambil, default 5',
            },
          },
          required: [],
        },
      },
      {
        name: 'search_products',
        description: 'Cari produk di katalog SEAPEDIA berdasarkan kata kunci atau kategori.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: {
              type: SchemaType.STRING,
              description: 'Kata kunci pencarian produk',
            },
            category: {
              type: SchemaType.STRING,
              description: 'Kategori: seafood, pancing, kapal, suku-cadang, navigasi, keselamatan, jasa-selam',
            },
            limit: {
              type: SchemaType.INTEGER,
              description: 'Jumlah produk yang diambil, default 5',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_shipping_policy',
        description: 'Ambil informasi kebijakan pengiriman, SLA, biaya ongkir, dan kebijakan refund/overdue.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_faq',
        description: 'Jawab pertanyaan umum tentang cara daftar, top up wallet, cara jadi seller, cara jadi driver, dll.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            topic: {
              type: SchemaType.STRING,
              description: 'Topik FAQ: register, topup, seller, driver, cart, checkout, review',
            },
          },
          required: ['topic'],
        },
      },
    ],
  },
];

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private genAI: GoogleGenerativeAI;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) this.logger.warn('GEMINI_API_KEY not set — chat will fail');
    this.genAI = new GoogleGenerativeAI(apiKey ?? '');
  }

  async chat(dto: ChatRequestDto, userId?: string) {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
      tools: TOOLS,
    });

    const history = (dto.history ?? []).map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    const chatSession = model.startChat({ history });

    // Retry once on 503 overload before giving up
    const sendWithRetry = async (msg: any) => {
      try {
        return await chatSession.sendMessage(msg);
      } catch (err: any) {
        if (err?.status === 503) {
          await new Promise((r) => setTimeout(r, 2000));
          return chatSession.sendMessage(msg);
        }
        if (err?.status === 429) {
          throw new ServiceUnavailableException('Asisten sedang tidak tersedia karena batas penggunaan API tercapai. Silakan coba lagi beberapa saat atau besok.');
        }
        if (err?.status === 404) {
          throw new ServiceUnavailableException('Model AI tidak tersedia saat ini. Silakan hubungi administrator.');
        }
        throw err;
      }
    };

    let result = await sendWithRetry(dto.message);
    let response = result.response;

    // Agentic loop: handle function calls until model returns text
    let iterations = 0;
    while (response.functionCalls()?.length && iterations < 5) {
      iterations++;
      const calls = response.functionCalls()!;
      const toolResults = await Promise.all(
        calls.map(async (call) => {
          const output = await this.executeTool(call.name, call.args as Record<string, any>, userId);
          return {
            functionResponse: {
              name: call.name,
              response: { output },
            },
          };
        }),
      );

      result = await sendWithRetry(toolResults);
      response = result.response;
    }

    const text = response.text();
    return { reply: text };
  }

  private async executeTool(name: string, args: Record<string, any>, userId?: string): Promise<any> {
    switch (name) {
      case 'get_my_orders':
        return this.getMyOrders(userId, args.limit ?? 5);
      case 'search_products':
        return this.searchProducts(args.query, args.category, args.limit ?? 5);
      case 'get_shipping_policy':
        return this.getShippingPolicy();
      case 'get_faq':
        return this.getFaq(args.topic);
      default:
        return { error: 'Unknown function' };
    }
  }

  private async getMyOrders(userId?: string, limit = 5) {
    if (!userId) return { error: 'User tidak login. Silakan login untuk melihat pesanan.' };

    const buyer = await this.prisma.buyer.findUnique({ where: { userId } });
    if (!buyer) return { error: 'Akun buyer tidak ditemukan.' };

    const orders = await this.prisma.order.findMany({
      where: { buyerId: buyer.id },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        store: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    });

    return orders.map((o) => ({
      id: o.id.slice(0, 8),
      status: o.status,
      store: o.store.name,
      total: Number(o.total),
      deliveryMethod: o.deliveryMethod,
      createdAt: o.createdAt,
      isOverdue: o.isOverdue,
      items: o.items.map((i) => ({ name: i.product.name, qty: i.quantity, price: Number(i.price) })),
    }));
  }

  private async searchProducts(query?: string, category?: string, limit = 5) {
    const where: any = { isActive: true };
    if (category) where.category = category;
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    const products = await this.prisma.product.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { store: { select: { name: true } } },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      discount: p.discount,
      category: p.category,
      store: p.store.name,
      stock: p.stock,
    }));
  }

  private getShippingPolicy() {
    return {
      methods: [
        { name: 'INSTANT', sla: '4 jam', fee: 25000 },
        { name: 'NEXT_DAY', sla: '24 jam', fee: 15000 },
        { name: 'REGULAR', sla: '72 jam', fee: 9000 },
      ],
      overduePolicy:
        'Jika pesanan melewati SLA dan belum selesai, otomatis dikembalikan (DIKEMBALIKAN) dan saldo buyer di-refund penuh ke wallet.',
      refundPolicy:
        'Refund masuk ke wallet SEAPEDIA, bukan ke metode pembayaran asal. Bisa dipakai untuk transaksi berikutnya.',
      tax: 'PPN 12% dikenakan atas (subtotal setelah diskon + ongkir).',
    };
  }

  private getFaq(topic: string) {
    const faq: Record<string, string> = {
      register:
        'Daftar di halaman /register. Isi username, email, password. Setelah daftar bisa langsung login sebagai BUYER. Untuk jadi SELLER atau DRIVER, pilih role saat login.',
      topup:
        'Top up wallet di Dashboard Buyer → Wallet. Ada dua cara: Top Up Instan (langsung masuk) atau Bayar via Xendit (Virtual Account, e-wallet, QRIS). Minimal top up via Xendit Rp 10.000.',
      seller:
        'Untuk jadi seller: daftar akun → login → pilih role SELLER → buat toko di Dashboard Seller → Toko → lalu tambah produk.',
      driver:
        'Untuk jadi driver: daftar akun → login → pilih role DRIVER → ambil job di Dashboard Driver → Jobs Available.',
      cart:
        'Keranjang hanya bisa berisi produk dari satu toko. Kalau mau beli dari toko lain, kosongkan dulu keranjang.',
      checkout:
        'Di checkout, pilih alamat pengiriman, metode pengiriman, dan masukkan kode voucher/promo jika ada. Total sudah termasuk PPN 12%.',
      review:
        'Review produk bisa ditulis setelah pesanan berstatus Pesanan Selesai. Satu review per item pesanan.',
    };
    return faq[topic] ?? 'Maaf, informasi untuk topik tersebut belum tersedia. Silakan hubungi support.';
  }
}
