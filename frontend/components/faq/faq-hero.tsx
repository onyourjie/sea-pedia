"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Waves } from "lucide-react";

export function FaqHero() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 86]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const imageRotate = useTransform(scrollYProgress, [0, 1], [0, -2]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 28]);

  return (
    <section ref={heroRef} className="bg-white border-b border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20 grid lg:grid-cols-[minmax(0,1fr)_560px] gap-8 lg:gap-12 items-center">
        <motion.div style={{ y: textY }}>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.45 }}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 mb-5"
            >
              <Waves className="w-3.5 h-3.5" />
              Pusat bantuan Seapedia
            </motion.div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
              Ada yang ingin ditanyakan?
            </h1>
            <p className="text-gray-500 mt-4 max-w-2xl leading-relaxed">
              Temukan jawaban cepat seputar belanja produk maritim, peran akun, wallet, toko, dan pengiriman di Seapedia.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-full bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 text-sm font-semibold transition shadow-lg shadow-cyan-500/20"
              >
                Lihat Produk
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white hover:border-cyan-200 hover:text-cyan-600 text-gray-700 px-5 py-2.5 text-sm font-semibold transition"
              >
                Masuk Dashboard
              </Link>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="relative mx-auto lg:mr-[-18px] w-full max-w-[680px] pt-4 lg:pt-0"
          style={{ y: imageY, scale: imageScale, rotate: imageRotate }}
        >
          <motion.div
            initial={{ opacity: 0, x: 42, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <Image
                src="/faq-remove%20bg.png"
                alt="Ilustrasi FAQ Seapedia"
                width={620}
                height={402}
                priority
                className="w-full h-auto object-contain drop-shadow-[0_26px_45px_rgba(8,145,178,0.16)]"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
