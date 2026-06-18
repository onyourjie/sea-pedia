"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Package, CheckCircle, CreditCard, ArrowRight, ChevronRight, Star } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

interface Order {
  id: string;
  status: string;
  total: number;
  store?: { name: string };
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  SEDANG_DIKEMAS: { label: "Diproses", color: "text-orange-500 bg-orange-50" },
  MENUNGGU_PENGIRIM: { label: "Menunggu Driver", color: "text-yellow-600 bg-yellow-50" },
  SEDANG_DIKIRIM: { label: "Dikirim", color: "text-blue-500 bg-blue-50" },
  PESANAN_SELESAI: { label: "Selesai", color: "text-green-600 bg-green-50" },
  DIKEMBALIKAN: { label: "Dikembalikan", color: "text-red-500 bg-red-50" },
};

export default function BuyerDashboardPage() {
  const { user } = useAuthStore();

  const { data: walletData } = useQuery({
    queryKey: ["buyer-wallet"],
    queryFn: () => api.get("/wallet").then((r) => r.data),
  });

  const { data: ordersData } = useQuery({
    queryKey: ["buyer-orders"],
    queryFn: () => api.get("/orders/buyer?page=1&limit=4").then((r) => r.data),
  });

  const { data: productsData } = useQuery({
    queryKey: ["featured-products-dash"],
    queryFn: () => api.get("/products?limit=5").then((r) => r.data),
  });

  const { data: reportData } = useQuery({
    queryKey: ["buyer-report"],
    queryFn: () => api.get("/orders/buyer/report").then((r) => r.data),
  });

  const walletBalance = walletData?.data?.balance ?? 0;
  const orders: Order[] = ordersData?.data || [];
  const products: Product[] = productsData?.data || [];
  const report = reportData?.data;

  const stats = [
    {
      icon: Wallet,
      label: "Saldo Wallet",
      value: formatPrice(walletBalance),
      sub: "Saldo aktif tersedia untuk pembayaran",
      action: { label: "Top Up", href: "/dashboard/buyer/wallet" },
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-600",
    },
    {
      icon: Package,
      label: "Pesanan Aktif",
      value: `${orders.filter((o) => o.status !== "PESANAN_SELESAI" && o.status !== "DIKEMBALIKAN").length} Pesanan`,
      sub: "Sedang diproses",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: CheckCircle,
      label: "Selesai Bulan Ini",
      value: `${report?.completedThisMonth ?? 0} Transaksi`,
      sub: "Periode bulan ini",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: CreditCard,
      label: "Total Belanja",
      value: formatPrice(report?.totalSpent ?? 0),
      sub: "Semua waktu",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Halo, {user?.username}! 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">Pantau pesanan dan atur belanjamu dengan mudah hari ini.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
                </div>
                {stat.action && (
                  <Link
                    href={stat.action.href}
                    className="text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1 rounded-full transition"
                  >
                    {stat.action.label}
                  </Link>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-gray-800 leading-tight">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Pesanan Terbaru</h2>
            <Link href="/dashboard/buyer/orders" className="text-xs text-cyan-500 hover:text-cyan-600 flex items-center gap-1 font-medium">
              Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {orders.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Belum ada pesanan</p>
            )}
            {orders.map((order) => {
              const status = STATUS_LABEL[order.status] || { label: order.status, color: "text-gray-500 bg-gray-50" };
              return (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Package className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{order.store?.name || "Toko"}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} · {formatPrice(order.total)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>{status.label}</span>
                    <Link href={`/dashboard/buyer/orders/${order.id}`} className="text-xs text-cyan-500 hover:text-cyan-600 font-medium flex items-center gap-0.5">
                      Lihat Detail <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Promo banner */}
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl p-5 text-white flex flex-col justify-between shadow-lg shadow-cyan-500/20">
          <div>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-lg leading-snug mb-2">Dapatkan Cashback s/d 50rb!</h3>
            <p className="text-xs text-cyan-100 leading-relaxed">
              Gunakan kode promo <span className="font-bold text-white">SEAOCT24</span> untuk setiap transaksi menggunakan Seapedia Wallet.
            </p>
          </div>
          <button className="mt-4 w-full bg-white text-cyan-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-cyan-50 transition">
            Klaim Voucher Sekarang
          </button>
        </div>
      </div>

      {/* Recommended products */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">Rekomendasi Produk untuk Anda</h2>
          <div className="flex gap-1">
            <button className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition text-gray-400">‹</button>
            <button className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition text-gray-400">›</button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -2 }}
            >
              <Link href={`/products/${product.id}`} className="block group">
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-2">
                  <img
                    src={product.imageUrl || "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&q=80"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <p className="text-xs text-gray-700 font-medium line-clamp-2 leading-snug mb-1">{product.name}</p>
                <p className="text-sm font-bold text-cyan-600">{formatPrice(product.price)}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-[10px] text-gray-400">4.9</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
