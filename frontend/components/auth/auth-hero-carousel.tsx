"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
  {
    src: "/sign%20in%20sign%20up%201.png",
    title: "Selamat Datang di SEAPEDIA",
    description: "Temukan hasil laut segar dari penjual terpercaya setiap hari.",
  },
  {
    src: "/sign%20in%20sign%20up%202.png",
    title: "Pengiriman Tetap Segar",
    description: "Pesanan dijaga dingin dan siap sampai ke tangan pembeli.",
  },
  {
    src: "/sign%20in%20sign%20up%203.png",
    title: "Langsung dari Laut ke Anda",
    description: "Rantai pasok maritim yang cepat, rapi, dan mudah dipantau.",
  },
  {
    src: "/sign%20in%20sign%20up%204.png",
    title: "Belanja Seafood Lebih Mudah",
    description: "Satu akun untuk membeli, menjual, dan mengantar produk laut.",
  },
];

export function AuthHeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrent((value) => (value + 1) % SLIDES.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

  const previousSlide = () => {
    setCurrent((value) => (value - 1 + SLIDES.length) % SLIDES.length);
  };

  const nextSlide = () => {
    setCurrent((value) => (value + 1) % SLIDES.length);
  };

  const slide = SLIDES[current];

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-950"
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={slide.src}
          src={slide.src}
          alt={slide.title}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/15 to-black/55" />
      <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/65 to-transparent" />

      <div className="relative z-10 flex h-full w-full flex-col justify-between px-12 py-12">
        <div className="max-w-md pt-8">
          <motion.p
            key={`eyebrow-${current}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-white/80"
          >
            SEAPEDIA
          </motion.p>
          <motion.h2
            key={`title-${current}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-4xl font-bold leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
          >
            {slide.title}
          </motion.h2>
          <motion.p
            key={`desc-${current}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mt-4 max-w-sm text-base leading-relaxed text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]"
          >
            {slide.description}
          </motion.p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {SLIDES.map((item, index) => (
              <button
                key={item.src}
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`Tampilkan slide ${index + 1}`}
                className={`h-2 rounded-full transition-all ${
                  current === index ? "w-8 bg-white" : "w-2 bg-white/45 hover:bg-white/70"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={previousSlide}
              aria-label="Gambar sebelumnya"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/25 text-white backdrop-blur-md transition hover:bg-white hover:text-gray-900"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Gambar berikutnya"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/25 text-white backdrop-blur-md transition hover:bg-white hover:text-gray-900"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
