"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Package, Star, Store } from "lucide-react";
import api from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { DiceBearAvatar } from "@/components/ui/dicebear-avatar";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&q=80";

interface StoreDetail {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  _count?: { products: number };
  ratingAverage?: number;
  reviewCount?: number;
}

interface Product {
  id: string;
  name: string;
  price: number | string;
  stock: number;
  imageUrl?: string;
  discount?: number;
}

interface ProductsResponse {
  data: Product[];
  total: number;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const price = Number(product.price);
  const discountedPrice = product.discount
    ? price * (1 - product.discount / 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      whileHover={{ y: -3 }}
      className="h-full"
    >
      <Link
        href={`/products/${product.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
      >
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={product.imageUrl || FALLBACK_IMAGE}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            onError={(event) => {
              const image = event.currentTarget;
              image.onerror = null;
              image.src = FALLBACK_IMAGE;
            }}
          />
          {product.discount ? (
            <span className="absolute left-2 top-2 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {product.discount}% OFF
            </span>
          ) : null}
          {product.stock === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">
                Habis
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-3">
          <p className="mb-1.5 min-h-10 line-clamp-2 text-sm font-medium leading-snug text-gray-800">
            {product.name}
          </p>
          <div className="min-h-11">
            {discountedPrice ? (
              <p className="text-xs text-gray-400 line-through">{formatPrice(price)}</p>
            ) : null}
            <p className="text-base font-bold text-cyan-600">
              {formatPrice(discountedPrice ?? price)}
            </p>
          </div>
          <p className="mt-auto pt-1 text-xs text-gray-400">
            {product.stock > 0 ? `Stok: ${product.stock}` : "Stok habis"}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

export default function StoreDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: store,
    isLoading: storeLoading,
    isError: storeError,
  } = useQuery<StoreDetail>({
    queryKey: ["store-detail", id],
    queryFn: () => api.get(`/stores/${id}`).then((response) => response.data),
    enabled: Boolean(id),
  });

  const {
    data: productResponse,
    isLoading: productsLoading,
    isError: productsError,
  } = useQuery<ProductsResponse>({
    queryKey: ["store-products-all", id],
    queryFn: () =>
      api.get(`/products?storeId=${encodeURIComponent(id)}&limit=100`).then((response) => response.data),
    enabled: Boolean(id),
  });

  const products = productResponse?.data || [];
  const productTotal = productResponse?.total ?? products.length;

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
            <p className="text-sm text-gray-400">Memuat toko...</p>
          </div>
        </div>
      </div>
    );
  }

  if (storeError || !store) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Navbar />
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <Store className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="mb-1 font-semibold text-gray-700">Toko tidak ditemukan</p>
            <p className="mb-4 text-sm text-gray-400">
              Data toko mungkin sudah tidak tersedia.
            </p>
            <Link href="/products" className="text-sm font-medium text-cyan-500 hover:text-cyan-600">
              Kembali ke produk
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <section className="bg-gradient-to-br from-cyan-500 via-cyan-600 to-teal-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <Link
            href="/products"
            className="mb-5 inline-flex items-center gap-1.5 text-xs text-cyan-100 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke produk
          </Link>

          <div className="flex items-start gap-5">
            <DiceBearAvatar
              seed={store.name}
              type="store"
              className="h-20 w-20 rounded-2xl ring-4 ring-white/30"
            />
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold sm:text-3xl">{store.name}</h1>
              </div>
              <p className="max-w-2xl text-sm text-cyan-100 sm:text-base">
                {store.description || "Toko produk maritim terpercaya di SEAPEDIA."}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-cyan-100">
                <span className="flex items-center gap-1.5">
                  <Package className="h-4 w-4" /> {productTotal} produk
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                  {store.ratingAverage && store.ratingAverage > 0
                    ? `${store.ratingAverage.toFixed(1)} rating · ${store.reviewCount ?? 0} ulasan`
                    : "Belum ada ulasan"}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> Indonesia
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Semua Produk Toko</h2>
            <p className="mt-1 text-sm text-gray-400">{productTotal} produk tersedia</p>
          </div>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="animate-pulse overflow-hidden rounded-2xl bg-white">
                <div className="aspect-square bg-gray-100" />
                <div className="space-y-2 p-3">
                  <div className="h-3 w-3/4 rounded bg-gray-100" />
                  <div className="h-4 w-1/2 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : productsError ? (
          <div className="rounded-2xl border border-red-100 bg-white p-12 text-center">
            <Package className="mx-auto mb-3 h-12 w-12 text-red-200" />
            <p className="font-medium text-gray-600">Produk toko gagal dimuat</p>
            <p className="mt-1 text-sm text-gray-400">Silakan coba muat ulang halaman.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
            <Package className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">Toko ini belum memiliki produk aktif.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
