import { PrismaClient, RoleType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

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
        imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
        imageUrls: [
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
          'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
          'https://images.unsplash.com/photo-1559827291-d8d49a55fb2f?w=800',
        ],
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
        imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
        imageUrls: [
          'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
          'https://images.unsplash.com/photo-1571752726703-5e7d1f6a986d?w=800',
        ],
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
        imageUrl: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400',
        imageUrls: [
          'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800',
          'https://images.unsplash.com/photo-1571752726703-5e7d1f6a986d?w=800',
        ],
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
        imageUrl: 'https://images.unsplash.com/photo-1571752726703-5e7d1f6a986d?w=400',
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
        imageUrl: 'https://images.unsplash.com/photo-1601760562234-9814eea6db4d?w=400',
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
        imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
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
        imageUrl: 'https://images.unsplash.com/photo-1565680018093-ebb6b9ab5460?w=400',
      },
      {
        storeId: store2.id,
        name: 'Ikan Kerapu Merah Segar 1kg',
        description: 'Ikan kerapu merah segar pilihan dari perairan Sulawesi. Cocok untuk dibakar, dikukus, atau digoreng.',
        price: 185000,
        stock: 50,
        imageUrl: 'https://images.unsplash.com/photo-1535140728325-a4d3707eee61?w=400',
      },
      {
        storeId: store2.id,
        name: 'Cumi-cumi Segar 1kg',
        description: 'Cumi-cumi segar berkualitas tinggi, langsung dari nelayan lokal. Tekstur kenyal dan rasa laut yang autentik.',
        price: 95000,
        stock: 80,
        imageUrl: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400',
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
        imageUrl: 'https://images.unsplash.com/photo-1559648028-9bb09d2d3e95?w=400',
      },
      {
        storeId: store3.id,
        name: 'Jaring Ikan Nilon Premium 100m',
        description: 'Jaring ikan nilon kuat dan tahan lama 100 meter. Mata jaring 2cm, cocok untuk berbagai jenis ikan.',
        price: 350000,
        stock: 60,
        imageUrl: 'https://images.unsplash.com/photo-1573160813959-1c6bfda65c4e?w=400',
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
  await prisma.wallet.upsert({
    where: { buyerId: buyer.id },
    update: {},
    create: { buyerId: buyer.id, balance: 5000000 },
  });
  await prisma.address.create({
    data: {
      buyerId: buyer.id,
      label: 'Rumah',
      street: 'Jl. Sudirman No. 1',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      postalCode: '10110',
      isDefault: true,
    },
  }).catch(() => {});
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
  await prisma.driver.upsert({
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
  await prisma.wallet.upsert({
    where: { buyerId: multiBuyer.id },
    update: {},
    create: { buyerId: multiBuyer.id, balance: 2000000 },
  });
  await prisma.driver.upsert({
    where: { userId: multiUser.id },
    update: {},
    create: { userId: multiUser.id },
  });
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
      },
      {
        storeId: multiStore.id,
        name: 'Perahu Karet Inflatable Boat 4 Orang',
        description: 'Perahu karet inflatable kapasitas 4 orang, material PVC tebal tahan abrasi. Lengkap dengan pompa dan dayung.',
        price: 5800000,
        stock: 8,
      },
    ],
  });
  console.log('Multi-role user created:', multiUser.username);

  // Vouchers
  await prisma.voucher.upsert({
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
  await prisma.voucher.upsert({
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
  await prisma.promo.upsert({
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
