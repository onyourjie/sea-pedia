"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token || !user) {
      router.replace("/login");
      return;
    }

    const map: Record<string, string> = {
      BUYER: "/dashboard/buyer/profile",
      SELLER: "/dashboard/seller/profile",
      DRIVER: "/dashboard/driver/profile",
      ADMIN: "/dashboard/admin",
    };
    router.replace(map[user.activeRole || ""] || "/dashboard");
  }, [hasHydrated, token, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Mengarahkan ke profil...</p>
      </div>
    </div>
  );
}
