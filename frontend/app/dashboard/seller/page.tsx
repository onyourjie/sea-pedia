"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Package, ClipboardList, DollarSign, TrendingUp, Plus, ChevronRight, Store } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

interface OrderSummary {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  buyer?: { user: { username: string } };
}

interface MyStore {
  id: string;
  name: string;
  description?: string;
  _count: { products: number; orders: number };
}

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  SEDANG_DIKEMAS: { label: "Perlu Diproses", color: "bg-orange-50 text-orange-600" },
  MENUNGGU_PENGIRIM: { label: "Menunggu Driver", color: "bg-yellow-50 text-yellow-700" },
  SEDANG_DIKIRIM: { label: "Dikirim", color: "bg-blue-50 text-blue-600" },
  PESANAN_SELESAI: { label: "Selesai", color: "bg-green-50 text-green-700" },
  DIKEMBALIKAN: { label: "Dikembalikan", color: "bg-red-50 text-red-600" },
};

export default function SellerDashboardPage() {
  const { user } = useAuthStore();

  const { data: store } = useQuery<MyStore>({
    queryKey: ["seller-my-store"],
    queryFn: () => api.get("/stores/seller/my-store").then((r) => r.data),
    retry: false,
  });

  const { data: ordersData } = useQuery<{ data: OrderSummary[]; total: number }>({
    queryKey: ["seller-orders-recent"],
    queryFn: () => api.get("/orders/seller?page=1&limit=5").then((r) => r.data),
    enabled: !!store,
  });

  const { data: report } = useQuery<{ totalOrders: number; totalIncome: number }>({
    queryKey: ["seller-report"],
    queryFn: () => api.get("/orders/seller/report").then((r) => r.data),
    enabled: !!store,
  });

  const orders = ordersData?.data || [];
  const pendingOrders = orders.filter((o) => o.status === "SEDANG_DIKEMAS").length;

  if (!store) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-700">Toko belum dibuat</h3>
        <p className="text-sm text-gray-400 mt-1">Buat toko untuk mulai jualan di Seapedia.</p>
        <Link
          href="/dashboard/seller/store"
          className="inline-block mt-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
        >
          Buat Toko Sekarang
        </Link>
      </div>
    );
  }

  const stats = [
    { icon: Package, label: "Total Produk", value: `${store._count.products}`, sub: "produk aktif", iconBg: "bg-cyan-100", iconColor: "text-cyan-600", href: "/dashboard/seller/products" },
    { icon: ClipboardList, label: "Pesanan Perlu Diproses", value: `${pendingOrders}`, sub: "menunggu Anda", iconBg: "bg-orange-100", iconColor: "text-orange-600", href: "/dashboard/seller/orders" },
    { icon: DollarSign, label: "Total Pendapatan", value: formatPrice(report?.totalIncome ?? 0), sub: "dari pesanan selesai", iconBg: "bg-green-100", iconColor: "text-green-600" },
    { icon: TrendingUp, label: "Pesanan Selesai", value: `${report?.totalOrders ?? 0}`, sub: "transaksi sukses", iconBg: "bg-purple-100", iconColor: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Halo, {user?.username}!</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola toko <strong>{store.name}</strong> dan pantau pesananmu di sini.</p>
        </div>
        <Link
          href="/dashboard/seller/products"
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Tambah Produk
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const card = (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
            >
              <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-gray-800 leading-tight">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
            </motion.div>
          );
          return stat.href ? <Link key={stat.label} href={stat.href}>{card}</Link> : card;
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">Pesanan Terbaru</h2>
          <Link href="/dashboard/seller/orders" className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1 font-medium">
            Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400 mb-2">Belum ada pesanan masuk</p>
            <Link href="/dashboard/seller/products" className="text-xs text-orange-500 hover:text-orange-600 font-semibold">
              Kelola produk →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const status = STATUS_LABEL[o.status] || { label: o.status, color: "bg-gray-50 text-gray-600" };
              return (
                <Link
                  key={o.id}
                  href={`/dashboard/seller/orders/${o.id}`}
                  className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition"
                >
                  <div>
                    <p className="text-xs text-gray-400 font-mono">#{o.id.slice(0, 8)}</p>
                    <p className="text-sm font-medium text-gray-800">{o.buyer?.user.username}</p>
                    <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString("id-ID")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>{status.label}</span>
                    <p className="text-sm font-bold text-gray-800">{formatPrice(Number(o.total))}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
