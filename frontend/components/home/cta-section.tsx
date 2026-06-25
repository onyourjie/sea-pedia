"use client";

import { motion } from "framer-motion";
import Image from "next/image";
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
        <Image
          src="/waves.svg"
          alt=""
          width={280}
          height={280}
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 top-1/2 w-56 -translate-y-1/2 scale-[2.2] opacity-20 brightness-0 invert md:right-5 md:w-64"
        />
        <Image
          src="/waves.svg"
          alt=""
          width={240}
          height={240}
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 -left-8 w-48 scale-[2] opacity-15 brightness-0 invert md:left-5 md:w-56"
        />

        <div className="relative">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Siap Mengembangkan Bisnis Maritim Anda?
          </h2>
          <p className="text-cyan-50 mb-8 max-w-lg mx-auto text-sm leading-relaxed">
            Daftar gratis, buat toko dengan nama unik, dan mulai jualan ke pembeli di seluruh Indonesia.
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
