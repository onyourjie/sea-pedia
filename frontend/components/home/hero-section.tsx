"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ShoppingBag, Store } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 min-h-[580px] flex items-center">
      {/* Animated background waves */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-8 left-0 right-0 h-32 bg-gradient-to-t from-cyan-500/10 to-transparent" />
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-cyan-400/10"
            style={{
              width: `${400 + i * 200}px`,
              height: `${400 + i * 200}px`,
              right: `-${100 + i * 50}px`,
              top: `${-100 + i * 30}px`,
            }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 1.2 }}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-block text-xs font-semibold tracking-widest text-cyan-400 uppercase mb-4 border border-cyan-400/30 rounded-full px-3 py-1">
            #1 Maritime Ecosystem
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Belanja, Jual, dan{" "}
            <br />
            Kirim dalam{" "}
            <span className="text-cyan-400">Satu</span>
            <br />
            Marketplace
          </h1>
          <p className="text-gray-300 text-base mb-8 leading-relaxed max-w-md">
            Platform maritim terpadu untuk kebutuhan nelayan, pengusaha laut, dan hobis di seluruh Nusantara.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/products"
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-6 py-3 rounded-full transition shadow-lg shadow-cyan-500/30"
            >
              <ShoppingBag className="w-4 h-4" />
              Mulai Belanja
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-2 border border-white/30 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-full transition"
            >
              <Store className="w-4 h-4" />
              Jadi Seller
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-10">
            {[
              { value: "50K+", label: "Produk" },
              { value: "12K+", label: "Seller" },
              { value: "4.9", label: "Rating" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Hero image card */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="hidden md:flex justify-center"
        >
          <div className="relative">
            <div className="w-80 h-72 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <img
                src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80"
                alt="Maritime products"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating card */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -bottom-4 -left-8 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-lg">🚢</div>
              <div>
                <div className="text-xs font-semibold text-gray-800">Pesanan Terkirim!</div>
                <div className="text-[10px] text-gray-400">Logistik kapal express</div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
