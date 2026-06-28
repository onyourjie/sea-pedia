"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User, AtSign, Waves, Check } from "lucide-react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { AuthHeroCarousel } from "@/components/auth/auth-hero-carousel";

const ROLES = [
  { value: "BUYER", label: "Pembeli", icon: "mdi:cart-outline", desc: "Beli produk maritim" },
  { value: "SELLER", label: "Penjual", icon: "mdi:store-outline", desc: "Jual produk Anda" },
  { value: "DRIVER", label: "Driver", icon: "mdi:truck-delivery-outline", desc: "Antar pesanan" },
];

const PASSWORD_RULES = [
  { key: "length", label: "Minimal 8 karakter", test: (p: string) => p.length >= 8 },
  { key: "upper", label: "Satu huruf besar", test: (p: string) => /[A-Z]/.test(p) },
  { key: "lower", label: "Satu huruf kecil", test: (p: string) => /[a-z]/.test(p) },
  { key: "number", label: "Satu angka", test: (p: string) => /[0-9]/.test(p) },
  { key: "special", label: "Satu karakter spesial", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", username: "", email: "", password: "", confirmPassword: "" });
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["BUYER"]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Password tidak cocok");
      return;
    }
    if (!PASSWORD_RULES.every((r) => r.test(form.password))) {
      toast.error("Password belum memenuhi semua syarat keamanan");
      return;
    }
    if (!agree) {
      toast.error("Anda harus menyetujui syarat & ketentuan");
      return;
    }
    if (selectedRoles.length === 0) {
      toast.error("Pilih minimal satu peran");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        username: form.username,
        email: form.email,
        password: form.password,
        roles: selectedRoles,
      });
      toast.success("Akun berhasil dibuat! Silakan masuk.");
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "Pendaftaran gagal, coba lagi");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <AuthHeroCarousel />

      {/* Right panel */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12 overflow-y-auto"
      >
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-cyan-500 tracking-wide">SEAPEDIA</span>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Buat Akun Baru</h1>
            <p className="text-gray-500 text-sm mt-1">
              Bergabunglah dengan komunitas kelautan terbesar dan mulai transaksi Anda hari ini.
            </p>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10 bg-cyan-50 rounded-2xl border border-cyan-200"
            >
              <div className="text-5xl mb-3">🎉</div>
              <p className="font-bold text-cyan-700 text-lg">Akun berhasil dibuat!</p>
              <p className="text-sm text-gray-500 mt-1">Mengarahkan ke halaman login...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="budi@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                <div className="relative">
                  <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="budisantoso99"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 8 karakter"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 bg-white transition"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password && (
                  <ul className="mt-2 space-y-1">
                    {PASSWORD_RULES.map((r) => {
                      const ok = r.test(form.password);
                      return (
                        <li key={r.key} className={`flex items-center gap-2 text-xs ${ok ? "text-green-600" : "text-gray-400"}`}>
                          <span className={`flex items-center justify-center w-3.5 h-3.5 rounded-full ${ok ? "bg-green-500" : "bg-gray-200"}`}>
                            {ok && <Check className="w-2.5 h-2.5 text-white" />}
                          </span>
                          {r.label}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Ulangi password Anda"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 bg-white transition"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Daftar sebagai</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => toggleRole(r.value)}
                      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-xs font-medium transition ${
                        selectedRoles.includes(r.value)
                          ? "border-cyan-400 bg-cyan-50 text-cyan-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <Icon icon={r.icon} className={`w-6 h-6 ${selectedRoles.includes(r.value) ? "text-cyan-500" : "text-gray-400"}`} />
                      <span>{r.label}</span>
                      <span className="text-[10px] text-gray-400 font-normal">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-cyan-500 focus:ring-cyan-300"
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  Saya setuju dengan{" "}
                  <a href="#" className="text-cyan-500 hover:underline">Syarat &amp; Ketentuan</a>{" "}
                  serta{" "}
                  <a href="#" className="text-cyan-500 hover:underline">Kebijakan Privasi</a>{" "}
                  SEAPEDIA.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-cyan-500/25 text-sm"
              >
                {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-5">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-cyan-500 hover:text-cyan-600 font-semibold">
              Masuk di sini
            </Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-4">
            © 2026 SEAPEDIA Indonesia &bull; Secure Onboarding
          </p>
        </div>
      </motion.div>
    </div>
  );
}
