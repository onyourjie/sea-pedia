import { PrismaClient, RoleType, OrderStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

// --- Financial constants mirror backend services (order.service / delivery.service / admin.service) ---
const DELIVERY_FEES: Record<string, number> = { INSTANT: 25000, NEXT_DAY: 15000, REGULAR: 9000 };
const SLA_HOURS: Record<string, number> = { INSTANT: 4, NEXT_DAY: 24, REGULAR: 72 };
const PPN_RATE = 0.12;
const DRIVER_EARNING_RATE = 0.8;

type Discount = { discountPct: any; discountAmount: any; maxDiscount: any } | null | undefined;

function discountFrom(d: Discount, subtotal: number): number {
  if (!d) return 0;
  const raw = d.discountPct
    ? (subtotal * Number(d.discountPct)) / 100
    : Number(d.discountAmount ?? 0);
  return d.maxDiscount ? Math.min(raw, Number(d.maxDiscount)) : raw;
}

function computeFinancials(
  items: { product: { price: any }; quantity: number }[],
  method: string,
  voucher?: Discount,
  promo?: Discount,
) {
  const subtotal = items.reduce((s, it) => s + Number(it.product.price) * it.quantity, 0);
  let discountAmount = 0;
  if (voucher) discountAmount += discountFrom(voucher, subtotal);
  if (promo) discountAmount += discountFrom(promo, subtotal);
  const deliveryFee = DELIVERY_FEES[method];
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxBase = discountedSubtotal + deliveryFee;
  const ppn = taxBase * PPN_RATE;
  const total = taxBase + ppn;
  return { subtotal, discountAmount, deliveryFee, ppn, total };
}

function daysAgo(n: number, hour = 8): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function addHours(date: Date, h: number): Date {
  const d = new Date(date);
  d.setHours(d.getHours() + h);
  return d;
}

const FLOW = ['SEDANG_DIKEMAS', 'MENUNGGU_PENGIRIM', 'SEDANG_DIKIRIM', 'PESANAN_SELESAI'];
const reached = (target: string, status: string) =>
  FLOW.indexOf(status) >= FLOW.indexOf(target) && FLOW.indexOf(target) >= 0;

const PRODUCT_IMAGES: Record<string, string[]> = {
  'Fin Diving Cressi Frog Plus - Yellow High Visibility': [
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471521/Fin_Diving_Cressi_Frog_Plus_-_Yellow_High_Visibility_1_wimyzu.png',
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471522/Fin_Diving_Cressi_Frog_Plus_-_Yellow_High_Visibility_2_wqral6.png',
  ],
  'Perahu Karet Inflatable Boat 4 Orang': [
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471522/Perahu_Karet_Inflatable_Boat_4_Orang_4_jcxrym.png',
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471522/Perahu_Karet_Inflatable_Boat_4_Orang_2_zpyokt.png',
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471529/Perahu_Karet_Inflatable_Boat_4_Orang_1_ihhsym.png',
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471531/Perahu_Karet_Inflatable_Boat_4_Orang_5_pkm0ew.png',
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471529/Perahu_Karet_Inflatable_Boat_4_Orang_3_ixwsb1.png',
  ],
  'BCD Aqualung Pro HD - Weight Integrated': [
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471522/BCD_Aqualung_Pro_HD_-_Weight_Integrated_1_2_gmwkcx.png',
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471523/BCD_Aqualung_Pro_HD_-_Weight_Integrated_1_o69gcg.png',
  ],
  'Masker Selam Scubapro Ghost - Black Series': [
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471523/Masker_Selam_Scubapro_Ghost_-_Black_Series_buh9zs.png',
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471524/Masker_Selam_Scubapro_Ghost_-_Black_Series_2_tonynx.png',
  ],
  'Mesin Tempel Kapal Yamaha 15HP 2-Stroke': [
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471522/Mesin_Tempel_Kapal_Yamaha_15HP_2-Stroke_1_gt7ies.png',
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471524/Mesin_Tempel_Kapal_Yamaha_15HP_2-Stroke_2_x5weye.png',
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471525/Mesin_Tempel_Kapal_Yamaha_15HP_2-Stroke_3_wfofuh.png',
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471525/Mesin_Tempel_Kapal_Yamaha_15HP_2-Stroke_5_hkx0uv.png',
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471525/Mesin_Tempel_Kapal_Yamaha_15HP_2-Stroke_4_uqwohc.png',
  ],
  'Senter Selam Bigblue AL1200NP - 1200 Lumens': [
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471525/Senter_Selam_Bigblue_AL1200NP_-_1200_Lumens_1_j1ahi4.png',
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471528/Senter_Selam_Bigblue_AL1200NP_-_1200_Lumens_2_nc3lb5.png',
  ],
  'Regulator Set Apeks XTX50 + DST': [
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471525/Regulator_Set_Apeks_XTX50_DST_i7x37s.png',
  ],
  'Set Pancing Spinning Carbon 2.1m': [
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471526/Set_Pancing_Spinning_Carbon_2.1m_kfmg9n.png',
  ],
  'Wetsuit Mares Rover 3mm Full Body': [
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471526/Wetsuit_Mares_Rover_3mm_Full_Body_1_uityab.png',
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471527/Wetsuit_Mares_Rover_3mm_Full_Body_2_fyfosh.png',
  ],
  'Jaring Ikan Nilon Premium 100m': [
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471528/Jaring_Ikan_Nilon_Premium_100m_ygw3wh.png',
  ],
  'Ikan Kerapu Merah Segar 1kg': [
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471528/Ikan_Kerapu_Merah_Segar_1kg_qmxcox.png',
  ],
  'Cumi-cumi Segar 1kg': [
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471528/Cumi-cumi_Segar_1kg_i9am6c.png',
  ],
  'Udang Vannamei Super Ekspor 1kg': [
    'https://res.cloudinary.com/deady5xap/image/upload/v1782471530/Udang_Vannamei_Super_Ekspor_1kg_octgmt.png',
  ],
};

function imageData(name: string) {
  const urls = PRODUCT_IMAGES[name] ?? [];
  return { imageUrl: urls[0], imageUrls: urls.slice(1) };
}

async function updateSeedProductImages() {
  await Promise.all(
    Object.entries(PRODUCT_IMAGES).map(([name, urls]) =>
      prisma.product.updateMany({
        where: { name },
        data: { imageUrl: urls[0], imageUrls: urls.slice(1) },
      }),
    ),
  );
}

type WalletEvent = {
  walletId: string;
  type: 'TOPUP' | 'PAYMENT' | 'REFUND';
  amount: number;
  orderId?: string;
  description: string;
  createdAt: Date;
};

interface SeedOrderOpts {
  ledger: { walletId: string; payments: number };
  buyerId: string;
  store: { id: string };
  addressId: string;
  items: { product: { id: string; name: string; price: any }; quantity: number }[];
  deliveryMethod: 'INSTANT' | 'NEXT_DAY' | 'REGULAR';
  status: OrderStatus;
  driver?: { id: string } | null;
  voucher?: any;
  promo?: any;
  daysAgoPlaced: number;
  reviews?: ({ rating: number; comment: string } | null)[];
}

async function seedOrder(client: any, walletEvents: WalletEvent[], o: SeedOrderOpts) {
  const fin = computeFinancials(o.items, o.deliveryMethod, o.voucher, o.promo);
  const placedAt = daysAgo(o.daysAgoPlaced);
  const processedAt = addHours(placedAt, 2);
  const tookAt = addHours(placedAt, 5);
  const completedAt = addHours(placedAt, 20);
  const slaHours = SLA_HOURS[o.deliveryMethod];
  const returnedAt = addHours(placedAt, slaHours + 2);

  const isReturned = o.status === OrderStatus.DIKEMBALIKAN;
  const driverAssigned =
    !!o.driver &&
    (reached('SEDANG_DIKIRIM', o.status) || (isReturned && !!o.driver));

  // Build status-history timeline consistent with the real lifecycle.
  const history: { status: OrderStatus; note: string; createdAt: Date }[] = [
    { status: OrderStatus.SEDANG_DIKEMAS, note: 'Order placed', createdAt: placedAt },
  ];
  if (reached('MENUNGGU_PENGIRIM', o.status) || isReturned) {
    history.push({
      status: OrderStatus.MENUNGGU_PENGIRIM,
      note: 'Seller processed the order',
      createdAt: processedAt,
    });
  }
  if (reached('SEDANG_DIKIRIM', o.status) || (isReturned && driverAssigned)) {
    history.push({
      status: OrderStatus.SEDANG_DIKIRIM,
      note: 'Driver took the job',
      createdAt: tookAt,
    });
  }
  if (o.status === OrderStatus.PESANAN_SELESAI) {
    history.push({
      status: OrderStatus.PESANAN_SELESAI,
      note: 'Delivery completed by driver',
      createdAt: completedAt,
    });
  }
  if (isReturned) {
    history.push({
      status: OrderStatus.DIKEMBALIKAN,
      note: `Auto-returned: SLA exceeded (${slaHours}h for ${o.deliveryMethod})`,
      createdAt: returnedAt,
    });
  }

  const deliveryData: any = { createdAt: placedAt };
  if (driverAssigned) {
    deliveryData.driverId = o.driver!.id;
    deliveryData.takenAt = tookAt;
  }
  if (o.status === OrderStatus.PESANAN_SELESAI) deliveryData.completedAt = completedAt;

  const order = await client.order.create({
    data: {
      buyerId: o.buyerId,
      storeId: o.store.id,
      addressId: o.addressId,
      deliveryMethod: o.deliveryMethod,
      subtotal: fin.subtotal,
      discountAmount: fin.discountAmount,
      deliveryFee: fin.deliveryFee,
      ppn: fin.ppn,
      total: fin.total,
      voucherId: o.voucher?.id,
      promoId: o.promo?.id,
      status: o.status,
      isOverdue: isReturned,
      createdAt: placedAt,
      statusHistory: { create: history },
      items: {
        create: o.items.map((it) => ({
          productId: it.product.id,
          name: it.product.name,
          price: it.product.price,
          quantity: it.quantity,
        })),
      },
      delivery: { create: deliveryData },
    },
    include: { items: true, delivery: true },
  });

  // Stock: real flow decrements on checkout. A returned order is decremented then
  // restored (net zero), so we simply leave stock untouched for those.
  if (!isReturned) {
    for (const it of o.items) {
      await client.product.update({
        where: { id: it.product.id },
        data: { stock: { decrement: it.quantity } },
      });
    }
  }

  // Voucher / promo usage is consumed at checkout regardless of later outcome.
  if (o.voucher) {
    await client.voucher.update({
      where: { id: o.voucher.id },
      data: { usageCount: { increment: 1 } },
    });
  }
  if (o.promo) {
    await client.promo.update({
      where: { id: o.promo.id },
      data: { usageCount: { increment: 1 } },
    });
  }

  // Buyer wallet payment at checkout.
  walletEvents.push({
    walletId: o.ledger.walletId,
    type: 'PAYMENT',
    amount: fin.total,
    orderId: order.id,
    description: `Payment for order ${order.id}`,
    createdAt: placedAt,
  });
  o.ledger.payments += fin.total;

  // Completed delivery -> driver earning + log.
  if (o.status === OrderStatus.PESANAN_SELESAI && o.driver) {
    const earning = fin.deliveryFee * DRIVER_EARNING_RATE;
    await client.driver.update({
      where: { id: o.driver.id },
      data: { earnings: { increment: earning } },
    });
    await client.driverEarningLog.create({
      data: {
        driverId: o.driver.id,
        deliveryId: order.delivery.id,
        orderId: order.id,
        amount: earning,
        deliveryFee: fin.deliveryFee,
        createdAt: completedAt,
      },
    });

    // Product reviews can only exist on completed orders.
    if (o.reviews) {
      for (let i = 0; i < o.items.length; i++) {
        const r = o.reviews[i];
        if (!r) continue;
        await client.productReview.create({
          data: {
            productId: o.items[i].product.id,
            buyerId: o.buyerId,
            orderItemId: order.items[i].id,
            rating: r.rating,
            comment: r.comment,
            createdAt: addHours(completedAt, 24),
          },
        });
      }
    }
  }

  // Returned order -> auto-refund + income reversal audit trail.
  if (isReturned) {
    walletEvents.push({
      walletId: o.ledger.walletId,
      type: 'REFUND',
      amount: fin.total,
      orderId: order.id,
      description: `Auto-refund for overdue order ${order.id}`,
      createdAt: returnedAt,
    });
    await client.incomeReversalLog.create({
      data: {
        orderId: order.id,
        storeId: o.store.id,
        driverId: driverAssigned ? o.driver!.id : null,
        reversedIncome: fin.total,
        reversedEarning: 0,
        reason: `SLA exceeded (${slaHours}h for ${o.deliveryMethod})`,
        createdAt: returnedAt,
      },
    });
  }

  return order;
}

async function main() {
  console.log('Seeding database...');

  const hash = async (pw: string) => bcrypt.hash(pw, 12);

  // Admin
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@seapedia.com',
      passwordHash: await hash('admin123'),
      roles: { create: [{ role: RoleType.ADMIN }] },
    },
  });
  console.log('Admin created:', adminUser.username);

  // Seller
  const sellerUser = await prisma.user.upsert({
    where: { username: 'seller1' },
    update: {},
    create: {
      username: 'seller1',
      email: 'seller1@seapedia.com',
      passwordHash: await hash('seller123'),
      roles: { create: [{ role: RoleType.SELLER }] },
    },
  });
  const store = await prisma.store.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      name: 'Oceanic Pro Store',
      description: 'Toko peralatan selam dan kelautan terpercaya di Indonesia',
    },
  });
  await prisma.product.createMany({
    skipDuplicates: true,
    data: [
      {
        storeId: store.id,
        name: 'Masker Selam Scubapro Ghost - Black Series',
        description: 'Masker selam premium dengan lensa tempered ultra-clear untuk pandangan bawah air tajam tanpa distorsi. Teknologi Trufit Generasi Kedua dengan silikon ganda.',
        price: 1250000,
        stock: 25,
        discount: 15,
        ...imageData('Masker Selam Scubapro Ghost - Black Series'),
        specifications: {
          Material: 'Silikon Hipoalergenik',
          Lensa: 'Tempered Glass',
          Berat: '180g',
          Garansi: '1 Tahun',
        },
      },
      {
        storeId: store.id,
        name: 'Fin Diving Cressi Frog Plus - Yellow High Visibility',
        description: 'Fin selam Cressi dengan desain ergonomis untuk efisiensi tendangan maksimal. Warna kuning high visibility untuk keamanan di laut.',
        price: 850000,
        stock: 40,
        discount: 25,
        ...imageData('Fin Diving Cressi Frog Plus - Yellow High Visibility'),
        specifications: {
          Ukuran: 'M (40-42)',
          Material: 'Polypropylene',
          Warna: 'Kuning Fluoresen',
        },
      },
      {
        storeId: store.id,
        name: 'BCD Aqualung Pro HD - Weight Integrated',
        description: 'BCD profesional dengan sistem integrasi pemberat, bahan durable untuk kondisi laut keras. Cocok untuk penyelam profesional maupun rekreasi.',
        price: 6500000,
        stock: 15,
        discount: 10,
        ...imageData('BCD Aqualung Pro HD - Weight Integrated'),
        specifications: {
          Kapasitas: 'Maks 18kg pemberat',
          Material: 'Cordura 1000D',
          Bladder: '20 liter',
        },
      },
      {
        storeId: store.id,
        name: 'Regulator Set Apeks XTX50 + DST',
        description: 'Set regulator premium Apeks dengan teknologi terbaru untuk pernapasan mudah di kedalaman. Termasuk dive computer DST.',
        price: 9850000,
        stock: 10,
        discount: 8,
        ...imageData('Regulator Set Apeks XTX50 + DST'),
        specifications: {
          Tahap: 'Balanced Diaphragm',
          'Maks Kedalaman': '60m',
          Sertifikasi: 'CE EN250',
        },
      },
      {
        storeId: store.id,
        name: 'Wetsuit Mares Rover 3mm Full Body',
        description: 'Wetsuit full body 3mm untuk penyelaman tropis. Material neoprene berkualitas tinggi dengan jahitan flatlock untuk kenyamanan maksimal.',
        price: 2100000,
        stock: 20,
        ...imageData('Wetsuit Mares Rover 3mm Full Body'),
        specifications: {
          Ketebalan: '3mm',
          Tipe: 'Full Body',
          Resleting: 'YKK',
        },
      },
      {
        storeId: store.id,
        name: 'Senter Selam Bigblue AL1200NP - 1200 Lumens',
        description: 'Senter selam profesional 1200 lumens dengan sudut sinar lebar. Tahan air hingga 100 meter, baterai lithium tahan lama.',
        price: 1850000,
        stock: 30,
        discount: 20,
        ...imageData('Senter Selam Bigblue AL1200NP - 1200 Lumens'),
      },
    ],
  });
  console.log('Seller + store + products created:', sellerUser.username);

  // Seller 2 - Ikan & Hasil Laut
  const sellerUser2 = await prisma.user.upsert({
    where: { username: 'seller2' },
    update: {},
    create: {
      username: 'seller2',
      email: 'seller2@seapedia.com',
      passwordHash: await hash('seller123'),
      roles: { create: [{ role: RoleType.SELLER }] },
    },
  });
  const store2 = await prisma.store.upsert({
    where: { userId: sellerUser2.id },
    update: {},
    create: {
      userId: sellerUser2.id,
      name: 'Sumber Bahari Segar',
      description: 'Supplier ikan segar dan hasil laut langsung dari nelayan. Pengiriman cepat ke seluruh Indonesia.',
    },
  });
  await prisma.product.createMany({
    skipDuplicates: true,
    data: [
      {
        storeId: store2.id,
        name: 'Udang Vannamei Super Ekspor 1kg',
        description: 'Udang vannamei segar kualitas ekspor, dipanen langsung dari tambak terpercaya. Ukuran 30-40 ekor/kg.',
        price: 125000,
        stock: 100,
        ...imageData('Udang Vannamei Super Ekspor 1kg'),
      },
      {
        storeId: store2.id,
        name: 'Ikan Kerapu Merah Segar 1kg',
        description: 'Ikan kerapu merah segar pilihan dari perairan Sulawesi. Cocok untuk dibakar, dikukus, atau digoreng.',
        price: 185000,
        stock: 50,
        ...imageData('Ikan Kerapu Merah Segar 1kg'),
      },
      {
        storeId: store2.id,
        name: 'Cumi-cumi Segar 1kg',
        description: 'Cumi-cumi segar berkualitas tinggi, langsung dari nelayan lokal. Tekstur kenyal dan rasa laut yang autentik.',
        price: 95000,
        stock: 80,
        ...imageData('Cumi-cumi Segar 1kg'),
      },
    ],
  });
  console.log('Seller2 + store + products created:', sellerUser2.username);

  // Seller 3 - Alat Pancing
  const sellerUser3 = await prisma.user.upsert({
    where: { username: 'seller3' },
    update: {},
    create: {
      username: 'seller3',
      email: 'seller3@seapedia.com',
      passwordHash: await hash('seller123'),
      roles: { create: [{ role: RoleType.SELLER }] },
    },
  });
  const store3 = await prisma.store.upsert({
    where: { userId: sellerUser3.id },
    update: {},
    create: {
      userId: sellerUser3.id,
      name: 'Angler Heaven',
      description: 'Toko alat pancing lengkap untuk pemula hingga profesional. Stok terbesar di Indonesia.',
    },
  });
  await prisma.product.createMany({
    skipDuplicates: true,
    data: [
      {
        storeId: store3.id,
        name: 'Set Pancing Spinning Carbon 2.1m',
        description: 'Set lengkap joran spinning karbon ringan 2.1m dengan reel berkualitas. Ideal untuk mancing di laut maupun sungai.',
        price: 1450000,
        stock: 35,
        ...imageData('Set Pancing Spinning Carbon 2.1m'),
      },
      {
        storeId: store3.id,
        name: 'Jaring Ikan Nilon Premium 100m',
        description: 'Jaring ikan nilon kuat dan tahan lama 100 meter. Mata jaring 2cm, cocok untuk berbagai jenis ikan.',
        price: 350000,
        stock: 60,
        ...imageData('Jaring Ikan Nilon Premium 100m'),
      },
    ],
  });
  console.log('Seller3 + store + products created:', sellerUser3.username);

  // Buyer
  const buyerUser = await prisma.user.upsert({
    where: { username: 'buyer1' },
    update: {},
    create: {
      username: 'buyer1',
      email: 'buyer1@seapedia.com',
      passwordHash: await hash('buyer123'),
      roles: { create: [{ role: RoleType.BUYER }] },
    },
  });
  const buyer = await prisma.buyer.upsert({
    where: { userId: buyerUser.id },
    update: {},
    create: { userId: buyerUser.id },
  });
  const buyerWallet = await prisma.wallet.upsert({
    where: { buyerId: buyer.id },
    update: {},
    create: { buyerId: buyer.id, balance: 0 },
  });
  let buyerAddress = await prisma.address.findFirst({
    where: { buyerId: buyer.id, label: 'Rumah' },
  });
  if (!buyerAddress) {
    buyerAddress = await prisma.address.create({
      data: {
        buyerId: buyer.id,
        label: 'Rumah',
        recipientName: 'Budi Santoso',
        recipientPhone: '081234567890',
        street: 'Jl. Sudirman No. 1',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '10110',
        isDefault: true,
      },
    });
  }
  let buyerAddress2 = await prisma.address.findFirst({
    where: { buyerId: buyer.id, label: 'Kantor' },
  });
  if (!buyerAddress2) {
    buyerAddress2 = await prisma.address.create({
      data: {
        buyerId: buyer.id,
        label: 'Kantor',
        recipientName: 'Budi Santoso',
        recipientPhone: '081298765432',
        street: 'Jl. Gatot Subroto Kav. 21',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '12930',
        isDefault: false,
      },
    });
  }
  console.log('Buyer created:', buyerUser.username);

  // Driver
  const driverUser = await prisma.user.upsert({
    where: { username: 'driver1' },
    update: {},
    create: {
      username: 'driver1',
      email: 'driver1@seapedia.com',
      passwordHash: await hash('driver123'),
      roles: { create: [{ role: RoleType.DRIVER }] },
    },
  });
  const driver = await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: {},
    create: { userId: driverUser.id },
  });
  console.log('Driver created:', driverUser.username);

  // Multi-role user (Buyer + Seller + Driver)
  const multiUser = await prisma.user.upsert({
    where: { username: 'multiuser' },
    update: {},
    create: {
      username: 'multiuser',
      email: 'multi@seapedia.com',
      passwordHash: await hash('multi123'),
      roles: {
        create: [
          { role: RoleType.BUYER },
          { role: RoleType.SELLER },
          { role: RoleType.DRIVER },
        ],
      },
    },
  });
  const multiBuyer = await prisma.buyer.upsert({
    where: { userId: multiUser.id },
    update: {},
    create: { userId: multiUser.id },
  });
  const multiWallet = await prisma.wallet.upsert({
    where: { buyerId: multiBuyer.id },
    update: {},
    create: { buyerId: multiBuyer.id, balance: 0 },
  });
  const multiDriver = await prisma.driver.upsert({
    where: { userId: multiUser.id },
    update: {},
    create: { userId: multiUser.id },
  });
  let multiAddress = await prisma.address.findFirst({
    where: { buyerId: multiBuyer.id, label: 'Dermaga' },
  });
  if (!multiAddress) {
    multiAddress = await prisma.address.create({
      data: {
        buyerId: multiBuyer.id,
        label: 'Dermaga',
        recipientName: 'Hendra Laut',
        recipientPhone: '081377778888',
        street: 'Jl. Pelabuhan Ratu No. 7',
        city: 'Surabaya',
        province: 'Jawa Timur',
        postalCode: '60111',
        isDefault: true,
      },
    });
  }
  const multiStore = await prisma.store.upsert({
    where: { userId: multiUser.id },
    update: {},
    create: {
      userId: multiUser.id,
      name: 'Samudra Jaya Marine',
      description: 'Toko perlengkapan kapal dan navigasi laut dari nelayan berpengalaman.',
    },
  });
  await prisma.product.createMany({
    skipDuplicates: true,
    data: [
      {
        storeId: multiStore.id,
        name: 'Mesin Tempel Kapal Yamaha 15HP 2-Stroke',
        description: 'Mesin tempel kapal Yamaha 15HP 2-stroke bertenaga dan irit bahan bakar. Cocok untuk kapal nelayan 5-7 meter.',
        price: 24500000,
        stock: 5,
        ...imageData('Mesin Tempel Kapal Yamaha 15HP 2-Stroke'),
      },
      {
        storeId: multiStore.id,
        name: 'Perahu Karet Inflatable Boat 4 Orang',
        description: 'Perahu karet inflatable kapasitas 4 orang, material PVC tebal tahan abrasi. Lengkap dengan pompa dan dayung.',
        price: 5800000,
        stock: 8,
        ...imageData('Perahu Karet Inflatable Boat 4 Orang'),
      },
    ],
  });
  await updateSeedProductImages();
  console.log('Multi-role user created:', multiUser.username);

  // Vouchers
  const voucherSave10 = await prisma.voucher.upsert({
    where: { code: 'SAVE10' },
    update: {},
    create: {
      code: 'SAVE10',
      description: 'Diskon 10% maksimal Rp 50.000',
      discountPct: 10,
      maxDiscount: 50000,
      usageLimit: 100,
      expiresAt: new Date('2027-12-31'),
    },
  });
  const voucherFlat50k = await prisma.voucher.upsert({
    where: { code: 'FLAT50K' },
    update: {},
    create: {
      code: 'FLAT50K',
      description: 'Diskon langsung Rp 50.000',
      discountAmount: 50000,
      minOrder: 200000,
      usageLimit: 50,
      expiresAt: new Date('2027-12-31'),
    },
  });

  // Promos
  const promo20 = await prisma.promo.upsert({
    where: { code: 'PROMO20' },
    update: {},
    create: {
      code: 'PROMO20',
      description: 'Promo diskon 20% maksimal Rp 100.000',
      discountPct: 20,
      maxDiscount: 100000,
      expiresAt: new Date('2027-12-31'),
    },
  });

  // ============================================================
  // Transactional data: orders, deliveries, payments, reviews, etc.
  // Idempotent — only runs once on a fresh DB (skips if orders exist).
  // ============================================================
  const existingOrders = await prisma.order.count();
  if (existingOrders === 0) {
    const byName = <T extends { name: string }>(name: string, list: T[]): T =>
      list.find((p) => p.name.includes(name))!;

    const store1Products = await prisma.product.findMany({ where: { storeId: store.id } });
    const store2Products = await prisma.product.findMany({ where: { storeId: store2.id } });
    const store3Products = await prisma.product.findMany({ where: { storeId: store3.id } });

    const masker = byName('Masker Selam', store1Products);
    const fin = byName('Fin Diving', store1Products);
    const senter = byName('Senter Selam', store1Products);
    const wetsuit = byName('Wetsuit', store1Products);
    const bcd = byName('BCD Aqualung', store1Products);
    const udang = byName('Udang Vannamei', store2Products);
    const kerapu = byName('Kerapu', store2Products);
    const cumi = byName('Cumi', store2Products);
    const pancing = byName('Set Pancing', store3Products);
    const jaring = byName('Jaring Ikan', store3Products);

    const walletEvents: WalletEvent[] = [];
    const buyerLedger = { walletId: buyerWallet.id, payments: 0 };
    const multiLedger = { walletId: multiWallet.id, payments: 0 };

    // 1. Completed order with reviews (buyer1, store1, voucher used, driver1 delivered)
    await seedOrder(prisma, walletEvents, {
      ledger: buyerLedger,
      buyerId: buyer.id,
      store,
      addressId: buyerAddress.id,
      items: [
        { product: masker, quantity: 1 },
        { product: fin, quantity: 1 },
      ],
      deliveryMethod: 'NEXT_DAY',
      status: OrderStatus.PESANAN_SELESAI,
      driver,
      voucher: voucherSave10,
      daysAgoPlaced: 20,
      reviews: [
        { rating: 5, comment: 'Maskernya jernih banget, anti fogging beneran works. Pengiriman cepat!' },
        { rating: 4, comment: 'Fin nyaman dipakai, warnanya cerah gampang keliatan di air. Recommended.' },
      ],
    });

    // 2. Completed order, no discount, partial review (buyer1, store2, driver1)
    await seedOrder(prisma, walletEvents, {
      ledger: buyerLedger,
      buyerId: buyer.id,
      store: store2,
      addressId: buyerAddress.id,
      items: [
        { product: udang, quantity: 2 },
        { product: kerapu, quantity: 1 },
      ],
      deliveryMethod: 'INSTANT',
      status: OrderStatus.PESANAN_SELESAI,
      driver,
      daysAgoPlaced: 15,
      reviews: [
        { rating: 5, comment: 'Udangnya segar dan ukurannya besar-besar. Mantap buat dibakar!' },
        null,
      ],
    });

    // 3. Completed order with promo (multiuser buyer, store3, delivered by driver1)
    await seedOrder(prisma, walletEvents, {
      ledger: multiLedger,
      buyerId: multiBuyer.id,
      store: store3,
      addressId: multiAddress.id,
      items: [{ product: pancing, quantity: 1 }],
      deliveryMethod: 'REGULAR',
      status: OrderStatus.PESANAN_SELESAI,
      driver,
      promo: promo20,
      daysAgoPlaced: 12,
      reviews: [
        { rating: 5, comment: 'Joran spinning-nya ringan dan kuat. Sudah dapat strike kakap, worth it!' },
      ],
    });

    // 4. Completed order delivered by multiuser-as-driver (buyer1, store1)
    await seedOrder(prisma, walletEvents, {
      ledger: buyerLedger,
      buyerId: buyer.id,
      store,
      addressId: buyerAddress2.id,
      items: [{ product: senter, quantity: 1 }],
      deliveryMethod: 'INSTANT',
      status: OrderStatus.PESANAN_SELESAI,
      driver: multiDriver,
      voucher: voucherFlat50k,
      daysAgoPlaced: 8,
      reviews: [{ rating: 4, comment: 'Senter terang sekali, 1200 lumens beneran. Tahan air OK.' }],
    });

    // 5. In-delivery order (buyer1, store2, driver1 currently delivering)
    await seedOrder(prisma, walletEvents, {
      ledger: buyerLedger,
      buyerId: buyer.id,
      store: store2,
      addressId: buyerAddress.id,
      items: [{ product: cumi, quantity: 3 }],
      deliveryMethod: 'INSTANT',
      status: OrderStatus.SEDANG_DIKIRIM,
      driver,
      daysAgoPlaced: 1,
    });

    // 6. Waiting-for-driver order (buyer1, store3) — appears in driver available jobs
    await seedOrder(prisma, walletEvents, {
      ledger: buyerLedger,
      buyerId: buyer.id,
      store: store3,
      addressId: buyerAddress.id,
      items: [{ product: jaring, quantity: 2 }],
      deliveryMethod: 'REGULAR',
      status: OrderStatus.MENUNGGU_PENGIRIM,
      daysAgoPlaced: 1,
    });

    // 7. Newly placed order being packed (multiuser buyer, store1)
    await seedOrder(prisma, walletEvents, {
      ledger: multiLedger,
      buyerId: multiBuyer.id,
      store,
      addressId: multiAddress.id,
      items: [{ product: wetsuit, quantity: 1 }],
      deliveryMethod: 'NEXT_DAY',
      status: OrderStatus.SEDANG_DIKEMAS,
      daysAgoPlaced: 0,
    });

    // 8. Returned/overdue order with auto-refund + income reversal (buyer1, store1)
    await seedOrder(prisma, walletEvents, {
      ledger: buyerLedger,
      buyerId: buyer.id,
      store,
      addressId: buyerAddress.id,
      items: [{ product: bcd, quantity: 1 }],
      deliveryMethod: 'INSTANT',
      status: OrderStatus.DIKEMBALIKAN,
      daysAgoPlaced: 5,
    });

    // ---- Flush wallet ledgers: seed an opening top-up that covers all spend,
    //      then replay PAYMENT/REFUND events in chronological order so each
    //      balanceAfter and the final wallet balance are internally consistent.
    const ledgers = [
      { wallet: buyerWallet, ledger: buyerLedger, topupExtra: 3000000 },
      { wallet: multiWallet, ledger: multiLedger, topupExtra: 1500000 },
    ];
    for (const { wallet, ledger, topupExtra } of ledgers) {
      const events = walletEvents
        .filter((e) => e.walletId === ledger.walletId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const topupAmount = ledger.payments + topupExtra;
      const firstEventTime = events.length ? events[0].createdAt : new Date();
      const topupTime = addHours(firstEventTime, -2);

      let balance = 0;
      balance += topupAmount;
      await prisma.walletTx.create({
        data: {
          walletId: wallet.id,
          type: 'TOPUP',
          amount: topupAmount,
          balanceAfter: balance,
          description: `Top-up Rp ${topupAmount.toLocaleString('id-ID')}`,
          createdAt: topupTime,
        },
      });

      for (const e of events) {
        balance += e.type === 'REFUND' ? e.amount : -e.amount;
        await prisma.walletTx.create({
          data: {
            walletId: wallet.id,
            type: e.type,
            amount: e.amount,
            balanceAfter: balance,
            description: e.description,
            orderId: e.orderId,
            createdAt: e.createdAt,
          },
        });
      }

      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance },
      });
    }
    console.log('Orders, deliveries, payments, reviews & reversals seeded');
  } else {
    console.log('Orders already exist, skipping transactional seed');
  }

  // Sample reviews - maritime theme
  await prisma.review.createMany({
    skipDuplicates: false,
    data: [
      { reviewerName: 'Budi Santoso', rating: 5, comment: 'Seapedia memudahkan saya mencari suku cadang mesin kapal tanpa harus keliling. Barangnya asli dan pengirimannya cepat!' },
      { reviewerName: 'Siti Aminah', rating: 5, comment: 'Ikan yang saya dapatkan dari seller di sini selalu segar. Sangat membantu bisnis kuliner saya yang membutuhkan bahan baku berkualitas.' },
      { reviewerName: 'Andi Wijaya', rating: 4, comment: 'Marketplace maritim terlengkap. Mulai dari peralatan selam sampai hasil laut semua ada. Sistem pembayarannya juga sangat aman.' },
      { reviewerName: 'Rini Kusuma', rating: 5, comment: 'Alat pancing yang saya beli kualitasnya luar biasa. Harga bersaing dan seller-nya responsif. Highly recommended!' },
      { reviewerName: 'Hendra Laut', rating: 4, comment: 'Platform yang sangat membantu nelayan seperti saya untuk menjual hasil tangkapan langsung ke konsumen. Pendapatan meningkat signifikan.' },
    ],
  }).catch(() => {});

  // System date init
  await prisma.systemDate.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, currentDate: new Date() },
  });

  console.log('Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
