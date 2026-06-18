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
      name: 'Toko Elektronik Maju',
      description: 'Toko elektronik terpercaya',
    },
  });
  await prisma.product.createMany({
    skipDuplicates: true,
    data: [
      { storeId: store.id, name: 'Laptop Gaming', description: 'Laptop untuk gaming', price: 15000000, stock: 10 },
      { storeId: store.id, name: 'Mouse Wireless', description: 'Mouse wireless ergonomis', price: 250000, stock: 50 },
      { storeId: store.id, name: 'Keyboard Mechanical', description: 'Keyboard mechanical RGB', price: 800000, stock: 30 },
    ],
  });
  console.log('Seller + store + products created:', sellerUser.username);

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

  // Sample reviews
  await prisma.review.createMany({
    skipDuplicates: false,
    data: [
      { reviewerName: 'Andi', rating: 5, comment: 'Marketplace terbaik, pengiriman cepat!' },
      { reviewerName: 'Budi', rating: 4, comment: 'Produk lengkap dan harga terjangkau.' },
      { reviewerName: 'Citra', rating: 5, comment: 'Sangat mudah digunakan, recommended!' },
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
