"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Store, Package, ClipboardList, BarChart2, User, LogOut, Waves,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

const NAV = [
  { href: "/dashboard/seller", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/seller/store", label: "Toko Saya", icon: Store },
  { href: "/dashboard/seller/products", label: "Produk", icon: Package },
  { href: "/dashboard/seller/orders", label: "Pesanan Masuk", icon: ClipboardList },
  { href: "/dashboard/seller/report", label: "Laporan", icon: BarChart2 },
  { href: "/dashboard/profile", label: "Profil", icon: User },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuthStore();

  useEffect(() => {
    if (!token || user?.activeRole !== "SELLER") {
      router.replace("/login");
    }
  }, [token, user, router]);

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-orange-500 font-bold text-lg">
            <Waves className="w-5 h-5" />
            Seapedia Seller
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{user?.username}</p>
              <p className="text-xs text-orange-500">Peran Aktif: Seller</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <button
              onClick={() => router.push("/login")}
              className="text-xs border border-orange-400 text-orange-600 px-3 py-1.5 rounded-full hover:bg-orange-50 transition font-medium"
            >
              Ganti Peran
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-6 gap-6">
        <aside className="w-48 shrink-0 hidden md:flex flex-col justify-between">
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
                        ? "bg-orange-50 text-orange-600 border border-orange-100"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-orange-500" : "text-gray-400"}`} />
                    {item.label}
                  </motion.div>
                </Link>
              );
            })}
          </nav>
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition mt-4"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <footer className="bg-white border-t border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5 text-orange-400" /> Seapedia Seller
          </div>
          <span>© 2026 Seapedia. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
