"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { ShoppingCart, Menu, X, Waves, Heart, Flame, Tag, Box, HelpCircle, Mail, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { DiceBearAvatar } from "@/components/ui/dicebear-avatar";

const FAVORITES_KEY = "seapedia_favorites";
const FAVORITES_CHANGED_EVENT = "seapedia:favorites-changed";

interface CartSummary {
  items: Array<{ quantity: number }>;
}

function getFavoriteCount() {
  if (typeof window === "undefined") return 0;
  try {
    const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return Array.isArray(favorites) ? new Set(favorites).size : 0;
  } catch {
    return 0;
  }
}

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

const ROLE_DASHBOARD: Record<string, string> = {
  BUYER: "/dashboard/buyer",
  SELLER: "/dashboard/seller",
  DRIVER: "/dashboard/driver",
  ADMIN: "/dashboard/admin",
};

const ROLE_BADGE: Record<string, { label: string; className: string; dot: string }> = {
  BUYER: { label: "Buyer", className: "bg-cyan-50 text-cyan-700 ring-cyan-200", dot: "bg-cyan-500" },
  SELLER: { label: "Seller", className: "bg-orange-50 text-orange-700 ring-orange-200", dot: "bg-orange-500" },
  DRIVER: { label: "Driver", className: "bg-green-50 text-green-700 ring-green-200", dot: "bg-green-500" },
  ADMIN: { label: "Admin", className: "bg-purple-50 text-purple-700 ring-purple-200", dot: "bg-purple-500" },
};

export function Navbar() {
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const router = useRouter();

  const dashboardHref = user?.activeRole ? (ROLE_DASHBOARD[user.activeRole] || "/dashboard") : "/dashboard";

  const { data: cart } = useQuery<CartSummary>({
    queryKey: ["cart"],
    queryFn: () => api.get("/cart").then((r) => r.data),
    enabled: user?.activeRole === "BUYER",
  });

  const cartCount = user?.activeRole === "BUYER"
    ? cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0
    : 0;

  useEffect(() => {
    const updateFavoriteCount = () => setFavoriteCount(getFavoriteCount());

    updateFavoriteCount();
    window.addEventListener("storage", updateFavoriteCount);
    window.addEventListener(FAVORITES_CHANGED_EVENT, updateFavoriteCount);

    return () => {
      window.removeEventListener("storage", updateFavoriteCount);
      window.removeEventListener(FAVORITES_CHANGED_EVENT, updateFavoriteCount);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      {/* Main navbar row */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-cyan-500 shrink-0">
          <Waves className="w-6 h-6" />
          <span>SEAPEDIA</span>
        </Link>

        <div className="flex items-center gap-1 ml-auto">
          {user ? (
            <>
              {/* Wishlist */}
              <Link href="/products/wishlist" aria-label={`Favorit, ${favoriteCount} produk`} className="p-2 hover:bg-gray-100 rounded-full transition relative group">
                <Heart className="w-5 h-5 text-gray-500 group-hover:text-red-500 transition" />
                <CountBadge count={favoriteCount} />
              </Link>
              {/* Cart */}
              <Link href="/dashboard/buyer/cart" aria-label={`Keranjang, ${cartCount} barang`} className="p-2 hover:bg-gray-100 rounded-full transition relative">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                <CountBadge count={cartCount} />
              </Link>
              {/* Active role badge */}
              {user.activeRole && ROLE_BADGE[user.activeRole] && (
                <Link
                  href="/dashboard/profile"
                  aria-label={`Peran aktif: ${ROLE_BADGE[user.activeRole].label}. Klik untuk ganti peran.`}
                  title="Klik untuk ganti peran aktif"
                  className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ml-1 ${ROLE_BADGE[user.activeRole].className} hover:opacity-80 transition`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${ROLE_BADGE[user.activeRole].dot}`} />
                  {ROLE_BADGE[user.activeRole].label}
                </Link>
              )}
              {/* Dashboard */}
              <Link
                href={dashboardHref}
                aria-label={`Buka profil ${user.username}`}
                title={user.username}
                className="hidden md:flex items-center rounded-full p-1 hover:bg-cyan-50 transition"
              >
                <DiceBearAvatar seed={user.username} className="h-9 w-9 ring-2 ring-cyan-100" />
              </Link>
              <button
                onClick={async () => { await logout(); router.push("/"); }}
                className="hidden md:block text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5 transition"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden md:block text-sm font-medium text-gray-700 hover:text-cyan-600 px-3 py-1.5 transition">
                Masuk
              </Link>
              <Link href="/register" className="hidden md:block text-sm font-semibold bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-full transition">
                Daftar
              </Link>
            </>
          )}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Secondary nav row */}
      <div className="hidden md:block border-t border-gray-50 bg-white">
        <div className="max-w-7xl mx-auto px-4 h-10 flex items-center gap-6">
          <Link href="/products" className="text-xs font-medium text-gray-600 hover:text-indigo-600 flex items-center gap-1.5 transition">
            <Store className="w-3.5 h-3.5 text-indigo-500" /> Semua Produk
          </Link>
          <Link href="/products?sort=newest" className="text-xs font-medium text-gray-600 hover:text-blue-600 flex items-center gap-1.5 transition">
            <Box className="w-3.5 h-3.5 text-blue-500" /> Produk Baru
          </Link>
          <Link href="/products?deals=1" className="text-xs font-medium text-gray-600 hover:text-orange-500 flex items-center gap-1.5 transition">
            <Flame className="w-3.5 h-3.5 text-orange-500" /> Hot Deals
          </Link>
          <Link href="/products?promo=1" className="text-xs font-medium text-gray-600 hover:text-emerald-600 flex items-center gap-1.5 transition">
            <Tag className="w-3.5 h-3.5 text-emerald-500" /> Voucher & Promo
          </Link>
          <Link href="/faq" className="text-xs font-medium text-gray-600 hover:text-violet-600 flex items-center gap-1.5 transition">
            <HelpCircle className="w-3.5 h-3.5 text-violet-500" /> FAQ
          </Link>
          <Link href="/contact" className="text-xs font-medium text-gray-600 hover:text-rose-600 flex items-center gap-1.5 transition">
            <Mail className="w-3.5 h-3.5 text-rose-500" /> Contact Us
          </Link>
          <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            Marketplace aktif
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 flex flex-col gap-2"
          >
            <div className="flex flex-wrap gap-x-3 gap-y-2 py-2 border-b border-gray-100">
              <Link href="/products?sort=newest" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"><Box className="w-3 h-3 text-blue-500" /> Baru</Link>
              <Link href="/products?deals=1" className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 transition"><Flame className="w-3 h-3 text-orange-500" /> Hot Deals</Link>
              <Link href="/products?promo=1" className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition"><Tag className="w-3 h-3 text-emerald-500" /> Voucher & Promo</Link>
              <Link href="/faq" className="text-xs font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1 transition"><HelpCircle className="w-3 h-3 text-violet-500" /> FAQ</Link>
              <Link href="/contact" className="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 transition"><Mail className="w-3 h-3 text-rose-500" /> Contact Us</Link>
            </div>
            {user ? (
              <>
                <Link href={dashboardHref} className="text-sm font-medium py-2">Dashboard ({user.activeRole})</Link>
                <Link href="/products/wishlist" className="text-sm py-2">Favorit ({favoriteCount})</Link>
                <Link href="/dashboard/buyer/cart" className="text-sm py-2">Keranjang ({cartCount})</Link>
                <button onClick={async () => { await logout(); router.push("/"); }} className="text-sm text-left text-red-500 py-2">Keluar</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium py-2">Masuk</Link>
                <Link href="/register" className="text-sm font-semibold text-cyan-600 py-2">Daftar</Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
