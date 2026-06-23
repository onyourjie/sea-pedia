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
  discountAmount?: string | null;
  discountPct?: string | null;
  maxDiscount?: string | null;
  expiresAt: string;
  usageLimit: number;
  usageCount: number;
}

const STATIC_CARDS = [
  {
    icon: Flame,
    tag: "Hot Deals",
    title: "Diskon Produk Aktif",
    desc: "Lihat produk dengan diskon terbesar dari seller terpercaya.",
    cta: "Lihat Deal",
    href: "/products?deals=1",
    gradient: "from-orange-500 to-red-500",
    bg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
  {
    icon: Box,
    tag: "Produk Baru",
    title: "Baru Ditambahkan",
    desc: "Temukan produk maritim terbaru yang baru saja masuk.",
    cta: "Lihat Baru",
    href: "/products?sort=newest",
    gradient: "from-purple-500 to-violet-500",
    bg: "bg-purple-50",
    iconColor: "text-purple-500",
  },
];

function describePromoCard(p: Promo) {
  if (p.discountPct) {
    const pct = Number(p.discountPct);
    const max = p.maxDiscount ? ` (maks Rp ${Number(p.maxDiscount).toLocaleString("id-ID")})` : "";
    return `Diskon ${pct}%${max}`;
  }
  if (p.discountAmount) {
    return `Potongan Rp ${Number(p.discountAmount).toLocaleString("id-ID")}`;
  }
  return p.description || `Pakai kode ${p.code}`;
}

export function PromoSection() {
  const { data } = useQuery({
    queryKey: ["active-promos"],
    queryFn: () => api.get("/promos").then((r: { data: Promo[] | { data?: Promo[] } }) => r.data),
  });

  const promos: Promo[] = Array.isArray(data) ? data : (data?.data || []);
  const activePromo = promos.find((p) => {
    const notExpired = new Date(p.expiresAt) > new Date();
    const hasQuota = p.usageLimit === 0 || p.usageCount < p.usageLimit;
    return notExpired && hasQuota;
  });

  const promoCard = activePromo
    ? {
        icon: Tag,
        tag: "Kode Promo",
        title: activePromo.code,
        desc: describePromoCard(activePromo),
        cta: "Belanja Sekarang",
        href: "/products?promo=1",
        gradient: "from-cyan-500 to-teal-500",
        bg: "bg-cyan-50",
        iconColor: "text-cyan-500",
      }
    : null;

  const cards = promoCard ? [STATIC_CARDS[0], promoCard, STATIC_CARDS[1]] : STATIC_CARDS;

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className={`grid gap-4 ${cards.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
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
