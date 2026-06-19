"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ShoppingCart, Package, Wallet, MapPin, BarChart2, User, LogOut, Waves, Menu, X,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

const NAV = [
  { href: "/dashboard/buyer", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/buyer/cart", label: "Keranjang", icon: ShoppingCart },
  { href: "/dashboard/buyer/orders", label: "Pesanan Saya", icon: Package },
  { href: "/dashboard/buyer/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/buyer/addresses", label: "Alamat", icon: MapPin },
  { href: "/dashboard/buyer/report", label: "Laporan", icon: BarChart2 },
  { href: "/dashboard/buyer/profile", label: "Profil", icon: User },
];

function SidebarContent({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  const { logout } = useAuthStore();
  const router = useRouter();
  return (
    <div className="flex flex-col h-full justify-between">
      <nav className="space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active ? "bg-cyan-50 text-cyan-600 border border-cyan-100" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-cyan-500" : "text-gray-400"}`} />
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
        <LogOut className="w-4 h-4" /> Keluar
      </button>
    </div>
  );
}

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, hasHydrated } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token || user?.activeRole !== "BUYER") router.replace("/login");
  }, [hasHydrated, token, user, router]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (!hasHydrated) return null;
  if (!token) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <Link href="/" className="flex items-center gap-1.5 text-cyan-500 font-bold text-lg">
              <Waves className="w-5 h-5" /> Seapedia Buyer
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">{user?.username}</p>
              <p className="text-xs text-cyan-500">Peran Aktif: Buyer</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <button
              onClick={() => router.push("/login")}
              className="text-xs border border-cyan-400 text-cyan-600 px-3 py-1.5 rounded-full hover:bg-cyan-50 transition font-medium"
            >
              Ganti Peran
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 shadow-xl md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100">
                <Link href="/" className="flex items-center gap-1.5 text-cyan-500 font-bold">
                  <Waves className="w-4 h-4" /> Seapedia Buyer
                </Link>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <SidebarContent pathname={pathname} onClose={() => setMobileOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-6 gap-6">
        <aside className="w-48 shrink-0 hidden md:flex flex-col justify-between">
          <SidebarContent pathname={pathname} />
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <footer className="bg-white border-t border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5 text-cyan-400" /> Seapedia Buyer
          </div>
          <span>© 2026 Seapedia. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-cyan-500">Bantuan</a>
            <a href="#" className="hover:text-cyan-500">Syarat &amp; Ketentuan</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
