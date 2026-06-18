"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Icon } from "@iconify/react";

const CATEGORIES = [
  { icon: "mdi:fish", label: "Ikan Segar" },
  { icon: "mdi:sail-boat", label: "Kapal & Boat" },
  { icon: "mdi:fishing", label: "Alat Pancing" },
  { icon: "mdi:wrench", label: "Suku Cadang" },
  { icon: "mdi:package-variant", label: "Logistik" },
  { icon: "mdi:compass", label: "Navigasi" },
  { icon: "mdi:shield-check", label: "Keselamatan" },
  { icon: "mdi:diving-scuba-mask", label: "Jasa Selam" },
];

export function CategorySection() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-800">Kategori Populer</h2>
        <Link href="/products" className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium">
          Lihat Semua <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
          >
            <Link href="/products" className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-cyan-50 transition cursor-pointer group">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 group-hover:bg-cyan-100 flex items-center justify-center transition shadow-sm">
                <Icon icon={cat.icon} className="w-6 h-6 text-cyan-600 group-hover:text-cyan-700" />
              </div>
              <span className="text-xs text-gray-600 text-center font-medium leading-tight">{cat.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
