"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Store, Package, Star, MapPin } from "lucide-react";
import api from "@/lib/api";

interface StoreDetail {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  products: { id: string; name: string; price: string; stock: number; imageUrl?: string }[];
  _count: { products: number };
}

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

export default function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: store, isLoading } = useQuery<StoreDetail>({
    queryKey: ["store-detail", id],
    queryFn: () => api.get(`/stores/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Memuat toko...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 font-semibold mb-1">Toko tidak ditemukan</p>
          <Link href="/products" className="text-sm text-cyan-500 hover:text-cyan-600">← Kembali ke produk</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-cyan-500 via-cyan-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Link href="/products" className="text-xs text-cyan-100 hover:text-white mb-4 inline-block">
            ← Kembali ke produk
          </Link>
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <Store className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{store.name}</h1>
              <p className="text-cyan-100 max-w-2xl">{store.description || "Toko di Seapedia"}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-cyan-100">
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" /> {store._count.products} produk
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" /> 4.9 rating
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Indonesia
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-gray-800 mb-5">Produk Tersedia</h2>
        {store.products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Toko ini belum memiliki produk</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {store.products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -2 }}
              >
                <Link href={`/products/${p.id}`} className="block group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-2 shadow-sm">
                    <img
                      src={p.imageUrl || "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&q=80"}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <p className="text-sm text-gray-700 font-medium line-clamp-2 leading-snug mb-1">{p.name}</p>
                  <p className="text-base font-bold text-cyan-600">{formatPrice(Number(p.price))}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Stok: {p.stock}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
