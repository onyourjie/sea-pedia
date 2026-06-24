"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Star, Flame, TrendingUp, ArrowRight, LucideIcon, BoxIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface Product {
  id: string;
  name: string;
  price: number | string;
  stock: number;
  imageUrl?: string;
  discount?: number;
  store?: { id: string; name: string };
  ratingAverage?: number;
  reviewCount?: number;
  soldCount?: number;
}

const FALLBACK = "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80";

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

function ProductCard({ product, badge }: { product: Product; badge?: { label: string; color: string } }) {
  const price = Number(product.price);
  const discountedPrice = product.discount ? price * (1 - product.discount / 100) : null;

  return (
    <motion.div whileHover={{ y: -3 }} className="group h-full">
      <Link
        href={`/products/${product.id}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
      >
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={product.imageUrl || FALLBACK}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            onError={(e) => {
              const img = e.currentTarget;
              img.onerror = null;
              img.src = FALLBACK;
            }}
          />
          {badge && (
            <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${badge.color}`}>
              {badge.label}
            </span>
          )}
          {product.discount ? (
            <span className="absolute right-2 top-2 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {product.discount}% OFF
            </span>
          ) : null}
          {product.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">Habis</span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-3">
          <p className="mb-1.5 min-h-10 line-clamp-2 text-sm font-medium leading-snug text-gray-800">{product.name}</p>
          <div className="min-h-11">
            {discountedPrice ? (
              <>
                <p className="text-xs text-gray-400 line-through">{formatPrice(price)}</p>
                <p className="text-base font-bold text-cyan-600">{formatPrice(discountedPrice)}</p>
              </>
            ) : (
              <p className="flex h-full items-end text-base font-bold text-cyan-600">{formatPrice(price)}</p>
            )}
          </div>
          <div className="mt-auto flex items-center gap-1 pt-1.5 text-xs text-gray-400">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{product.ratingAverage && product.ratingAverage > 0 ? product.ratingAverage.toFixed(1) : "Baru"}</span>
            {product.soldCount !== undefined && product.soldCount > 0 && (
              <>
                <span className="text-gray-300">·</span>
                <span>{product.soldCount} terjual</span>
              </>
            )}
            {product.soldCount === undefined && product.store && (
              <>
                <span className="text-gray-300">·</span>
                <span className="truncate">{product.store.name}</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-3/4 rounded bg-gray-100" />
        <div className="h-4 w-1/2 rounded bg-gray-100" />
        <div className="h-3 w-2/3 rounded bg-gray-100" />
      </div>
    </div>
  );
}

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  href: string;
  endpoint: string;
  queryKey: string;
  badge?: { label: string; color: string };
  emptyMessage?: string;
}

export function ProductSection({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  href,
  endpoint,
  queryKey,
  badge,
  emptyMessage,
}: ProductSectionProps) {
  const { data, isLoading } = useQuery<{ data: Product[]; total?: number }>({
    queryKey: [queryKey],
    queryFn: () => api.get(endpoint).then((r) => r.data),
  });

  const products = data?.data || [];
  if (!isLoading && products.length === 0 && !emptyMessage) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <Link
          href={href}
          className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium"
        >
          Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.slice(0, 5).map((p) => (
            <ProductCard key={p.id} product={p} badge={badge} />
          ))}
        </div>
      )}
    </section>
  );
}

export function HotDealsSection() {
  return (
    <ProductSection
      title="Hot Deals"
      subtitle="Diskon terbaik hari ini, terbatas selagi stok ada"
      icon={Flame}
      iconColor="text-orange-500"
      iconBg="bg-orange-50"
      href="/products?deals=1"
      endpoint="/products/hot-deals?limit=10"
      queryKey="hot-deals"
      badge={{ label: "HOT", color: "bg-red-500" }}
      emptyMessage="Belum ada produk diskon. Cek lagi nanti."
    />
  );
}

export function BestsellersSection() {
  return (
    <ProductSection
      title="Produk Terlaris"
      subtitle="10 produk paling laris dipilih pembeli"
      icon={TrendingUp}
      iconColor="text-cyan-600"
      iconBg="bg-cyan-50"
      href="/products?sort=bestseller"
      endpoint="/products/bestsellers?limit=10"
      queryKey="bestsellers"
      badge={{ label: "TERLARIS", color: "bg-cyan-500" }}
    />
  );
}

export function NewArrivalsSection() {
  return (
    <ProductSection
      title="Produk Baru"
      subtitle="Baru ditambahkan oleh penjual"
      icon={BoxIcon}
      iconColor="text-purple-500"
      iconBg="bg-purple-50"
      href="/products?sort=newest"
      endpoint="/products/new-arrivals?limit=10"
      queryKey="new-arrivals"
      badge={{ label: "BARU", color: "bg-purple-500" }}
    />
  );
}
