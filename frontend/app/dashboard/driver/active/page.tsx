"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Truck, MapPin, Store, CheckCircle2, Clock } from "lucide-react";
import toast from "react-hot-toast";
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
    total: string;
    store: { id: string; name: string };
    address: { label: string; street: string; city: string; province: string };
  };
}

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function DriverActivePage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ jobs: Job[]; totalEarnings: number }>({
    queryKey: ["driver-my-jobs"],
    queryFn: () => api.get("/delivery/jobs/my").then((r) => r.data),
  });

  const completeJob = useMutation({
    mutationFn: (deliveryId: string) => api.post(`/delivery/jobs/${deliveryId}/complete`).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["driver-my-jobs"] });
      qc.invalidateQueries({ queryKey: ["driver-available-jobs"] });
      toast.success(`Job selesai! Earning: ${formatPrice(data.earning)}`);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e?.response?.data?.message || "Gagal menyelesaikan job");
    },
  });

  const jobs = data?.jobs || [];
  const active = jobs.filter((j) => j.order.status === "SEDANG_DIKIRIM");

  if (isLoading) return <p className="text-center text-gray-400 py-12">Memuat...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Job Aktif</h1>
        <p className="text-sm text-gray-500 mt-0.5">Konfirmasi pengiriman setelah selesai antar.</p>
      </div>

      {active.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700">Tidak ada job aktif</h3>
          <p className="text-sm text-gray-400 mt-1">Ambil job baru di tab Cari Job.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {active.map((j) => {
            const earning = Number(j.order.deliveryFee) * 0.8;
            return (
              <motion.div
                key={j.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border-2 border-green-200 shadow-md p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Sedang Dikirim
                    </span>
                    {j.takenAt && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Diambil: {formatDateTime(j.takenAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-mono">#{j.order.id.slice(0, 8)}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                    <Store className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400">Pickup dari</p>
                      <p className="font-semibold text-gray-800">{j.order.store.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                    <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400">Antar ke</p>
                      <p className="font-semibold text-gray-800">{j.order.address.label}</p>
                      <p className="text-xs text-gray-500">{j.order.address.street}, {j.order.address.city}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400">Earnings</p>
                    <p className="text-lg font-bold text-green-600">{formatPrice(earning)}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Konfirmasi pengiriman selesai?")) completeJob.mutate(j.id);
                    }}
                    disabled={completeJob.isPending}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-green-600/25 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Konfirmasi Selesai
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
