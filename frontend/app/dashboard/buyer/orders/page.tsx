"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Package, ChevronRight, Search, ShoppingBag } from "lucide-react";
import api from "@/lib/api";
import { SkeletonOrderCard } from "@/components/ui/skeleton";

interface Order {
  id: string;
  status: string;
  total: string;
  deliveryMethod: string;
  createdAt: string;
  store: { id: string; name: string };
  items: { id: string; name: string; quantity: number; price: string }[];
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  SEDANG_DIKEMAS: { label: "Sedang Dikemas", color: "bg-orange-50 text-orange-600" },
  MENUNGGU_PENGIRIM: { label: "Menunggu Pengirim", color: "bg-yellow-50 text-yellow-700" },
  SEDANG_DIKIRIM: { label: "Sedang Dikirim", color: "bg-blue-50 text-blue-600" },
  PESANAN_SELESAI: { label: "Pesanan Selesai", color: "bg-green-50 text-green-700" },
  DIKEMBALIKAN: { label: "Dikembalikan", color: "bg-red-50 text-red-600" },
};

const FILTERS = ["Semua", "SEDANG_DIKEMAS", "MENUNGGU_PENGIRIM", "SEDANG_DIKIRIM", "PESANAN_SELESAI", "DIKEMBALIKAN"];

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

export default function BuyerOrdersPage() {
  const [filter, setFilter] = useState("Semua");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<{ data: Order[]; total: number }>({
    queryKey: ["buyer-orders-all"],
    queryFn: () => api.get("/orders/buyer?page=1&limit=50").then((r) => r.data),
  });

  const orders = (data?.data || []).filter((o) => {
    if (filter !== "Semua" && o.status !== filter) return false;
    if (search && !o.store.name.toLowerCase().includes(search.toLowerCase()) && !o.id.includes(search)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pesanan Saya</h1>
        <p className="text-sm text-gray-500 mt-0.5">Pantau status semua pesananmu di sini.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="Cari nama toko / ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-cyan-400"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition ${
                  filter === f ? "bg-cyan-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f === "Semua" ? "Semua" : STATUS_LABEL[f]?.label || f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <SkeletonOrderCard count={4} />
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Package className="w-14 h-14 text-cyan-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800">Belum ada pesanan</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">Yuk mulai belanja produk laut segar dari para Seller di Seapedia.</p>
          <Link href="/products" className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
            <ShoppingBag className="w-4 h-4" /> Mulai Belanja
          </Link>
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
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs text-gray-400 font-mono">#{o.id.slice(0, 8)}</p>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{o.store.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {o.items.length} item · {new Date(o.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-lg font-bold text-cyan-600">{formatPrice(Number(o.total))}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Pengiriman: <strong>{o.deliveryMethod.replace("_", " ")}</strong></p>
                  <Link
                    href={`/dashboard/buyer/orders/${o.id}`}
                    className="text-xs font-semibold text-cyan-500 hover:text-cyan-600 flex items-center gap-1"
                  >
                    Lihat Detail <ChevronRight className="w-3.5 h-3.5" />
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
