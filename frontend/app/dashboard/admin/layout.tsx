"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, Store as StoreIcon, Package, ClipboardList, Truck, Tag, Gift, AlertTriangle, LogOut, Waves,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

const NAV = [
  { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/admin/users", label: "Pengguna", icon: Users },
  { href: "/dashboard/admin/stores", label: "Toko", icon: StoreIcon },
  { href: "/dashboard/admin/products", label: "Produk", icon: Package },
  { href: "/dashboard/admin/orders", label: "Pesanan", icon: ClipboardList },
  { href: "/dashboard/admin/deliveries", label: "Pengiriman", icon: Truck },
  { href: "/dashboard/admin/vouchers", label: "Voucher", icon: Tag },
  { href: "/dashboard/admin/promos", label: "Promo", icon: Gift },
  { href: "/dashboard/admin/overdue", label: "Overdue", icon: AlertTriangle },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token || user?.activeRole !== "ADMIN") {
      router.replace("/login");
    }
  }, [hasHydrated, token, user, router]);

  if (!hasHydrated) return null;
  if (!token) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-purple-600 font-bold text-lg">
            <Waves className="w-5 h-5" />
            Seapedia Admin
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{user?.username}</p>
              <p className="text-xs text-purple-600">Peran Aktif: Admin</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <button
              onClick={() => router.push("/login")}
              className="text-xs border border-purple-400 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-50 transition font-medium"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-6 gap-6">
        <aside className="w-52 shrink-0 hidden md:flex flex-col justify-between">
          <nav className="space-y-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ x: 2 }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      active
                        ? "bg-purple-50 text-purple-700 border border-purple-100"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-purple-600" : "text-gray-400"}`} />
                    {item.label}
                  </motion.div>
                </Link>
              );
            })}
          </nav>
          <button
            onClick={async () => { await logout(); router.push("/login"); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition mt-4"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
