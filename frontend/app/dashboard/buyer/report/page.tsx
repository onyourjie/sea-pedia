"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, ShoppingBag, CreditCard, Package, Printer } from "lucide-react";
import api from "@/lib/api";
import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";

interface Order {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  store: { name: string };
  items: { name: string; quantity: number }[];
}

interface Report {
  totalOrders: number;
  totalSpent: number;
  orders: Order[];
}

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

export default function BuyerReportPage() {
  const { data, isLoading } = useQuery<Report>({
    queryKey: ["buyer-report-page"],
    queryFn: () => api.get("/orders/buyer/report").then((r) => r.data),
  });

  const orders = data?.orders || [];
  const completed = orders.filter((o) => o.status === "PESANAN_SELESAI");
  const totalItems = completed.reduce((s, o) => s + o.items.reduce((x, i) => x + i.quantity, 0), 0);
  const avgOrder = completed.length > 0 ? (data?.totalSpent || 0) / completed.length : 0;
  const generatedAt = new Date().toLocaleString("id-ID", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan Belanja</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ringkasan pengeluaran dan riwayat transaksi.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><SkeletonTable rows={5} /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan Belanja</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ringkasan pengeluaran dan riwayat transaksi.</p>
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
          <h1 className="text-2xl font-bold text-gray-800">SEAPEDIA — Laporan Belanja</h1>
          <p className="text-sm text-gray-500 mt-1">Dicetak pada {generatedAt}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: CreditCard, label: "Total Belanja", value: formatPrice(data?.totalSpent ?? 0), iconBg: "bg-cyan-100", iconColor: "text-cyan-600" },
            { icon: ShoppingBag, label: "Pesanan Selesai", value: `${completed.length}`, iconBg: "bg-green-100", iconColor: "text-green-600" },
            { icon: Package, label: "Total Item Dibeli", value: `${totalItems}`, iconBg: "bg-orange-100", iconColor: "text-orange-600" },
            { icon: TrendingUp, label: "Rata-rata / Pesanan", value: formatPrice(avgOrder), iconBg: "bg-purple-100", iconColor: "text-purple-600" },
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
          <h2 className="font-bold text-gray-800 mb-3">Riwayat Pengeluaran</h2>
          {completed.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Belum ada pesanan selesai</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase border-b border-gray-100">
                <tr>
                  <th className="text-left py-2 font-semibold">ID</th>
                  <th className="text-left py-2 font-semibold">Toko</th>
                  <th className="text-left py-2 font-semibold">Tanggal</th>
                  <th className="text-right py-2 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 text-xs font-mono text-gray-500">#{o.id.slice(0, 8)}</td>
                    <td className="py-3 text-gray-700">{o.store.name}</td>
                    <td className="py-3 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString("id-ID")}</td>
                    <td className="py-3 text-right font-semibold text-cyan-600">{formatPrice(Number(o.total))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-200">
                <tr>
                  <td colSpan={3} className="py-3 text-right text-sm font-bold text-gray-700">Total Belanja:</td>
                  <td className="py-3 text-right font-bold text-cyan-600">{formatPrice(data?.totalSpent ?? 0)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
