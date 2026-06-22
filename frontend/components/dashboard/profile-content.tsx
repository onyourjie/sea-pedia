"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { User, Wallet, DollarSign, Award, Shuffle, Mail, AtSign } from "lucide-react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { DiceBearAvatar } from "@/components/ui/dicebear-avatar";

const ROLE_INFO: Record<string, {
  label: string;
  icon: string;
  gradient: string;
  href: string;
  decorations: string[];
}> = {
  BUYER: {
    label: "Pembeli",
    icon: "mdi:cart-outline",
    gradient: "from-cyan-400 via-sky-500 to-blue-600",
    href: "/dashboard/buyer",
    decorations: ["mdi:fish", "mdi:shopping-outline", "mdi:star-four-points"],
  },
  SELLER: {
    label: "Penjual",
    icon: "mdi:store-outline",
    gradient: "from-orange-400 via-orange-500 to-red-500",
    href: "/dashboard/seller",
    decorations: ["mdi:fish", "mdi:package-variant-closed", "mdi:chart-line"],
  },
  DRIVER: {
    label: "Driver",
    icon: "mdi:truck-delivery-outline",
    gradient: "from-emerald-400 via-green-500 to-teal-600",
    href: "/dashboard/driver",
    decorations: ["mdi:map-marker-path", "mdi:package-variant", "mdi:motion-outline"],
  },
  ADMIN: {
    label: "Admin",
    icon: "mdi:shield-crown-outline",
    gradient: "from-purple-500 via-violet-500 to-indigo-600",
    href: "/dashboard/admin",
    decorations: ["mdi:account-group-outline", "mdi:chart-box-outline", "mdi:check-decagram-outline"],
  },
};

interface ProfileData {
  id: string;
  username: string;
  email: string;
  roles: string[];
  walletBalance: number | null;
  driverEarnings: number | null;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

export default function ProfileContent() {
  const { user, token } = useAuthStore();

  const { data: profileData, isLoading: isProfileLoading } = useQuery<ProfileData>({
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
        className={`relative min-h-44 overflow-hidden rounded-[28px] p-6 sm:p-8 text-white shadow-lg bg-gradient-to-br ${activeInfo.gradient}`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 800 120"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-20 w-full text-white/10"
        >
          <path
            fill="currentColor"
            d="M0,65 C120,120 230,10 365,55 C500,100 590,25 800,70 L800,120 L0,120 Z"
          />
        </svg>

        <div className="relative z-10 flex min-h-28 items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <DiceBearAvatar seed={user.username} className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-white/30 shadow-md" />
            <div>
              <p className="text-sm opacity-90 mb-0.5">Halo,</p>
              <h1 className="text-2xl sm:text-3xl font-bold">{user.username}</h1>
              <p className="text-sm sm:text-base opacity-90 mt-1">Peran aktif: {activeInfo.label}</p>
            </div>
          </div>

          <div className="relative hidden h-28 w-48 shrink-0 sm:block" aria-hidden="true">
            <div className="absolute bottom-0 right-4 flex h-24 w-24 rotate-6 items-center justify-center rounded-[30px] bg-white/20 shadow-lg ring-1 ring-white/30 backdrop-blur-sm">
              <Icon icon={activeInfo.icon} className="h-14 w-14 -rotate-6 text-white" />
            </div>
            <div className="absolute left-2 top-2 flex h-10 w-10 -rotate-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Icon icon={activeInfo.decorations[0]} className="h-6 w-6 text-white" />
            </div>
            <div className="absolute left-12 bottom-1 flex h-9 w-9 rotate-12 items-center justify-center rounded-xl bg-white/15">
              <Icon icon={activeInfo.decorations[1]} className="h-5 w-5 text-white/90" />
            </div>
            <Icon
              icon={activeInfo.decorations[2]}
              className="absolute right-0 top-0 h-7 w-7 rotate-12 text-white/70"
            />
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
              <p className="font-medium text-gray-800">{profileData?.username ?? user.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="font-medium text-gray-800">
                {isProfileLoading ? "Memuat email..." : profileData?.email || "Email tidak tersedia"}
              </p>
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
