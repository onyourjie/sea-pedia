"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Truck, Briefcase, History, User, LogOut, Waves,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

const NAV = [
  { href: "/dashboard/driver", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/driver/jobs", label: "Cari Job", icon: Briefcase },
  { href: "/dashboard/driver/active", label: "Job Aktif", icon: Truck },
  { href: "/dashboard/driver/history", label: "Riwayat", icon: History },
  { href: "/dashboard/profile", label: "Profil", icon: User },
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuthStore();

  useEffect(() => {
    if (!token || user?.activeRole !== "DRIVER") {
      router.replace("/login");
    }
  }, [token, user, router]);

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-green-600 font-bold text-lg">
            <Waves className="w-5 h-5" />
            Seapedia Driver
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{user?.username}</p>
              <p className="text-xs text-green-600">Peran Aktif: Driver</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <button
              onClick={() => router.push("/login")}
              className="text-xs border border-green-400 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-50 transition font-medium"
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
                        ? "bg-green-50 text-green-700 border border-green-100"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-green-600" : "text-gray-400"}`} />
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
            <Waves className="w-3.5 h-3.5 text-green-500" /> Seapedia Driver
          </div>
          <span>© 2026 Seapedia. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
