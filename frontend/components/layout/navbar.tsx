"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { ShoppingCart, Search, Menu, X, Waves, Heart, Flame, Tag, Box, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

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

export function Navbar() {
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [favoriteCount, setFavoriteCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const dashboardHref = user?.activeRole ? (ROLE_DASHBOARD[user.activeRole] || "/dashboard") : "/dashboard";
  const showSearch = pathname !== "/products";

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchVal.trim())}`);
    } else {
      router.push("/products");
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      {/* Main navbar row */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-cyan-500 shrink-0">
          <Waves className="w-6 h-6" />
          <span>SEAPEDIA</span>
        </Link>

        {/* Search */}
        {showSearch && (
          <form onSubmit={handleSearch} className="flex-1 hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2 gap-2 max-w-xl hover:border-cyan-300 transition">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="bg-transparent text-sm flex-1 outline-none placeholder:text-gray-400"
              placeholder="Cari produk kelautan, ikan segar, alat selam..."
            />
          </form>
        )}

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
              {/* Dashboard */}
              <Link
                href={dashboardHref}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 text-cyan-700 text-sm font-medium hover:bg-cyan-100 transition"
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                {user.username}
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
          <Link href="/products" className="text-xs font-medium text-gray-600 hover:text-cyan-600 flex items-center gap-1.5 transition">
            Semua Produk
          </Link>
          <Link href="/products?sort=newest" className="text-xs font-medium text-gray-600 hover:text-cyan-600 flex items-center gap-1.5 transition">
            <Box className="w-3.5 h-3.5 text-cyan-500" /> Produk Baru
          </Link>
          <Link href="/products?promo=1" className="text-xs font-medium text-gray-600 hover:text-orange-500 flex items-center gap-1.5 transition">
            <Flame className="w-3.5 h-3.5 text-orange-500" /> Hot Deals
          </Link>
          <Link href="/products?promo=1" className="text-xs font-medium text-gray-600 hover:text-green-600 flex items-center gap-1.5 transition">
            <Tag className="w-3.5 h-3.5 text-green-500" /> Promo
          </Link>
          <Link href="/faq" className="text-xs font-medium text-gray-600 hover:text-cyan-600 flex items-center gap-1.5 transition">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-500" /> FAQ
          </Link>
          <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            Layanan 24/7 tersedia
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
            {showSearch && (
              <form onSubmit={handleSearch} className="flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2 gap-2 mt-3">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="bg-transparent text-sm flex-1 outline-none placeholder:text-gray-400"
                  placeholder="Cari produk..."
                />
              </form>
            )}
            <div className="flex gap-3 py-2 border-b border-gray-100">
              <Link href="/products?sort=newest" className="text-xs text-gray-600 flex items-center gap-1"><Box className="w-3 h-3 text-cyan-500" /> Baru</Link>
              <Link href="/products?promo=1" className="text-xs text-gray-600 flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" /> Hot Deals</Link>
              <Link href="/products?promo=1" className="text-xs text-gray-600 flex items-center gap-1"><Tag className="w-3 h-3 text-green-500" /> Promo</Link>
              <Link href="/faq" className="text-xs text-gray-600 flex items-center gap-1"><HelpCircle className="w-3 h-3 text-cyan-500" /> FAQ</Link>
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
