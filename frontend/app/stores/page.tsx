"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Store, Package, Star, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { DiceBearAvatar } from "@/components/ui/dicebear-avatar";

interface StoreItem {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  _count?: { products: number };
  ratingAverage?: number;
  reviewCount?: number;
}

interface StoresResponse {
  data: StoreItem[];
  total: number;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { year: "numeric", month: "long" });
}

function StoreCard({ store, index }: { store: StoreItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
      whileHover={{ y: -3 }}
    >
      <Link
        href={`/stores/${store.id}`}
        className="group flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-5"
      >
        <div className="flex items-start gap-4 mb-4">
          <DiceBearAvatar
            seed={store.name}
            type="store"
            className="h-14 w-14 rounded-xl ring-2 ring-gray-100 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 text-base leading-snug truncate group-hover:text-cyan-600 transition">
              {store.name}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Bergabung {formatDate(store.createdAt)}</p>
          </div>
        </div>

        {store.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{store.description}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Package className="h-3.5 w-3.5 text-cyan-400" />
              {store._count?.products ?? 0} produk
            </span>
            {store.ratingAverage && store.ratingAverage > 0 ? (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                {store.ratingAverage.toFixed(1)}
                {store.reviewCount ? ` (${store.reviewCount})` : ""}
              </span>
            ) : (
              <span className="text-gray-300">Belum ada ulasan</span>
            )}
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-cyan-500 transition" />
        </div>
      </Link>
    </motion.div>
  );
}

export default function StoresPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading, isError } = useQuery<StoresResponse>({
    queryKey: ["stores-list", search, page],
    queryFn: () =>
      api
        .get(`/stores`, { params: { search: search || undefined, page, limit } })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const stores = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPage(1);
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <section className="bg-gradient-to-br from-cyan-500 via-cyan-600 to-teal-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="flex items-center gap-3 mb-3">
            <Store className="h-7 w-7 text-cyan-100" />
            <h1 className="text-3xl font-bold">Semua Toko</h1>
          </div>
          <p className="text-cyan-100 text-sm max-w-xl mb-6">
            Temukan produk dari berbagai penjual terpercaya di SEAPEDIA marketplace.
          </p>

          <form onSubmit={handleSearch} className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama toko..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-gray-800 text-sm outline-none focus:ring-2 focus:ring-cyan-300 placeholder:text-gray-400"
            />
          </form>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500">
            {isLoading ? "Memuat..." : `${total} toko ditemukan`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl p-5 border border-gray-100">
                <div className="flex gap-3 mb-4">
                  <div className="h-14 w-14 rounded-xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3.5 w-3/4 rounded bg-gray-100" />
                    <div className="h-3 w-1/2 rounded bg-gray-100" />
                  </div>
                </div>
                <div className="h-3 w-full rounded bg-gray-100 mb-2" />
                <div className="h-3 w-2/3 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-100 bg-white p-12 text-center">
            <Store className="mx-auto mb-3 h-12 w-12 text-red-200" />
            <p className="font-medium text-gray-600">Gagal memuat daftar toko</p>
            <p className="mt-1 text-sm text-gray-400">Silakan coba muat ulang halaman.</p>
          </div>
        ) : stores.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center">
            <Store className="mx-auto mb-3 h-14 w-14 text-gray-200" />
            <p className="font-semibold text-gray-700 mb-1">Toko tidak ditemukan</p>
            <p className="text-sm text-gray-400">
              {search ? `Tidak ada toko dengan nama "${search}".` : "Belum ada toko yang terdaftar."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {stores.map((store, index) => (
                <StoreCard key={store.id} store={store} index={index} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Sebelumnya
                </button>
                <span className="text-sm text-gray-500 px-2">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Berikutnya
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
