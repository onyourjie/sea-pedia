"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Star, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  store?: { name: string };
}

function ProductCard({ product }: { product: Product }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="group">
      <Link href={`/products/${product.id}`}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden">
          <div className="relative aspect-square bg-gray-50 overflow-hidden">
            <img
              src={product.imageUrl || `https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80`}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
            {product.stock < 10 && (
              <span className="absolute top-2 left-2 text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                Stok Terbatas
              </span>
            )}
          </div>
          <div className="p-3">
            <div className="flex items-center gap-1 mb-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-gray-500">5.0</span>
            </div>
            <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight mb-2">{product.name}</p>
            <p className="text-base font-bold text-cyan-600">{formatPrice(Number(product.price))}</p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <span className="w-3 h-3 inline-block">🏪</span>
              {product.store?.name}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export function FeaturedProducts() {
  const { data, isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => api.get("/products?limit=8").then((r: { data: { data: Product[] } }) => r.data),
  });

  const products = data?.data || [];

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Produk Pilihan Hari Ini</h2>
        <p className="text-gray-500 text-sm">Temukan barang berkualitas dari seluruh penjual maritim terpercaya kami.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : (products as Product[]).map((product: Product, i: number) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
      </div>

      <div className="text-center mt-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-8 py-3 rounded-full transition shadow-lg shadow-cyan-500/20"
        >
          Jelajahi Semua Produk <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
