"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Gift, Plus, X } from "lucide-react";
import Swal from "sweetalert2";
import api from "@/lib/api";
import { SkeletonTable } from "@/components/ui/skeleton";

interface Promo {
  id: string;
  code: string;
  description?: string;
  discountAmount?: string;
  discountPct?: string;
  maxDiscount?: string;
  minOrder?: string;
  usageLimit: number;
  usageCount: number;
  expiresAt: string;
}

interface FormState {
  code: string;
  description: string;
  type: "PCT" | "AMOUNT";
  value: number;
  maxDiscount: number;
  minOrder: number;
  usageLimit: number;
  expiresAt: string;
}

const empty: FormState = {
  code: "", description: "", type: "PCT", value: 20, maxDiscount: 100000, minOrder: 0, usageLimit: 0, expiresAt: "",
};

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

export default function AdminPromosPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(empty);

  const { data, isLoading } = useQuery<Promo[]>({
    queryKey: ["admin-promos"],
    queryFn: () => api.get("/promos").then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: (dto: FormState) => {
      const payload: Record<string, string | number> = {
        code: dto.code.toUpperCase(),
        description: dto.description,
        expiresAt: dto.expiresAt,
      };
      if (dto.type === "PCT") {
        payload.discountPct = dto.value;
        if (dto.maxDiscount > 0) payload.maxDiscount = dto.maxDiscount;
      } else {
        payload.discountAmount = dto.value;
      }
      if (dto.minOrder > 0) payload.minOrder = dto.minOrder;
      if (dto.usageLimit > 0) payload.usageLimit = dto.usageLimit;
      return api.post("/promos", payload).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-promos"] });
      Swal.fire({ title: "Berhasil!", text: "Promo berhasil dibuat.", icon: "success", timer: 1500, showConfirmButton: false });
      setForm(empty);
      setShowForm(false);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Swal.fire({ title: "Gagal", text: e?.response?.data?.message || "Gagal membuat promo", icon: "error", confirmButtonColor: "#ef4444" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.expiresAt) {
      Swal.fire({ title: "Input Tidak Lengkap", text: "Kode dan tanggal kedaluwarsa wajib diisi.", icon: "warning", confirmButtonColor: "#ef4444" });
      return;
    }
    create.mutate(form);
  };

  const promos = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-800">Promo</h1>
          <p className="text-sm text-gray-500 mt-0.5">{promos.length} promo aktif di sistem.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-3 sm:px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Buat Promo</span><span className="sm:hidden">Buat</span>
          </button>
        )}
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Promo Baru</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Kode Promo</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="MIS. NEWUSER20"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Deskripsi</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Tipe Diskon</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as "PCT" | "AMOUNT" })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
              >
                <option value="PCT">Persentase (%)</option>
                <option value="AMOUNT">Nominal (Rp)</option>
              </select>
            </div>
            <NumField label={form.type === "PCT" ? "Persen Diskon" : "Jumlah Diskon (Rp)"} value={form.value} onChange={(v) => setForm({ ...form, value: v })} />
            {form.type === "PCT" && (
              <NumField label="Maks Diskon (Rp)" value={form.maxDiscount} onChange={(v) => setForm({ ...form, maxDiscount: v })} />
            )}
            <NumField label="Min Order (Rp, 0=tanpa min)" value={form.minOrder} onChange={(v) => setForm({ ...form, minOrder: v })} />
            <NumField label="Batas Pemakaian (0=unlimited)" value={form.usageLimit} onChange={(v) => setForm({ ...form, usageLimit: v })} />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Kedaluwarsa</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={create.isPending}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
          >
            Buat Promo
          </button>
        </motion.form>
      )}

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><SkeletonTable rows={5} /></div>
      ) : promos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Gift className="w-14 h-14 text-purple-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800">Belum ada promo dibuat</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">Buat promo pertama untuk menarik Buyer ke marketplace.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
          >
            <Plus className="w-4 h-4" /> Buat Promo
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {promos.map((p) => {
            const expired = new Date(p.expiresAt) < new Date();
            const used = p.usageLimit > 0 && p.usageCount >= p.usageLimit;
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-orange-50" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-4 h-4 text-orange-500" />
                    <p className="font-mono font-bold text-gray-800">{p.code}</p>
                    {expired && <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Expired</span>}
                    {used && <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">Habis</span>}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{p.description || "—"}</p>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>Diskon: <strong className="text-gray-700">{p.discountPct ? `${p.discountPct}%` : p.discountAmount ? formatPrice(Number(p.discountAmount)) : "-"}</strong>
                      {p.maxDiscount && ` (maks ${formatPrice(Number(p.maxDiscount))})`}</p>
                    {p.minOrder && <p>Min order: {formatPrice(Number(p.minOrder))}</p>}
                    <p>Pemakaian: <strong className="text-gray-700">{p.usageCount}{p.usageLimit > 0 ? `/${p.usageLimit}` : " (unlimited)"}</strong></p>
                    <p>Kedaluwarsa: {new Date(p.expiresAt).toLocaleDateString("id-ID")}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={0}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
      />
    </div>
  );
}
