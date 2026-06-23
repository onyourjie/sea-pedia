-- AlterTable: tambah recipientName + recipientPhone (NOT NULL via default-then-drop)
ALTER TABLE "Address" ADD COLUMN "recipientName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Address" ADD COLUMN "recipientPhone" TEXT NOT NULL DEFAULT '';

UPDATE "Address"
SET "recipientName" = 'Penerima',
    "recipientPhone" = '081234567890'
WHERE "recipientName" = '' OR "recipientPhone" = '';

-- Drop default supaya kolom benar-benar required ke depannya
ALTER TABLE "Address" ALTER COLUMN "recipientName" DROP DEFAULT;
ALTER TABLE "Address" ALTER COLUMN "recipientPhone" DROP DEFAULT;
