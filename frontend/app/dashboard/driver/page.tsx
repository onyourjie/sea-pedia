"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Truck, DollarSign, CheckCircle2, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

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
    address: { city: string; province: string };
  };
}

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

export default function DriverDashboardPage() {
  const { user } = useAuthStore();

  const { data: myJobs } = useQuery<{ jobs: Job[]; totalEarnings: number }>({
    queryKey: ["driver-my-jobs"],
    queryFn: () => api.get("/delivery/jobs/my").then((r) => r.data),
  });

  const { data: available } = useQuery<{ data: Job[]; total: number }>({
    queryKey: ["driver-available-jobs"],
    queryFn: () => api.get("/delivery/jobs/available?page=1&limit=10").then((r) => r.data),
  });

  const jobs = myJobs?.jobs || [];
  const activeJob = jobs.find((j) => j.order.status === "SEDANG_DIKIRIM");
  const completedCount = jobs.filter((j) => j.order.status === "PESANAN_SELESAI").length;

  const stats = [
    { icon: DollarSign, label: "Total Earnings", value: formatPrice(myJobs?.totalEarnings ?? 0), iconBg: "bg-green-100", iconColor: "text-green-600" },
    { icon: CheckCircle2, label: "Job Selesai", value: `${completedCount}`, iconBg: "bg-cyan-100", iconColor: "text-cyan-600" },
    { icon: Truck, label: "Job Aktif", value: activeJob ? "1" : "0", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
    { icon: Briefcase, label: "Job Tersedia", value: `${available?.total ?? 0}`, iconBg: "bg-orange-100", iconColor: "text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Halo, Driver {user?.username}!</h1>
        <p className="text-sm text-gray-500 mt-0.5">Cari job pengiriman dan tingkatkan penghasilanmu.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
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

      {activeJob && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-green-100 mb-1">Job Aktif Saat Ini</p>
              <h3 className="text-lg font-bold">{activeJob.order.store.name}</h3>
              <p className="text-xs text-green-100 mt-1">
                {activeJob.order.address.city}, {activeJob.order.address.province} · {activeJob.order.deliveryMethod.replace("_", " ")}
              </p>
            </div>
            <Link
              href="/dashboard/driver/active"
              className="bg-white text-green-600 text-xs font-semibold px-4 py-2 rounded-full hover:bg-green-50 transition"
            >
              Selesaikan Job →
            </Link>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">Job Tersedia</h2>
          <Link href="/dashboard/driver/jobs" className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
            Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {!available?.data || available.data.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Tidak ada job tersedia saat ini</p>
        ) : (
          <div className="space-y-3">
            {available.data.slice(0, 3).map((j) => (
              <Link
                key={j.id}
                href="/dashboard/driver/jobs"
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{j.order.store.name}</p>
                  <p className="text-xs text-gray-500">{j.order.address.city}, {j.order.address.province}</p>
                </div>
                <p className="text-sm font-bold text-green-600">{formatPrice(Number(j.order.deliveryFee) * 0.8)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
