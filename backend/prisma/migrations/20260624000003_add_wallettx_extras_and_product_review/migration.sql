-- AlterTable: WalletTx tambah externalId + status
ALTER TABLE "WalletTx" ADD COLUMN "externalId" TEXT;
ALTER TABLE "WalletTx" ADD COLUMN "status" TEXT;
CREATE UNIQUE INDEX "WalletTx_externalId_key" ON "WalletTx"("externalId");

-- CreateTable: ProductReview
CREATE TABLE "ProductReview" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductReview_orderItemId_key" ON "ProductReview"("orderItemId");

ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
