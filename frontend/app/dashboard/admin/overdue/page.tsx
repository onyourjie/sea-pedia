"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle, FastForward, Calendar, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface OverdueOrder {
  id: string;
  status: string;
  total: string;
  deliveryMethod: string;
  createdAt: string;
  store: { name: string };
  buyer: { user: { username: string } };
  statusHistory: { status: string; note?: string; createdAt: string }[];
}

interface SystemDate {
  currentDate: string;
}

const SLA_LABEL: Record<string, string> = {
  INSTANT: "4 jam",
  NEXT_DAY: "24 jam",
  REGULAR: "72 jam",
};

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

export default function AdminOverduePage() {
  const qc = useQueryClient();

  const { data: overdue, isLoading } = useQuery<OverdueOrder[]>({
    queryKey: ["admin-overdue"],
    queryFn: () => api.get("/admin/overdue").then((r) => r.data),
  });

  const { data: sys } = useQuery<SystemDate>({
    queryKey: ["admin-system-date"],
    queryFn: () => api.get("/admin/system-date").then((r) => r.data),
  });

  const advanceDay = useMutation({
    mutationFn: () => api.post("/admin/advance-day").then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-overdue"] });
      qc.invalidateQueries({ queryKey: ["admin-system-date"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success(`Hari berikutnya: ${new Date(data.currentDate).toLocaleDateString("id-ID")}. ${data.overdueProcessed} order overdue diproses.`);
    },
    onError: () => toast.error("Gagal advance day"),
  });

  const processOverdue = useMutation({
    mutationFn: () => api.post("/admin/process-overdue").then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-overdue"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success(`${data} order overdue diproses (refund + restock)`);
    },
    onError: () => toast.error("Gagal proses overdue"),
  });

  const orders = overdue || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Overdue & Time Simulation</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola pesanan yang melewati SLA dan simulasikan waktu untuk demo.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4" />
            <p className="text-xs text-purple-100">Tanggal Sistem Saat Ini</p>
          </div>
          <p className="text-2xl font-bold mb-3">
            {sys?.currentDate ? new Date(sys.currentDate).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Memuat..."}
          </p>
          <button
            onClick={() => advanceDay.mutate()}
            disabled={advanceDay.isPending}
            className="bg-white text-purple-700 hover:bg-purple-50 disabled:opacity-60 text-sm font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
          >
            <FastForward className="w-4 h-4" />
            {advanceDay.isPending ? "Memproses..." : "Maju 1 Hari"}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <RotateCcw className="w-4 h-4 text-red-500" />
            <p className="text-xs text-gray-500">Process Overdue Manual</p>
          </div>
          <p className="text-sm text-gray-700 mb-3">
            Jalankan pengecekan SLA tanpa memajukan tanggal. Order overdue akan otomatis di-refund + restock.
          </p>
          <button
            onClick={() => processOverdue.mutate()}
            disabled={processOverdue.isPending}
            className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {processOverdue.isPending ? "Memproses..." : "Process Overdue"}
          </button>
        </motion.div>
      </div>

      <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4">
        <p className="text-sm text-cyan-800 font-semibold mb-1">SLA per Metode Pengiriman</p>
        <div className="grid grid-cols-3 gap-3 mt-2 text-xs text-cyan-700">
          <p><strong>Instant:</strong> {SLA_LABEL.INSTANT}</p>
          <p><strong>Next Day:</strong> {SLA_LABEL.NEXT_DAY}</p>
          <p><strong>Regular:</strong> {SLA_LABEL.REGULAR}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-3">Pesanan Overdue ({orders.length})</h2>
        {isLoading ? (
          <p className="text-center text-gray-400 py-8">Memuat...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Tidak ada pesanan overdue saat ini</p>
            <p className="text-xs text-gray-400 mt-1">Sistem aman.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const refunded = o.statusHistory.find((h) => h.status === "DIKEMBALIKAN");
              return (
                <div key={o.id} className="border border-red-100 bg-red-50/30 rounded-xl p-4">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-mono text-gray-500">#{o.id.slice(0, 8)}</p>
                        <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          {o.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{o.buyer.user.username} · {o.store.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Pengiriman: {o.deliveryMethod.replace("_", " ")} · SLA: {SLA_LABEL[o.deliveryMethod] || "-"}
                      </p>
                      {refunded?.note && (
                        <p className="text-xs text-red-600 mt-1 italic">{refunded.note}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Total Refund</p>
                      <p className="text-sm font-bold text-red-600">{formatPrice(Number(o.total))}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Order: {new Date(o.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
