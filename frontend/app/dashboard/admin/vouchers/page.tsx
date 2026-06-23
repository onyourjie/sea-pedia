"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Tag, Plus, X } from "lucide-react";
import Swal from "sweetalert2";
import api from "@/lib/api";
import { SkeletonTable } from "@/components/ui/skeleton";

interface Voucher {
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
  code: "", description: "", type: "PCT", value: 10, maxDiscount: 50000, minOrder: 100000, usageLimit: 100, expiresAt: "",
};

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

export default function AdminVouchersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(empty);

  const { data, isLoading } = useQuery<Voucher[]>({
    queryKey: ["admin-vouchers"],
    queryFn: () => api.get("/vouchers").then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: (dto: FormState) => {
      const payload: Record<string, string | number> = {
        code: dto.code.toUpperCase(),
        description: dto.description,
        usageLimit: dto.usageLimit,
        expiresAt: dto.expiresAt,
      };
      if (dto.type === "PCT") {
        payload.discountPct = dto.value;
        if (dto.maxDiscount > 0) payload.maxDiscount = dto.maxDiscount;
      } else {
        payload.discountAmount = dto.value;
      }
      if (dto.minOrder > 0) payload.minOrder = dto.minOrder;
      return api.post("/vouchers", payload).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-vouchers"] });
      Swal.fire({ title: "Berhasil!", text: "Voucher berhasil dibuat.", icon: "success", timer: 1500, showConfirmButton: false });
      setForm(empty);
      setShowForm(false);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Swal.fire({ title: "Gagal", text: e?.response?.data?.message || "Gagal membuat voucher", icon: "error", confirmButtonColor: "#ef4444" });
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

  const vouchers = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Voucher</h1>
          <p className="text-sm text-gray-500 mt-0.5">{vouchers.length} voucher tersedia di sistem.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Buat Voucher
          </button>
        )}
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Voucher Baru</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Kode Voucher" value={form.code} onChange={(v) => setForm({ ...form, code: v })} placeholder="MIS. SAVE10" />
            <Field label="Deskripsi" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Tipe Diskon</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as "PCT" | "AMOUNT" })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-400"
              >
                <option value="PCT">Persentase (%)</option>
                <option value="AMOUNT">Nominal (Rp)</option>
              </select>
            </div>
            <NumField label={form.type === "PCT" ? "Persen Diskon" : "Jumlah Diskon (Rp)"} value={form.value} onChange={(v) => setForm({ ...form, value: v })} />
            {form.type === "PCT" && (
              <NumField label="Maks Diskon (Rp)" value={form.maxDiscount} onChange={(v) => setForm({ ...form, maxDiscount: v })} />
            )}
            <NumField label="Min Order (Rp)" value={form.minOrder} onChange={(v) => setForm({ ...form, minOrder: v })} />
            <NumField label="Batas Pemakaian" value={form.usageLimit} onChange={(v) => setForm({ ...form, usageLimit: v })} />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Kedaluwarsa</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-400"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={create.isPending}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
          >
            Buat Voucher
          </button>
        </motion.form>
      )}

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><SkeletonTable rows={5} /></div>
      ) : vouchers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Tag className="w-14 h-14 text-purple-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800">Belum ada voucher dibuat</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">Buat voucher pertama agar Buyer bisa pakai diskon di checkout.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
          >
            <Plus className="w-4 h-4" /> Buat Voucher
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {vouchers.map((v) => {
            const expired = new Date(v.expiresAt) < new Date();
            const used = v.usageCount >= v.usageLimit;
            return (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-purple-50" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-purple-600" />
                    <p className="font-mono font-bold text-gray-800">{v.code}</p>
                    {expired && <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Expired</span>}
                    {used && <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">Habis</span>}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{v.description || "—"}</p>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>Diskon: <strong className="text-gray-700">{v.discountPct ? `${v.discountPct}%` : v.discountAmount ? formatPrice(Number(v.discountAmount)) : "-"}</strong>
                      {v.maxDiscount && ` (maks ${formatPrice(Number(v.maxDiscount))})`}</p>
                    {v.minOrder && <p>Min order: {formatPrice(Number(v.minOrder))}</p>}
                    <p>Pemakaian: <strong className="text-gray-700">{v.usageCount}/{v.usageLimit}</strong></p>
                    <p>Kedaluwarsa: {new Date(v.expiresAt).toLocaleDateString("id-ID")}</p>
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

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-400"
      />
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
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-400"
      />
    </div>
  );
}
