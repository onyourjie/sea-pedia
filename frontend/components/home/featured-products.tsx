"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Star, ArrowRight, Store } from "lucide-react";
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
  discount?: number;
  store?: { name: string };
  ratingAverage?: number;
  reviewCount?: number;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80";

function ProductCard({ product }: { product: Product }) {
  const [imageSrc, setImageSrc] = useState(product.imageUrl || FALLBACK_IMAGE);

  return (
    <motion.div whileHover={{ y: -3 }} className="group h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden">
      <Link href={`/products/${product.id}`} className="flex h-full flex-col">
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            className="object-cover group-hover:scale-105 transition duration-300"
            onError={() => setImageSrc(FALLBACK_IMAGE)}
          />
          {product.discount && (
            <span className="absolute top-2 left-2 text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
              {product.discount}% OFF
            </span>
          )}
          {!product.discount && product.stock > 0 && product.stock < 10 && (
            <span className="absolute top-2 left-2 text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
              Stok Terbatas
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-xs font-bold text-white bg-black/60 px-3 py-1 rounded-full">Habis</span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-3">
          <p className="min-h-10 text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-1.5">{product.name}</p>
          {product.discount ? (
            <div className="min-h-11">
              <p className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</p>
              <p className="text-base font-bold text-cyan-600">{formatPrice(product.price * (1 - product.discount / 100))}</p>
            </div>
          ) : (
            <div className="min-h-11 flex items-end">
              <p className="text-base font-bold text-cyan-600">{formatPrice(Number(product.price))}</p>
            </div>
          )}
          <div className="flex items-center gap-1 mt-auto pt-1.5">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-500">
              {product.ratingAverage && product.ratingAverage > 0 ? product.ratingAverage.toFixed(1) : "Baru"}
            </span>
            <span className="text-gray-300 text-xs">·</span>
            <Store className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400 truncate">{product.store?.name}</span>
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

  const products = (data?.data || []) as Product[];

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Produk Pilihan</h2>
          <p className="text-gray-500 text-sm">Temukan barang berkualitas dari seluruh penjual maritim terpercaya kami.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="h-full"
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
