# SEAPEDIA Backend

Multi-role marketplace API built with NestJS, Prisma, and PostgreSQL.

## Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT with active role in payload
- **Validation**: class-validator + class-transformer
- **Docs**: Swagger/OpenAPI at `/api/docs`

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL
```

## Environment Variables

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/seapedia"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3001
```

## Database

```bash
# Create and apply migrations
npx prisma migrate dev --name init

# Seed demo data
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

## Running

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

API available at `http://localhost:3001/api`
Swagger docs at `http://localhost:3001/api/docs`

### Swagger / OpenAPI

- Interactive Swagger UI: `http://localhost:3001/api/docs`
- OpenAPI JSON: `http://localhost:3001/api/docs-json`
- Endpoint yang dilindungi menampilkan ikon gembok dan role yang diizinkan.
- Klik **Authorize**, lalu masukkan access token JWT tanpa menulis awalan `Bearer`.
- Setiap operasi mendokumentasikan request body, query/path parameter, status sukses,
  error umum, serta contoh response.

---

## Demo Accounts

| Role                             | Username    | Password    |
| -------------------------------- | ----------- | ----------- |
| Admin                            | `admin`     | `admin123`  |
| Seller                           | `seller1`   | `seller123` |
| Buyer                            | `buyer1`    | `buyer123`  |
| Driver                           | `driver1`   | `driver123` |
| Multi-role (Buyer+Seller+Driver) | `multiuser` | `multi123`  |

`buyer1` starts with Rp 5.000.000 wallet balance and a default Jakarta address.

---

## Demo Discount Codes

| Code      | Type    | Description                         |
| --------- | ------- | ----------------------------------- |
| `SAVE10`  | Voucher | 10% off, max Rp 50.000, 100 uses    |
| `FLAT50K` | Voucher | Rp 50.000 off, min order Rp 200.000 |
| `PROMO20` | Promo   | 20% off, max Rp 100.000             |

---

## API Endpoints Summary

### Auth

| Method | Endpoint                | Description          |
| ------ | ----------------------- | -------------------- |
| POST   | `/api/auth/register`    | Register new user    |
| POST   | `/api/auth/login`       | Login                |
| POST   | `/api/auth/select-role` | Select active role   |
| GET    | `/api/auth/me`          | Current user profile |

### Products & Stores (Public)

| Method | Endpoint            | Description                            |
| ------ | ------------------- | -------------------------------------- |
| GET    | `/api/products`     | List products (search, storeId filter) |
| GET    | `/api/products/:id` | Product detail                         |
| GET    | `/api/stores`       | List stores                            |
| GET    | `/api/stores/:id`   | Store detail                           |

### Seller

| Method | Endpoint                         | Description                       |
| ------ | -------------------------------- | --------------------------------- |
| POST   | `/api/stores`                    | Create store                      |
| PATCH  | `/api/stores`                    | Update store                      |
| GET    | `/api/stores/seller/my-store`    | My store                          |
| POST   | `/api/products/seller`           | Create product                    |
| PATCH  | `/api/products/seller/:id`       | Update product                    |
| DELETE | `/api/products/seller/:id`       | Delete product                    |
| GET    | `/api/orders/seller`             | Incoming orders                   |
| POST   | `/api/orders/seller/:id/process` | Process order → Menunggu Pengirim |
| GET    | `/api/orders/seller/report`      | Income report                     |

### Buyer

| Method                | Endpoint                     | Description                  |
| --------------------- | ---------------------------- | ---------------------------- |
| GET                   | `/api/wallet`                | Wallet + transaction history |
| POST                  | `/api/wallet/topup`          | Top up balance               |
| GET/POST/PATCH/DELETE | `/api/addresses`             | Address management           |
| GET                   | `/api/cart`                  | View cart                    |
| POST                  | `/api/cart/items`            | Add to cart                  |
| PATCH                 | `/api/cart/items/:productId` | Update quantity              |
| DELETE                | `/api/cart/items/:productId` | Remove item                  |
| DELETE                | `/api/cart/clear`            | Clear cart                   |
| POST                  | `/api/orders/checkout`       | Checkout                     |
| GET                   | `/api/orders/buyer`          | Order history                |
| GET                   | `/api/orders/buyer/:id`      | Order detail                 |
| GET                   | `/api/orders/buyer/report`   | Spending report              |

### Driver

| Method | Endpoint                          | Description                    |
| ------ | --------------------------------- | ------------------------------ |
| GET    | `/api/delivery/jobs/available`    | Available jobs                 |
| GET    | `/api/delivery/jobs/my`           | My jobs + earnings             |
| POST   | `/api/delivery/jobs/:id/take`     | Take job → Sedang Dikirim      |
| POST   | `/api/delivery/jobs/:id/complete` | Complete job → Pesanan Selesai |

### Admin

| Method | Endpoint                     | Description                         |
| ------ | ---------------------------- | ----------------------------------- |
| GET    | `/api/admin/dashboard`       | Marketplace overview                |
| GET    | `/api/admin/users`           | All users                           |
| GET    | `/api/admin/orders`          | All orders                          |
| GET    | `/api/admin/deliveries`      | All deliveries                      |
| GET    | `/api/admin/overdue`         | Overdue orders                      |
| GET    | `/api/admin/system-date`     | Current system date                 |
| POST   | `/api/admin/advance-day`     | Advance 1 day + run overdue check   |
| POST   | `/api/admin/process-overdue` | Manually trigger overdue processing |
| POST   | `/api/vouchers`              | Create voucher                      |
| POST   | `/api/promos`                | Create promo                        |

### Reviews (Public)

| Method | Endpoint       | Description                        |
| ------ | -------------- | ---------------------------------- |
| GET    | `/api/reviews` | List app reviews                   |
| POST   | `/api/reviews` | Submit a review (no auth required) |

---

## Business Rules

### Single-Store Checkout

One cart may only contain products from one store. Adding a product from a different store returns HTTP 400 with a clear message to clear the cart first.

### Checkout Calculation

```
subtotal        = sum(price × quantity)
discountAmount  = voucher discount + promo discount (applied to subtotal)
discountedBase  = max(0, subtotal - discountAmount)
taxBase         = discountedBase + deliveryFee
PPN (12%)       = taxBase × 0.12
total           = taxBase + PPN
```

Discount is applied **before** PPN. PPN is calculated on (discounted subtotal + delivery fee).

### Delivery Fees

| Method   | Fee       |
| -------- | --------- |
| INSTANT  | Rp 25.000 |
| NEXT_DAY | Rp 15.000 |
| REGULAR  | Rp 9.000  |

### Voucher vs Promo

- **Voucher**: has `usageLimit` that decrements on each use. Expires by date.
- **Promo**: no usage limit, expires by date only.
- Both can be applied in the same checkout (discounts are summed).

### Driver Earnings

Drivers earn **80% of the delivery fee** per completed job.

### Delivery SLA (Overdue Handling)

| Method   | SLA      |
| -------- | -------- |
| INSTANT  | 4 hours  |
| NEXT_DAY | 24 hours |
| REGULAR  | 72 hours |

When an order exceeds its SLA the system:

1. Sets status → `DIKEMBALIKAN`
2. Refunds the full order total to Buyer wallet
3. Restores product stock
4. Records a `REFUND` wallet transaction
5. Marks the order `isOverdue: true`

Use `POST /api/admin/advance-day` to simulate time. Each call advances system date by 1 day and triggers overdue processing automatically.

### Order Lifecycle

```
Sedang Dikemas       (after checkout)
    ↓  Seller processes
Menunggu Pengirim
    ↓  Driver takes job
Sedang Dikirim
    ↓  Driver completes
Pesanan Selesai

Any active status → Dikembalikan  (SLA exceeded)
```

---

## Security

| Concern          | Approach                                                                      |
| ---------------- | ----------------------------------------------------------------------------- |
| SQL Injection    | Prisma ORM parameterized queries only, no raw SQL                             |
| XSS              | Review content sanitized server-side (HTML tags stripped before storage)      |
| Input Validation | `class-validator` on all DTOs; global `ValidationPipe` with `whitelist: true` |
| Auth             | JWT (7d expiry); stateless — logout handled client-side by discarding token   |
| RBAC             | Active role verified server-side from JWT payload on every protected endpoint |
| HTTP Headers     | `helmet` middleware on all responses                                          |

---

## End-to-End Demo Flow

1. `GET /api/products` — browse as guest
2. `POST /api/auth/register` — register with roles `["BUYER"]`
3. `POST /api/auth/login` — get access token
4. `POST /api/wallet/topup` — add balance
5. `POST /api/addresses` — add delivery address
6. `POST /api/cart/items` — add product to cart
7. `POST /api/orders/checkout` — checkout with delivery method + optional discount code
8. Login as `seller1` → `POST /api/orders/seller/:id/process`
9. Login as `driver1` → `POST /api/delivery/jobs/:id/take` → `POST /api/delivery/jobs/:id/complete`
10. Login as `admin` → `POST /api/admin/advance-day` to simulate time and trigger overdue handling
