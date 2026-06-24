"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ClipboardList, ChevronRight, Search, Eye } from "lucide-react";
import api from "@/lib/api";
import { SkeletonOrderCard } from "@/components/ui/skeleton";

interface Order {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  buyer?: { user: { username: string } };
  items: { id: string; name: string; quantity: number }[];
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  SEDANG_DIKEMAS: { label: "Perlu Diproses", color: "bg-orange-50 text-orange-600" },
  MENUNGGU_PENGIRIM: { label: "Menunggu Driver", color: "bg-yellow-50 text-yellow-700" },
  SEDANG_DIKIRIM: { label: "Dikirim", color: "bg-blue-50 text-blue-600" },
  PESANAN_SELESAI: { label: "Selesai", color: "bg-green-50 text-green-700" },
  DIKEMBALIKAN: { label: "Dikembalikan", color: "bg-red-50 text-red-600" },
};

const FILTERS = ["Semua", "SEDANG_DIKEMAS", "MENUNGGU_PENGIRIM", "SEDANG_DIKIRIM", "PESANAN_SELESAI", "DIKEMBALIKAN"];

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

export default function SellerOrdersPage() {
  const [filter, setFilter] = useState("Semua");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<{ data: Order[] }>({
    queryKey: ["seller-orders-list"],
    queryFn: () => api.get("/orders/seller?page=1&limit=50").then((r) => r.data),
  });

  const orders = (data?.data || []).filter((o) => {
    if (filter !== "Semua" && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(o.id.includes(search) || o.buyer?.user.username.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pesanan Masuk</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola dan proses pesanan dari pembeli.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="Cari ID / username pembeli..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition ${
                  filter === f ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f === "Semua" ? "Semua" : STATUS_LABEL[f]?.label || f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <SkeletonOrderCard count={3} />
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <ClipboardList className="w-14 h-14 text-orange-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800">Belum ada pesanan masuk</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">{filter === "Semua" ? "Pesanan dari pembeli akan muncul di sini setelah checkout." : "Tidak ada pesanan untuk filter ini."}</p>
          {filter === "Semua" && (
            <Link href="/dashboard/seller/products" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
              Kelola Produk
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o, i) => {
            const status = STATUS_LABEL[o.status] || { label: o.status, color: "bg-gray-50 text-gray-600" };
            return (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5"
              >
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs text-gray-400 font-mono">#{o.id.slice(0, 8)}</p>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">Pembeli: {o.buyer?.user.username}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {o.items.length} item · {new Date(o.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-lg font-bold text-cyan-600">{formatPrice(Number(o.total))}</p>
                  </div>
                </div>
                <div className="flex justify-end pt-3 mt-3 border-t border-gray-100">
                  <Link
                    href={`/dashboard/seller/orders/${o.id}`}
                    aria-label={`Lihat detail pesanan ${o.id.slice(0, 8)}`}
                    title="Lihat detail"
                    className="font-semibold text-orange-500 hover:text-orange-600 inline-flex items-center justify-center gap-1 rounded-lg p-2 hover:bg-orange-50"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Lihat Detail</span>
                    <ChevronRight className="hidden sm:block w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
