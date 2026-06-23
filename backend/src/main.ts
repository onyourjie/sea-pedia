import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000'];
  app.enableCors({ origin: corsOrigin, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('SEAPEDIA API')
    .setDescription(
      'REST API marketplace multi-role SEAPEDIA. Gunakan tombol Authorize untuk endpoint yang memerlukan Bearer JWT.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan access token JWT tanpa awalan "Bearer ".',
      },
      'bearer',
    )
    .addTag('auth', 'Registrasi, login, pemilihan role, dan sesi pengguna.')
    .addTag('users', 'Profil pengguna yang sedang masuk.')
    .addTag('stores', 'Katalog toko dan pengelolaan toko seller.')
    .addTag('products', 'Katalog produk publik dan pengelolaan produk seller.')
    .addTag('wallet', 'Saldo dan transaksi wallet buyer.')
    .addTag('payment', 'Pembayaran eksternal dan callback Xendit.')
    .addTag('addresses', 'Alamat pengiriman buyer.')
    .addTag('cart', 'Keranjang belanja buyer.')
    .addTag('orders', 'Checkout, pesanan buyer, dan pemrosesan seller.')
    .addTag('vouchers', 'Voucher potongan harga.')
    .addTag('promos', 'Promo marketplace.')
    .addTag('delivery', 'Pekerjaan pengiriman driver.')
    .addTag('admin', 'Dashboard dan operasi administratif.')
    .addTag('reviews', 'Ulasan umum marketplace.')
    .addTag('product-reviews', 'Ulasan produk dari pesanan buyer.')
    .addTag('stats', 'Statistik publik marketplace.')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
  console.log(`SEAPEDIA backend running on port ${process.env.PORT ?? 3001}`);
}
void bootstrap();
