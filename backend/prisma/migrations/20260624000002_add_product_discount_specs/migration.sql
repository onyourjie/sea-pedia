-- AlterTable: tambah kolom discount + specifications di Product
ALTER TABLE "Product" ADD COLUMN "discount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "specifications" JSONB;
