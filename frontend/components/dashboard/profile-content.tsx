"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { User, Wallet, DollarSign, Award, Shuffle, Mail, AtSign } from "lucide-react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { DiceBearAvatar } from "@/components/ui/dicebear-avatar";

const ROLE_INFO: Record<string, { label: string; icon: string; gradient: string; href: string }> = {
  BUYER: { label: "Pembeli", icon: "mdi:cart-outline", gradient: "from-cyan-400 to-blue-500", href: "/dashboard/buyer" },
  SELLER: { label: "Penjual", icon: "mdi:store-outline", gradient: "from-orange-400 to-red-500", href: "/dashboard/seller" },
  DRIVER: { label: "Driver", icon: "mdi:truck-delivery-outline", gradient: "from-green-400 to-emerald-500", href: "/dashboard/driver" },
  ADMIN: { label: "Admin", icon: "mdi:shield-crown-outline", gradient: "from-purple-500 to-violet-600", href: "/dashboard/admin" },
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

export default function ProfileContent() {
  const { user, token } = useAuthStore();

  const { data: profileData } = useQuery({
    queryKey: ["profile-detail"],
    queryFn: () => api.get("/users/profile").then((r) => r.data),
    enabled: !!token,
  });

  const { data: report } = useQuery({
    queryKey: ["profile-seller-report"],
    queryFn: () => api.get("/orders/seller/report").then((r) => r.data),
    enabled: !!token && user?.activeRole === "SELLER",
    retry: false,
  });

  const { data: driverData } = useQuery({
    queryKey: ["profile-driver"],
    queryFn: () => api.get("/delivery/jobs/my").then((r) => r.data),
    enabled: !!token && user?.activeRole === "DRIVER",
    retry: false,
  });

  if (!user) return null;

  const activeInfo = (user.activeRole && ROLE_INFO[user.activeRole]) || ROLE_INFO.BUYER;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br ${activeInfo.gradient}`}
      >
        <div className="flex items-center gap-4">
          <DiceBearAvatar seed={user.username} className="h-16 w-16 ring-4 ring-white/30" />
          <div>
            <p className="text-xs opacity-90 mb-0.5">Halo,</p>
            <h1 className="text-2xl font-bold">{user.username}</h1>
            <p className="text-sm opacity-90 mt-0.5">Peran aktif: {activeInfo.label}</p>
          </div>
        </div>
      </motion.div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-cyan-500" />
          <h2 className="font-bold text-gray-800">Informasi Akun</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 py-2 border-b border-gray-50">
            <AtSign className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Username</p>
              <p className="font-medium text-gray-800">{user.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="font-medium text-gray-800">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Shuffle className="w-4 h-4 text-cyan-500" />
            <h2 className="font-bold text-gray-800">Peran yang Dimiliki</h2>
          </div>
          <Link
            href="/login"
            className="text-xs font-semibold bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1.5 rounded-full transition"
          >
            Ganti Peran
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {user.roles.map((role) => {
            const info = ROLE_INFO[role] || ROLE_INFO.BUYER;
            const isActive = role === user.activeRole;
            return (
              <div
                key={role}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  isActive ? "border-cyan-300 bg-cyan-50" : "border-gray-200"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${info.gradient} flex items-center justify-center`}>
                  <Icon icon={info.icon} className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{info.label}</p>
                  {isActive && <p className="text-[10px] text-cyan-600 font-semibold">Sedang Aktif</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-4">Ringkasan Finansial</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <FinancialCard
            icon={Wallet}
            label="Wallet (Buyer)"
            value={user.roles.includes("BUYER") ? formatPrice(profileData?.walletBalance ?? 0) : "-"}
            available={user.roles.includes("BUYER")}
          />
          <FinancialCard
            icon={DollarSign}
            label="Income (Seller)"
            value={user.roles.includes("SELLER") ? formatPrice(report?.totalIncome ?? 0) : "-"}
            available={user.roles.includes("SELLER")}
          />
          <FinancialCard
            icon={Award}
            label="Earnings (Driver)"
            value={user.roles.includes("DRIVER") ? formatPrice(driverData?.totalEarnings ?? 0) : "-"}
            available={user.roles.includes("DRIVER")}
          />
        </div>
      </div>
    </div>
  );
}

function FinancialCard({
  icon: IconComponent,
  label,
  value,
  available,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  available: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl border ${available ? "bg-cyan-50/40 border-cyan-100" : "bg-gray-50 border-gray-100 opacity-50"}`}>
      <IconComponent className={`w-4 h-4 mb-2 ${available ? "text-cyan-500" : "text-gray-400"}`} />
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-base font-bold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
