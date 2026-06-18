"use client";

import { motion } from "framer-motion";
import { Store, Shield, Truck } from "lucide-react";

const FEATURES = [
  {
    icon: Store,
    color: "bg-cyan-50 text-cyan-600",
    title: "Multi-Seller Marketplace",
    desc: "Ribuan pengguna dari nelayan, pedagang, dan distributor suku cadang berkumpul dalam satu platform.",
  },
  {
    icon: Shield,
    color: "bg-emerald-50 text-emerald-600",
    title: "Pembayaran Aman",
    desc: "Sistem escrow memastikan dana Anda aman sampai barang diterima dalam kondisi baik.",
  },
  {
    icon: Truck,
    color: "bg-blue-50 text-blue-600",
    title: "Driver Terpercaya",
    desc: "Jaringan driver berpengalaman yang siap mengantarkan barang besar maupun hasil laut segar.",
  },
];

export function FeaturesSection() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Mengapa Memilih SEAPEDIA?</h2>
          <p className="text-gray-500 text-sm">Kami membangun ekosistem maritim paling terpercaya untuk mendukung kemajuan ekonomi biru di Indonesia.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center mb-4`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
