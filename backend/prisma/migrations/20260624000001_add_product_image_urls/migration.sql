-- AlterTable: tambah kolom imageUrls (array of text) di Product
ALTER TABLE "Product" ADD COLUMN "imageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
