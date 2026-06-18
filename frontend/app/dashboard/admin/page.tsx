"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users, Store, Package, ClipboardList, Tag, Gift, Truck, AlertTriangle, Calendar, FastForward } from "lucide-react";
import api from "@/lib/api";

interface OrderGroup {
  status: string;
  _count: number;
}

interface DashboardData {
  users: number;
  stores: number;
  products: number;
  orders: OrderGroup[];
  vouchers: number;
  promos: number;
  deliveries: number;
  overdueOrders: number;
}

interface SystemDate {
  currentDate: string;
}

export default function AdminDashboardPage() {
  const { data } = useQuery<DashboardData>({
    queryKey: ["admin-dashboard"],
    queryFn: () => api.get("/admin/dashboard").then((r) => r.data),
  });

  const { data: sys } = useQuery<SystemDate>({
    queryKey: ["admin-system-date"],
    queryFn: () => api.get("/admin/system-date").then((r) => r.data),
  });

  const totalOrders = data?.orders.reduce((s, o) => s + o._count, 0) ?? 0;

  const stats = [
    { icon: Users, label: "Pengguna", value: data?.users ?? 0, href: "/dashboard/admin/users", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
    { icon: Store, label: "Toko", value: data?.stores ?? 0, href: "/dashboard/admin/stores", iconBg: "bg-orange-100", iconColor: "text-orange-600" },
    { icon: Package, label: "Produk Aktif", value: data?.products ?? 0, href: "/dashboard/admin/products", iconBg: "bg-cyan-100", iconColor: "text-cyan-600" },
    { icon: ClipboardList, label: "Pesanan", value: totalOrders, href: "/dashboard/admin/orders", iconBg: "bg-purple-100", iconColor: "text-purple-600" },
    { icon: Truck, label: "Pengiriman", value: data?.deliveries ?? 0, href: "/dashboard/admin/deliveries", iconBg: "bg-green-100", iconColor: "text-green-600" },
    { icon: Tag, label: "Voucher", value: data?.vouchers ?? 0, href: "/dashboard/admin/vouchers", iconBg: "bg-pink-100", iconColor: "text-pink-600" },
    { icon: Gift, label: "Promo", value: data?.promos ?? 0, href: "/dashboard/admin/promos", iconBg: "bg-yellow-100", iconColor: "text-yellow-600" },
    { icon: AlertTriangle, label: "Overdue", value: data?.overdueOrders ?? 0, href: "/dashboard/admin/overdue", iconBg: "bg-red-100", iconColor: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Pantau seluruh aktivitas marketplace dari satu tempat.</p>
      </div>

      <div className="bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4" />
              <p className="text-xs text-purple-100">Tanggal Sistem (untuk SLA & overdue)</p>
            </div>
            <p className="text-2xl font-bold">
              {sys?.currentDate
                ? new Date(sys.currentDate).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                : "Memuat..."}
            </p>
          </div>
          <Link
            href="/dashboard/admin/overdue"
            className="bg-white text-purple-600 text-xs font-semibold px-4 py-2.5 rounded-full hover:bg-purple-50 transition flex items-center gap-2"
          >
            <FastForward className="w-3.5 h-3.5" /> Kelola Overdue & Time
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -2 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:shadow-md transition"
              >
                <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${s.iconColor}`} />
                </div>
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-gray-800 leading-tight">{s.value}</p>
              </motion.div>
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-4">Distribusi Status Pesanan</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {data?.orders.map((og) => (
            <div key={og.status} className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500">{og.status.replace(/_/g, " ")}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{og._count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
