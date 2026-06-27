# SEAPEDIA — Multi-Role Maritime Marketplace

SEAPEDIA adalah marketplace lengkap untuk komoditas hasil laut yang menghubungkan **Buyer**, **Seller**, **Driver**, dan **Admin** dalam satu ekosistem. Project ini dibangun untuk technical challenge SEAPEDIA dan mengimplementasikan Level 1-7 dari spesifikasi.

## Arsitektur

```
sea pedia/
├── backend/        # NestJS + Prisma + PostgreSQL (port 3001)
└── frontend/       # Next.js 14 App Router + Tailwind (port 3000)
```

**Stack:**
- **Backend**: NestJS 10, Prisma 7 (PrismaPg adapter), PostgreSQL, JWT auth, Helmet, Throttler, sanitize-html, bcrypt, class-validator, Swagger
- **Frontend**: Next.js 14, React 18, Tailwind CSS, Framer Motion, TanStack React Query, Zustand, react-hot-toast, Iconify, Lucide

## Cara Menjalankan

### Prasyarat
- Node.js 20+
- PostgreSQL 14+ (database `seapedia`)

### Setup Backend

```bash
cd backend
npm install
cp .env.example .env   # atau buat .env manual (lihat di bawah)
npx prisma db push     # sync schema ke database
npx ts-node prisma/seed.ts   # seed data demo
npm run start:dev      # jalan di port 3001
```

`.env` minimum:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/seapedia"
JWT_SECRET="ganti-dengan-secret-acak"
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

API docs: http://localhost:3001/api/docs (Swagger)

### Setup Frontend

```bash
cd frontend
npm install
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001/api' > .env.local
npm run dev   # jalan di port 3000
```

## Demo Accounts (dari seed)

| Username | Email | Password | Roles | Catatan |
|----------|-------|----------|-------|---------|
| `admin` | admin@seapedia.com | `admin123` | ADMIN | Akses dashboard admin |
| `seller1` | seller1@seapedia.com | `seller123` | SELLER | Punya toko "Oceanic Pro Store" |
| `seller2` | seller2@seapedia.com | `seller123` | SELLER | Punya toko seller kedua |
| `seller3` | seller3@seapedia.com | `seller123` | SELLER | Punya toko seller ketiga |
| `buyer1` | buyer1@seapedia.com | `buyer123` | BUYER | Saldo wallet siap pakai |
| `driver1` | driver1@seapedia.com | `driver123` | DRIVER | Driver pertama |
| `multiuser` | multi@seapedia.com | `multi123` | BUYER+SELLER+DRIVER | Multi-role demo |

> **Catatan Admin:** Akun admin hanya bisa dibuat via seed. Jalankan `npx ts-node prisma/seed.ts` dari folder `backend/` untuk membuat semua akun demo termasuk admin. Jika ingin membuat admin secara manual tanpa seed, daftarkan akun baru via `POST /auth/register` lalu tambahkan role ADMIN langsung ke tabel `UserRole` di database:
> ```sql
> INSERT INTO "UserRole" (id, "userId", role, "createdAt")
> VALUES (gen_random_uuid(), '<user-id>', 'ADMIN', NOW());
> ```

## Demo Flow End-to-End

### 1. Guest Browsing (Level 1)
- Buka http://localhost:3000 (tidak perlu login)
- Browse `/products` → klik salah satu untuk lihat detail produk
- Browse `/stores` → lihat semua toko, klik toko untuk lihat detail dan produknya
- Scroll landing page → submit application review (rating + komentar) tanpa login
- API docs tersedia di http://localhost:3001/api/docs (Swagger)

### 2. Multi-role Login (Level 1)
- Login `multiuser` / `multi123`
- Modal pemilihan peran muncul (BUYER/SELLER/DRIVER)
- Pilih BUYER → masuk ke `/dashboard/buyer`

### 3. Buyer Flow (Level 3-4)
- Top up wallet di `/dashboard/buyer/wallet` (dummy, bisa bebas nominal)
- Tambah alamat di `/dashboard/buyer/addresses`
- Browse `/products` → "Add to Cart" → buka `/dashboard/buyer/cart`
- Klik "Lanjut ke Checkout" → pilih alamat, metode pengiriman, voucher `SAVE10`, promo `PROMO20`
- Lihat ringkasan: subtotal, diskon, ongkir, **PPN 12%**, total
- Klik "Bayar Sekarang" → otomatis redirect ke detail pesanan
- Lihat status timeline: status awal **Sedang Dikemas**

### 4. Seller Flow (Level 2+4)
- Logout, login `seller1` / `seller123`
- Buat/kelola toko di `/dashboard/seller/store` (validasi nama unik)
- CRUD produk di `/dashboard/seller/products`
- Buka `/dashboard/seller/orders` → klik pesanan dari Buyer
- Klik "Proses Pesanan" → status pindah ke **Menunggu Pengirim**

### 5. Driver Flow (Level 5)
- Logout, login `driver1` / `driver123`
- `/dashboard/driver/jobs` → list job available (yang Menunggu Pengirim)
- "Ambil Job" → status pindah ke **Sedang Dikirim**
- `/dashboard/driver/active` → "Konfirmasi Selesai" → status **Pesanan Selesai**
- Lihat earnings di `/dashboard/driver/history` (80% dari ongkir)

### 6. Admin Monitoring (Level 6)
- Logout, login `admin` / `admin123`
- `/dashboard/admin` — overview (users, stores, products, orders, vouchers, dll)
- `/dashboard/admin/vouchers` & `/dashboard/admin/promos` — buat voucher/promo baru
- `/dashboard/admin/overdue` — klik "Maju 1 Hari" beberapa kali untuk simulasi waktu
- Order yang melewati SLA otomatis jadi **Dikembalikan** + saldo refund ke wallet buyer + stok dikembalikan

### 7. Security Tests (Level 7)
- Submit `<script>alert('xss')</script>` di form review — tampil sebagai teks polos (sanitize-html allowlist)
- Logout dari admin, login sebagai BUYER, coba buka `/dashboard/admin` → auto-redirect ke `/login`
- Hit endpoint admin tanpa token via curl → 401 Unauthorized

## Business Rules (Important)

### Single-Store Checkout
Satu cart hanya boleh berisi produk dari **satu toko**. Backend (`CartService.addItem`) menolak produk dari toko berbeda. Buyer harus kosongkan cart dulu untuk pindah toko. UI menampilkan banner peringatan di halaman cart.

### Order Lifecycle
```
SEDANG_DIKEMAS  →  MENUNGGU_PENGIRIM  →  SEDANG_DIKIRIM  →  PESANAN_SELESAI
                                                       ↓
                                                  DIKEMBALIKAN (overdue)
```
Setiap perubahan status disimpan di `OrderStatusHistory` dengan timestamp.

### Discount Rules
- **Voucher**: punya `usageLimit`. Tidak bisa dipakai jika expired atau usage sudah penuh.
- **Promo**: punya `usageLimit` opsional (0 = unlimited). Sama-sama dicek expired & usage.
- **Voucher dan Promo BISA digabungkan** dalam satu transaksi. Total diskon = voucher_disc + promo_disc.
- Semua dihitung dari `subtotal`, bukan akumulasi.
- **Product-level discount** (`Product.discount`, 0–90%): potongan harga ditampilkan di kartu produk dan halaman detail. Berbeda dari Voucher/Promo (yang dipakai di checkout) — discount produk hanya cosmetic price label dan tidak otomatis terkalkulasi di checkout. Produk dengan `discount > 0` muncul di halaman `/products?promo=1` dan section **Hot Deals**.

### PPN 12% Calculation
PPN dihitung dari `(subtotal_setelah_diskon + ongkir) × 12%`. Bukan dari subtotal mentah, dan ongkir ikut dipajaki. Lihat `OrderService.checkout` untuk implementasi.

**Detail rumus:**
```
discounted_subtotal = max(0, subtotal − total_diskon)
tax_base            = discounted_subtotal + delivery_fee
ppn                 = tax_base × 12%
total               = tax_base + ppn
```

**Posisi diskon:** diskon dipotong dari `subtotal` SEBELUM PPN dihitung — buyer hanya bayar PPN atas nilai bersih barang + ongkir.

### Driver Earning Rule
Driver dapat **80% dari ongkir** untuk setiap job yang berhasil diselesaikan (PESANAN_SELESAI). Disimpan di field `Driver.earnings`. Konstanta `DRIVER_EARNING_RATE` ada di `delivery.service.ts`.

### Delivery SLA & Overdue
| Method | SLA | Ongkir |
|--------|-----|--------|
| INSTANT | 4 jam | Rp 25.000 |
| NEXT_DAY | 24 jam | Rp 15.000 |
| REGULAR | 72 jam | Rp 9.000 |

Order yang melewati SLA dan belum sampai status PESANAN_SELESAI akan **otomatis di-refund** ke wallet Buyer + stok dikembalikan + status jadi DIKEMBALIKAN. Trigger via `POST /admin/advance-day` atau `POST /admin/process-overdue`. Sistem mencegah double-refund dengan flag `isOverdue` plus re-check di dalam transaction.

**Income Reversal Audit (Spec L6).** Saat overdue refund:
- Buyer wallet di-credit dengan `WalletTx` type `REFUND` (jejak finansial buyer).
- Stock dikembalikan via `Product.stock { increment }`.
- Seller income otomatis tidak terhitung karena report hanya hitung order ber-status `PESANAN_SELESAI`.
- Driver earning di-decrement dan `DriverEarningLog` dihapus, kalau earning sudah ter-booked.
- Setiap reversal menulis baris di tabel `IncomeReversalLog` (orderId, storeId, driverId, reversedIncome, reversedEarning, reason). Lihat di endpoint `GET /admin/income-reversals`.

**Idempotency.** Sebelum melakukan perubahan di dalam `$transaction`, service melakukan re-read order dan skip kalau `isOverdue=true` atau `status=PESANAN_SELESAI`. Ini mencegah double-refund saat dua worker race atau saat order sudah selesai sebelum cron jalan.

### Time Simulation
SEAPEDIA punya `SystemDate` model yang menyimpan "tanggal sistem" terpisah dari tanggal real. Admin bisa `advance-day` untuk maju 1 hari → otomatis trigger pengecekan SLA. Cocok untuk demo overdue tanpa harus menunggu real-time.

## Security Notes (Level 7)

| Concern | Implementation |
|---------|----------------|
| **SQL Injection** | Semua query via Prisma ORM (parameterized). Tidak ada raw SQL. |
| **XSS — public reviews** | `sanitize-html` dengan empty allowlist (strip semua tag/atribut) di `ReviewService.create` |
| **XSS — JSX rendering** | React auto-escape semua text content saat render |
| **Input validation** | Class-validator decorator di semua DTO + global ValidationPipe (whitelist + forbidNonWhitelisted). Validasi spesifik untuk field sensitif: email (`@IsEmail`), nomor HP penerima alamat (`@Matches(/^(\+62\|62\|0)8[1-9][0-9]{6,11}$/)`), kode pos 5 digit, rating 1-5 (`@Min(1) @Max(5)`), price/stock/quantity/discount (`@IsNumber() @Min(0)`) |
| **Password hashing** | bcrypt cost=12 |
| **JWT auth** | Bearer token, signed dengan `JWT_SECRET`. Access token expiry: **7d** (override via env `JWT_EXPIRES_IN`). Selection token (role picker): **10 menit**. JWT membawa `sid` (session id) — logout hanya hapus session yang match (per-device), bukan semua session user |
| **Role enforcement** | `RolesGuard` cek `activeRole` di JWT payload untuk semua endpoint terproteksi |
| **CORS** | Lockdown via `CORS_ORIGIN` env (default `http://localhost:3000`), bukan wildcard |
| **Rate limiting** | `@nestjs/throttler` global guard (10 req/sec, 100 req/min) |
| **Helmet** | XSS/clickjacking protection headers |
| **Resource ownership** | Setiap controller cek `userId === resource.userId` (Seller produk, Buyer order, Driver delivery) |

### Test Cases Manual
1. Submit review dengan payload `<img src=x onerror=alert(1)>` → tersimpan sebagai teks `""` (semua tag stripped), display aman.
2. POST `/orders/checkout` dengan field tambahan `isAdmin: true` → 400 (forbidNonWhitelisted).
3. Login sebagai BUYER, hit `/admin/users` → 403 Forbidden (RolesGuard).
4. Login `seller1`, hit `/products/seller/<seller2_product_id>` PATCH → 404 (ownership check).

## Payment Gateway — Xendit (Real Top-Up Flow)

SEAPEDIA terintegrasi dengan **Xendit** untuk top-up wallet menggunakan channel pembayaran Indonesia (Virtual Account, e-wallet, QRIS, retail outlet, kartu kredit). Ini melengkapi tombol "Top Up Instan (Demo)" yang langsung kredit saldo tanpa proses payment.

### Setup

Tambahkan ke `backend/.env`:
```
XENDIT_SECRET_KEY=xnd_development_xxx
XENDIT_WEBHOOK_TOKEN=xxx
FRONTEND_BASE_URL=http://localhost:3000
```

Dapatkan key di [dashboard.xendit.co](https://dashboard.xendit.co) → Settings → Developers → API Keys (gunakan Test Mode keys). Webhook token dibuat di Settings → Webhooks → Verification Token.

### Demo Flow

1. Login sebagai Buyer → buka `/dashboard/buyer/wallet`
2. Masukkan nominal (≥ Rp 10.000) → klik **"Bayar via Xendit"**
3. Browser redirect ke halaman invoice Xendit (hosted) → pilih channel pembayaran (Virtual Account, e-wallet, dll)
4. Untuk demo cepat: pakai test bank Xendit (BCA test channel auto-paid via simulator dashboard)
5. Setelah PAID, Xendit kirim webhook ke `POST /webhooks/xendit` → service kredit `Wallet.balance` + tulis `WalletTx` type `TOPUP` status `PAID`
6. Frontend redirect kembali ke `?topup=success` → polling 3 detik selama 30 detik untuk refresh saldo

### Webhook Tunneling untuk Demo Lokal

Karena Xendit perlu hit URL public, gunakan tunnel saat development:
```bash
# pakai cloudflared (gratis, tanpa signup)
cloudflared tunnel --url http://localhost:3001
# atau ngrok
ngrok http 3001
```
Set webhook URL di Xendit dashboard ke `https://<tunnel-url>/api/webhooks/xendit`. Test pakai tombol "Send Test" di dashboard.

### Idempotency & Reliability

Xendit me-retry webhook hingga 6 kali kalau gagal. Service ini idempotent berkat:
- Field `WalletTx.externalId` (unique) — referensi ke `external_id` Xendit. Pre-create row PENDING saat invoice dibuat.
- Webhook handler cek `status === 'PAID'` di outer + re-check di dalam `$transaction` (race protection saat ada 2 webhook concurrent).
- Status flip PENDING → PAID hanya sekali. Webhook kedua return `{ ignored: true, reason: 'already_paid' }`.

### Security

- Webhook protected via `x-callback-token` header check (constant-time-equivalent string compare — tolerable untuk panjang token random 48+ char).
- Webhook controller throttle 60 req/menit (bukan 10/detik default) supaya retry Xendit tidak ke-block.
- Endpoint `/wallet/topup/xendit` butuh JWT + role BUYER (sama seperti dummy topup).
- Refund overdue tetap masuk wallet — tidak refund ke channel asli, jadi tidak ada PII pembayaran yang perlu disimpan.

## Product & Review Features

### Multi-image Carousel
`Product.imageUrls` (String[]) menyimpan gambar tambahan di luar `imageUrl` utama. Detail page menampilkan carousel dengan tombol kiri/kanan, dot indicator, dan thumbnail strip. Admin/seller bisa input hingga 8 URL gambar per produk lewat form `/dashboard/seller/products`.

### Product Specifications
`Product.specifications` (Json key/value) — contoh: `{ "Berat": "500g", "Material": "Cordura 1000D" }`. Dirender di tab "Spesifikasi" di halaman detail. Spec kosong dilewati saat save.

### Product Reviews & Store Rating
Setelah order berstatus `PESANAN_SELESAI`, buyer dapat menekan tombol "Beri Ulasan" per item di halaman detail order:
- 1 rating per OrderItem (`ProductReview.orderItemId` unique) — buyer tidak bisa double review.
- Komentar disanitasi (`sanitize-html`) sebelum disimpan.
- Rating produk (`GET /products/:id`) = average dari semua `ProductReview` untuk produk tersebut.
- Rating toko (`GET /stores/:id`) = average dari semua `ProductReview` di seluruh produk milik toko itu.

### Catalog Sections
Endpoint baru di `/products`:
- `GET /products/bestsellers` — top 10 produk dari agregasi `OrderItem` di order PESANAN_SELESAI (bukan dari order pending; jadi return tidak ikut).
- `GET /products/hot-deals` — produk aktif `discount > 0` urut diskon desc, ditambah `createdAt` desc untuk tie-break.
- `GET /products/new-arrivals` — 10 produk terbaru by `createdAt` desc.
- Sort `?sort=bestseller` di `/products` memetakan ke endpoint bestsellers.
- Filter `?promo=1` mengembalikan hanya produk dengan `discount > 0`.



| Role | Halaman | Tombol |
|------|---------|--------|
| Buyer | `/dashboard/buyer/report` | "Cetak / Simpan PDF" |
| Seller | `/dashboard/seller/report` | "Cetak / Simpan PDF" |
| Driver | `/dashboard/driver/history` | "Cetak / Simpan PDF" |

Saat tombol diklik, browser membuka print dialog. Pilih "Save as PDF" sebagai destination → file PDF tersimpan dengan layout yang bersih (tanpa nav/sidebar). Implementasi pakai print CSS di `app/globals.css` (`@media print` + class `print-area` / `no-print` / `print-card`) — tidak butuh library pihak ketiga seperti jsPDF, jadi bundle tetap kecil.

## Tests

Backend punya unit tests untuk flow kritis. Jalankan dengan:
```bash
cd backend
npm test                                          # semua tests
npm test -- --testPathPattern=order.service       # test checkout (PPN, voucher, wallet)
npm test -- --testPathPattern=delivery.service    # test take job & complete job
npm test -- --testPathPattern=admin.service       # test overdue refund & idempotency
npm test -- --testPathPattern=payment.service     # test Xendit webhook idempotency
```

Coverage saat ini:
- `OrderService.checkout` — PPN math, voucher/promo, expired/usage-limit rejection, insufficient wallet, delivery fee per method, address ownership
- `DeliveryService.takeJob` / `completeJob` — race condition saat ambil job, ownership, status guard, earning calculation
- `AdminService.processOverdueOrders` — refund + stock restore + reversal log + idempotency + driver earning reversal + SLA per delivery method

## API Documentation

- **Swagger UI**: http://localhost:3001/api/docs
- **Endpoints utama**:
  - `/auth/*` — register, login, select-role, logout, me
  - `/products/*` — public list/detail, bestsellers, hot-deals, new-arrivals, seller CRUD, product reviews
  - `/stores/*` — public list/detail + seller management
  - `/cart/*` — buyer cart (single-store), add/update/remove/clear
  - `/addresses/*` — buyer addresses CRUD
  - `/wallet/*` — buyer balance, dummy topup, transaction history
  - `/wallet/topup/xendit` — initiate Xendit invoice (BUYER)
  - `/webhooks/xendit` — Xendit payment callback (public, token-verified)
  - `/orders/*` — checkout, buyer/seller views, seller process, buyer/seller reports
  - `/vouchers/*` — list, validate, detail + admin create
  - `/promos/*` — list, validate, detail + admin create
  - `/delivery/*` — driver available jobs, my jobs, job detail, take, complete
  - `/product-reviews/*` — create review (BUYER, completed orders only), my reviews
  - `/reviews/*` — public application reviews (list + create)
  - `/admin/*` — monitoring (users/stores/products/orders/vouchers/promos/deliveries/overdue), advance-day, process-overdue, income-reversals
  - `/users/profile` — profil user aktif
  - `/stats/public` — statistik publik marketplace

## Folder Highlights

```
backend/src/
├── auth/             # registration, login, JWT, multi-role
├── product/          # public catalog + seller CRUD
├── store/            # store profile + uniqueness
├── cart/             # single-store cart enforcement
├── address/          # buyer delivery addresses
├── wallet/           # balance + transactions
├── order/            # checkout, status lifecycle, reports
├── voucher/, promo/  # discount system
├── delivery/         # driver job system + earnings
├── review/           # public app reviews + sanitize
├── admin/            # monitoring + overdue + time-sim
└── common/           # guards, decorators, filters

frontend/app/
├── page.tsx          # landing
├── products/         # public catalog + detail
├── stores/[id]/      # public store detail
├── login/, register/
└── dashboard/
    ├── buyer/        # dashboard, cart, checkout, orders, wallet, addresses, report
    ├── seller/       # dashboard, store, products, orders, report
    ├── driver/       # dashboard, jobs, active, history
    ├── admin/        # dashboard, users, stores, products, orders, deliveries, vouchers, promos, overdue
    └── profile/      # shared profile + role switcher
```

## Catatan Tambahan

- **Cyan/teal palette** dipakai konsisten untuk Buyer + branding utama. Orange untuk Seller. Green untuk Driver. Purple untuk Admin.
- **Toast notifications** (react-hot-toast) untuk semua feedback — tidak ada inline error message.
- **UI** Iconify atau Lucide icons.
- Frontend client-side — semua data dari API, tidak ada SSR data fetching.
- React Query cache 60 detik default; invalidasi setelah mutation.
