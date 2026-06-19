"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Star, ArrowRight, Store, Flame, Box, Sparkles } from "lucide-react";
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
}

const TABS = [
  { label: "Pilihan", value: "", icon: Sparkles },
  { label: "Terbaru", value: "newest", icon: Box },
  { label: "Hot Deals", value: "hot", icon: Flame },
];

function ProductCard({ product }: { product: Product }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <img
            src={product.imageUrl || "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80"; }}
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
        <div className="p-3">
          <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-1.5">{product.name}</p>
          {product.discount ? (
            <div>
              <p className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</p>
              <p className="text-base font-bold text-cyan-600">{formatPrice(product.price * (1 - product.discount / 100))}</p>
            </div>
          ) : (
            <p className="text-base font-bold text-cyan-600">{formatPrice(Number(product.price))}</p>
          )}
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-500">4.9</span>
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
  const [activeTab, setActiveTab] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["featured-products", activeTab],
    queryFn: () => {
      let url = "/products?limit=8";
      if (activeTab === "newest") url += "&sort=newest";
      if (activeTab === "hot") url += "&sort=price_asc&promo=1";
      return api.get(url).then((r: { data: { data: Product[] } }) => r.data);
    },
  });

  const products = (data?.data || []) as Product[];

  const viewAllHref = activeTab === "newest" ? "/products?sort=newest" : activeTab === "hot" ? "/products?promo=1" : "/products";

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Produk Pilihan</h2>
          <p className="text-gray-500 text-sm">Temukan barang berkualitas dari seluruh penjual maritim terpercaya kami.</p>
        </div>
        <div className="flex gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === tab.value
                    ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-cyan-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
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
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
      </div>

      <div className="text-center mt-8">
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-8 py-3 rounded-full transition shadow-lg shadow-cyan-500/20"
        >
          Jelajahi Semua Produk <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
