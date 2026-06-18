"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Waves } from "lucide-react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, setActiveRole } = useAuthStore();

  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [roleModal, setRoleModal] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [selectionToken, setSelectionToken] = useState("");
  const [userData, setUserData] = useState<{ id: string; username: string; email: string; roles: string[] } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      const data = res.data;

      if (data.requiresRoleSelection) {
        setRoles(data.roles);
        setSelectionToken(data.selectionToken);
        setUserData(data.user);
        setRoleModal(true);
      } else {
        setAuth(
          { id: data.user?.id || "", username: form.username, email: data.user?.email || "", activeRole: data.activeRole, roles: data.roles },
          data.accessToken
        );
        toast.success("Selamat datang kembali!");
        redirectByRole(data.activeRole);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Username atau password salah");
    }
    setLoading(false);
  };

  const handleSelectRole = async (role: string) => {
    try {
      const res = await api.post("/auth/select-role", { role }, {
        headers: { Authorization: `Bearer ${selectionToken}` },
      });
      setActiveRole(role, res.data.accessToken);
      setAuth(
        { id: userData?.id || "", username: userData?.username || "", email: userData?.email || "", activeRole: role, roles },
        res.data.accessToken
      );
      toast.success("Peran dipilih!");
      redirectByRole(role);
    } catch {
      toast.error("Gagal memilih peran");
      setRoleModal(false);
    }
  };

  const redirectByRole = (role: string) => {
    const map: Record<string, string> = {
      BUYER: "/dashboard/buyer",
      SELLER: "/dashboard/seller",
      DRIVER: "/dashboard/driver",
      ADMIN: "/dashboard/admin",
    };
    router.push(map[role] || "/");
  };

  const ROLE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
    BUYER: { label: "Pembeli", icon: "mdi:cart-outline", color: "from-cyan-400 to-blue-500" },
    SELLER: { label: "Penjual", icon: "mdi:store-outline", color: "from-orange-400 to-red-500" },
    DRIVER: { label: "Driver", icon: "mdi:truck-delivery-outline", color: "from-green-400 to-emerald-500" },
    ADMIN: { label: "Admin", icon: "mdi:shield-crown-outline", color: "from-purple-400 to-violet-500" },
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-cyan-400 via-cyan-500 to-teal-600 flex-col items-center justify-center overflow-hidden"
      >
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border-2 border-white/20"
            style={{
              width: `${200 + i * 150}px`,
              height: `${200 + i * 150}px`,
              left: `${-60 + i * 20}px`,
              bottom: `${-60 + i * 20}px`,
            }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.8 }}
          />
        ))}

        <div className="relative z-10 text-center px-12 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-72 h-56 rounded-2xl overflow-hidden mx-auto mb-8 shadow-2xl border-4 border-white/30"
          >
            <img
              src="https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=600&q=80"
              alt="Maritime marketplace"
              className="w-full h-full object-cover"
            />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold text-black mb-3"
          >
            Selamat Datang di<br />SEAPEDIA
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-black/70 text-base leading-relaxed"
          >
            Pasar hasil laut terbesar dan terpercaya di genggaman Anda.
          </motion.p>
        </div>
      </motion.div>

      {/* Right panel */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12"
      >
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-cyan-500 tracking-wide">SEAPEDIA</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Masuk ke Akun Anda</h1>
            <p className="text-gray-500 text-sm mt-1">Selamat datang kembali! Silakan masuk untuk mengelola hasil laut Anda.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="username Anda"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kata sandi"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-cyan-500 focus:ring-cyan-300" />
                Ingat saya
              </label>
              <a href="#" className="text-sm text-cyan-500 hover:text-cyan-600 font-medium">Lupa password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-cyan-500/25 text-sm"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Belum punya akun?{" "}
            <Link href="/register" className="text-cyan-500 hover:text-cyan-600 font-semibold">
              Daftar di sini
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Role selection modal */}
      {roleModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center mx-auto mb-3">
                <Waves className="w-6 h-6 text-cyan-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Pilih Peran</h3>
              <p className="text-sm text-gray-500 mt-1">Akun Anda memiliki beberapa peran. Pilih satu untuk melanjutkan.</p>
            </div>
            <div className="space-y-3">
              {roles.map((role) => {
                const info = ROLE_LABELS[role] || { label: role, icon: "👤", color: "from-gray-400 to-gray-500" };
                return (
                  <button
                    key={role}
                    onClick={() => handleSelectRole(role)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 transition group"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center`}>
                      <Icon icon={info.icon} className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-700 group-hover:text-cyan-600">{info.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
