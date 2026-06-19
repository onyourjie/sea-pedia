"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Tag, Flame, Box, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface Promo {
  id: string;
  code: string;
  description?: string;
  discountType?: string;
  discountValue?: number;
  expiresAt?: string;
}

const STATIC_CARDS = [
  {
    icon: Flame,
    tag: "Hot Deals",
    title: "Diskon s/d 50%",
    desc: "Produk pilihan dengan harga terbaik hari ini",
    cta: "Lihat Deal",
    href: "/products?promo=1",
    gradient: "from-orange-500 to-red-500",
    bg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
  {
    icon: Box,
    tag: "Produk Baru",
    title: "Baru Masuk Minggu Ini",
    desc: "Temukan produk kelautan terbaru dari seller terpercaya",
    cta: "Lihat Baru",
    href: "/products?sort=newest",
    gradient: "from-purple-500 to-violet-500",
    bg: "bg-purple-50",
    iconColor: "text-purple-500",
  },
];

export function PromoSection() {
  const { data } = useQuery({
    queryKey: ["active-promos"],
    queryFn: () => api.get("/promos?limit=1").then((r: { data: { data?: Promo[]; promos?: Promo[] } }) => r.data),
  });

  const promos: Promo[] = (data as { data?: Promo[]; promos?: Promo[] })?.data || (data as { data?: Promo[]; promos?: Promo[] })?.promos || [];
  const firstPromo = promos[0];

  const promoCard = {
    icon: Tag,
    tag: "Kode Promo",
    title: firstPromo ? firstPromo.code : "SAVE10 & PROMO20",
    desc: firstPromo?.description || "Gunakan kode voucher saat checkout untuk hemat lebih banyak",
    cta: "Belanja Sekarang",
    href: "/products",
    gradient: "from-cyan-500 to-teal-500",
    bg: "bg-cyan-50",
    iconColor: "text-cyan-500",
  };

  const cards = [STATIC_CARDS[0], promoCard, STATIC_CARDS[1]];

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-3 gap-4">
        {cards.map((p, i) => {
          const Icon = p.icon;
          return (
            <motion.div
              key={p.tag}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -3 }}
              className={`${p.bg} rounded-2xl p-5 border border-white shadow-sm hover:shadow-md transition`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-white ${p.iconColor}`}>
                  {p.tag}
                </span>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">{p.title}</h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">{p.desc}</p>
              <Link
                href={p.href}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r ${p.gradient} px-4 py-2 rounded-full transition hover:opacity-90`}
              >
                {p.cta} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
