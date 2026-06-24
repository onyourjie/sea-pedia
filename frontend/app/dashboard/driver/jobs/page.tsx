"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Truck, Package, Store, RefreshCcw } from "lucide-react";
import Swal from "sweetalert2";
import api from "@/lib/api";
import { SkeletonList } from "@/components/ui/skeleton";

interface AvailableJob {
  id: string;
  createdAt: string;
  order: {
    id: string;
    deliveryFee: string;
    deliveryMethod: string;
    total: string;
    store: { id: string; name: string };
    address: { label: string; recipientName: string; recipientPhone: string; street: string; city: string; province: string };
    items: { id: string; name: string; quantity: number }[];
  };
}

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

export default function DriverJobsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ data: AvailableJob[]; total: number }>({
    queryKey: ["driver-available-jobs"],
    queryFn: () => api.get("/delivery/jobs/available?page=1&limit=30").then((r) => r.data),
  });

  const takeJob = useMutation({
    mutationFn: (deliveryId: string) => api.post(`/delivery/jobs/${deliveryId}/take`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["driver-available-jobs"] });
      qc.invalidateQueries({ queryKey: ["driver-my-jobs"] });
      Swal.fire({ title: "Job Diambil!", text: "Cek tab Job Aktif untuk mulai pengiriman.", icon: "success", confirmButtonColor: "#16a34a" });
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Swal.fire({ title: "Gagal", text: e?.response?.data?.message || "Gagal mengambil job", icon: "error", confirmButtonColor: "#ef4444" });
    },
  });

  const jobs = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Cari Job Pengiriman</h1>
        <p className="text-sm text-gray-500 mt-0.5">{jobs.length} job tersedia. Earnings: 80% dari ongkir.</p>
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Briefcase className="w-14 h-14 text-green-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800">Belum ada job tersedia</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">Job baru muncul setelah Seller memproses pesanan. Refresh untuk cek lagi.</p>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["driver-available-jobs"] })}
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh Job
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.map((j, i) => {
            const earning = Number(j.order.deliveryFee) * 0.8;
            return (
              <motion.div
                key={j.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full">
                      <Truck className="w-3 h-3 inline mr-0.5" /> {j.order.deliveryMethod.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono">#{j.order.id.slice(0, 8)}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Store className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400">Pickup dari</p>
                      <p className="font-semibold text-gray-800">{j.order.store.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400">Antar ke</p>
                      <p className="font-semibold text-gray-800">{j.order.address.label}</p>
                      <p className="text-xs text-gray-700">{j.order.address.recipientName} <span className="text-orange-600 font-mono ml-1">{j.order.address.recipientPhone}</span></p>
                      <p className="text-xs text-gray-500">{j.order.address.street}, {j.order.address.city}, {j.order.address.province}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-500">{j.order.items.length} item ({j.order.items.reduce((s, i) => s + i.quantity, 0)} pcs)</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400">Earnings</p>
                    <p className="text-lg font-bold text-green-600">{formatPrice(earning)}</p>
                  </div>
                  <button
                    onClick={() => takeJob.mutate(j.id)}
                    disabled={takeJob.isPending}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-xl transition shadow-md shadow-green-600/20 shrink-0"
                  >
                    Ambil Job
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
