"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { ShoppingCart, Search, Menu, X, Waves } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-cyan-500 shrink-0">
          <Waves className="w-6 h-6" />
          <span>SEAPEDIA</span>
        </Link>

        {/* Search */}
        <div className="flex-1 hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2 gap-2 max-w-xl">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            className="bg-transparent text-sm flex-1 outline-none placeholder:text-gray-400"
            placeholder="Cari produk kelautan, ikan segar, alat selam..."
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {user ? (
            <>
              <Link href="/cart" className="p-2 hover:bg-gray-100 rounded-full relative">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
              </Link>
              <Link href="/dashboard" className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 text-cyan-700 text-sm font-medium hover:bg-cyan-100 transition">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                {user.username}
              </Link>
              <button
                onClick={logout}
                className="hidden md:block text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5"
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

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 flex flex-col gap-2"
          >
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2 gap-2 mt-3">
              <Search className="w-4 h-4 text-gray-400" />
              <input className="bg-transparent text-sm flex-1 outline-none placeholder:text-gray-400" placeholder="Cari produk..." />
            </div>
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium py-2">Dashboard</Link>
                <button onClick={logout} className="text-sm text-left text-red-500 py-2">Keluar</button>
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
