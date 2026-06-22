"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Package, Award, Clock, Printer } from "lucide-react";
import api from "@/lib/api";

interface ReportData {
  totalOrders: number;
  totalIncome: number;
  pendingOrders: number;
  pendingIncome: number;
  orders: {
    id: string;
    status: string;
    total: string;
    createdAt: string;
    items: { name: string; quantity: number }[];
  }[];
}

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
      <div className="w-9 h-9 rounded-xl bg-gray-100 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-24 mb-2" />
      <div className="h-6 bg-gray-100 rounded w-32" />
    </div>
  );
}

export default function SellerReportPage() {
  const { data, isLoading, isError } = useQuery<ReportData>({
    queryKey: ["seller-income-report"],
    queryFn: () => api.get("/orders/seller/report").then((r) => r.data),
  });

  const completed = data?.orders.filter((o) => o.status === "PESANAN_SELESAI") || [];
  const totalItems = completed.reduce((s, o) => s + o.items.reduce((x, i) => x + i.quantity, 0), 0);
  const avgOrder = completed.length > 0 ? (data?.totalIncome || 0) / completed.length : 0;
  const generatedAt = new Date().toLocaleString("id-ID", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  if (isLoading) return (
    <div className="space-y-6">
      <div>
        <div className="h-7 bg-gray-100 rounded w-48 animate-pulse mb-2" />
        <div className="h-4 bg-gray-100 rounded w-64 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  if (isError) return (
    <div className="text-center py-16">
      <p className="text-red-500 font-medium">Gagal memuat laporan</p>
      <p className="text-sm text-gray-400 mt-1">Coba refresh halaman</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan Pendapatan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ringkasan transaksi yang sudah selesai.</p>
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
          <h1 className="text-2xl font-bold text-gray-800">SEAPEDIA — Laporan Pendapatan Seller</h1>
          <p className="text-sm text-gray-500 mt-1">Dicetak pada {generatedAt}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: DollarSign, label: "Total Pendapatan", value: formatPrice(data?.totalIncome ?? 0), iconBg: "bg-green-100", iconColor: "text-green-600" },
            { icon: TrendingUp, label: "Pesanan Selesai", value: `${completed.length}`, iconBg: "bg-cyan-100", iconColor: "text-cyan-600" },
            { icon: Package, label: "Total Item Terjual", value: `${totalItems}`, iconBg: "bg-orange-100", iconColor: "text-orange-600" },
            { icon: Award, label: "Rata-rata Pesanan", value: formatPrice(avgOrder), iconBg: "bg-purple-100", iconColor: "text-purple-600" },
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

        {(data?.pendingOrders ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="print-card bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">Pendapatan Tertunda</p>
              <p className="text-xs text-amber-600 mt-0.5">
                {data?.pendingOrders} pesanan sedang diproses — estimasi {formatPrice(data?.pendingIncome ?? 0)} akan masuk setelah selesai
              </p>
            </div>
          </motion.div>
        )}

        <div className="print-card bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-3">Riwayat Pesanan Selesai</h2>
          {completed.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Belum ada pesanan selesai</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase border-b border-gray-100">
                <tr>
                  <th className="text-left py-2 font-semibold">ID</th>
                  <th className="text-left py-2 font-semibold">Tanggal</th>
                  <th className="text-right py-2 font-semibold">Item</th>
                  <th className="text-right py-2 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 text-xs font-mono text-gray-500">#{o.id.slice(0, 8)}</td>
                    <td className="py-3 text-gray-600">{new Date(o.createdAt).toLocaleDateString("id-ID")}</td>
                    <td className="py-3 text-right text-gray-600">{o.items.reduce((x, i) => x + i.quantity, 0)} item</td>
                    <td className="py-3 text-right font-semibold text-cyan-600">{formatPrice(Number(o.total))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-200">
                <tr>
                  <td colSpan={3} className="py-3 text-right text-sm font-bold text-gray-700">Total Pendapatan:</td>
                  <td className="py-3 text-right font-bold text-green-600">{formatPrice(data?.totalIncome ?? 0)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
