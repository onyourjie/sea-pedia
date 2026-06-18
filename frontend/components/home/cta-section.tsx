"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function CtaSection() {
  return (
    <section className="mx-4 md:mx-auto max-w-7xl mb-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden"
      >
        {/* decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-white/10" />

        <div className="relative">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Siap Mengembangkan Bisnis Maritim Anda?
          </h2>
          <p className="text-cyan-50 mb-8 max-w-lg mx-auto text-sm leading-relaxed">
            Bergabunglah dengan ribuan seller lainnya dan mulai jangkau pembeli dari Sabang sampai Merauke hanya dengan beberapa klik.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="bg-white text-cyan-600 hover:bg-cyan-50 font-semibold px-8 py-3 rounded-full transition shadow-lg"
            >
              Daftar Jadi Seller Sekarang
            </Link>
            <Link
              href="/products"
              className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-3 rounded-full transition"
            >
              Pelajari Lebih Lanjut
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
