"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { History, CheckCircle2, DollarSign, TrendingUp, Printer } from "lucide-react";
import api from "@/lib/api";

interface Job {
  id: string;
  takenAt?: string;
  completedAt?: string;
  order: {
    id: string;
    status: string;
    deliveryFee: string;
    deliveryMethod: string;
    store: { id: string; name: string };
    address: { city: string };
  };
}

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function DriverHistoryPage() {
  const { data, isLoading } = useQuery<{ jobs: Job[]; totalEarnings: number }>({
    queryKey: ["driver-my-jobs"],
    queryFn: () => api.get("/delivery/jobs/my").then((r) => r.data),
  });

  const all = data?.jobs || [];
  const completed = all.filter((j) => j.order.status === "PESANAN_SELESAI");
  const totalEarnings = data?.totalEarnings ?? 0;
  const avgEarning = completed.length > 0 ? totalEarnings / completed.length : 0;
  const generatedAt = new Date().toLocaleString("id-ID", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  if (isLoading) return <p className="text-center text-gray-400 py-12">Memuat riwayat...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Riwayat & Earnings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pantau total penghasilan dan job yang sudah diselesaikan.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition"
        >
          <Printer className="w-4 h-4" /> Cetak / Simpan PDF
        </button>
      </div>

      <div className="print-area space-y-6">
        <div className="hidden print:block mb-6 border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-800">SEAPEDIA — Laporan Earnings Driver</h1>
          <p className="text-sm text-gray-500 mt-1">Dicetak pada {generatedAt}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: DollarSign, label: "Total Earnings", value: formatPrice(totalEarnings), iconBg: "bg-green-100", iconColor: "text-green-600" },
            { icon: CheckCircle2, label: "Job Selesai", value: `${completed.length}`, iconBg: "bg-cyan-100", iconColor: "text-cyan-600" },
            { icon: TrendingUp, label: "Rata-rata / Job", value: formatPrice(avgEarning), iconBg: "bg-orange-100", iconColor: "text-orange-600" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="print-card bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${s.iconColor}`} />
                </div>
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className="text-xl font-bold text-gray-800 leading-tight">{s.value}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="print-card bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-3">Riwayat Job</h2>
        {all.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Belum ada riwayat</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 uppercase border-b border-gray-100">
              <tr>
                <th className="text-left py-2 font-semibold">Order</th>
                <th className="text-left py-2 font-semibold">Toko</th>
                <th className="text-left py-2 font-semibold">Tujuan</th>
                <th className="text-left py-2 font-semibold">Tanggal</th>
                <th className="text-right py-2 font-semibold">Status</th>
                <th className="text-right py-2 font-semibold">Earning</th>
              </tr>
            </thead>
            <tbody>
              {all.map((j) => {
                const earning = j.order.status === "PESANAN_SELESAI" ? Number(j.order.deliveryFee) * 0.8 : 0;
                const isCompleted = j.order.status === "PESANAN_SELESAI";
                return (
                  <tr key={j.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 text-xs font-mono text-gray-500">#{j.order.id.slice(0, 8)}</td>
                    <td className="py-3 text-gray-700">{j.order.store.name}</td>
                    <td className="py-3 text-gray-600">{j.order.address.city}</td>
                    <td className="py-3 text-gray-500 text-xs">
                      {j.completedAt ? formatDate(j.completedAt) : j.takenAt ? formatDate(j.takenAt) : "-"}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isCompleted ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-600"}`}>
                        {isCompleted ? "Selesai" : "Dikirim"}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold text-green-600">
                      {earning > 0 ? formatPrice(earning) : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-gray-200">
              <tr>
                <td colSpan={5} className="py-3 text-right text-sm font-bold text-gray-700">Total Earnings:</td>
                <td className="py-3 text-right font-bold text-green-600">{formatPrice(totalEarnings)}</td>
              </tr>
            </tfoot>
          </table>
        )}
        </div>
      </div>
    </div>
  );
}
