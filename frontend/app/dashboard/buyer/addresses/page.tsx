"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, Plus, Pencil, Trash2, Star, X } from "lucide-react";
import Swal from "sweetalert2";
import api from "@/lib/api";
import { SkeletonList } from "@/components/ui/skeleton";

interface Address {
  id: string;
  label: string;
  recipientName: string;
  recipientPhone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

interface FormState {
  label: string;
  recipientName: string;
  recipientPhone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

const empty: FormState = { label: "", recipientName: "", recipientPhone: "", street: "", city: "", province: "", postalCode: "", isDefault: false };

const PHONE_REGEX = /^(\+62|62|0)8[1-9][0-9]{6,11}$/;
const POSTAL_REGEX = /^\d{5}$/;

export default function AddressesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const { data, isLoading } = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: () => api.get("/addresses").then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: (dto: FormState) => api.post("/addresses", dto).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      Swal.fire({ title: "Berhasil!", text: "Alamat ditambahkan.", icon: "success", timer: 1500, showConfirmButton: false });
      reset();
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Swal.fire({ title: "Gagal", text: e?.response?.data?.message || "Gagal menambah alamat", icon: "error", confirmButtonColor: "#ef4444" });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: FormState }) =>
      api.patch(`/addresses/${id}`, dto).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      Swal.fire({ title: "Berhasil!", text: "Alamat diperbarui.", icon: "success", timer: 1500, showConfirmButton: false });
      reset();
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Swal.fire({ title: "Gagal", text: e?.response?.data?.message || "Gagal memperbarui alamat", icon: "error", confirmButtonColor: "#ef4444" });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/addresses/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      Swal.fire({ title: "Terhapus!", text: "Alamat berhasil dihapus.", icon: "success", timer: 1500, showConfirmButton: false });
    },
    onError: () => Swal.fire({ title: "Gagal", text: "Gagal menghapus alamat.", icon: "error", confirmButtonColor: "#ef4444" }),
  });

  const reset = () => {
    setForm(empty);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (a: Address) => {
    setForm({
      label: a.label,
      recipientName: a.recipientName,
      recipientPhone: a.recipientPhone,
      street: a.street,
      city: a.city,
      province: a.province,
      postalCode: a.postalCode,
      isDefault: a.isDefault,
    });
    setEditingId(a.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!PHONE_REGEX.test(form.recipientPhone)) {
      Swal.fire({ title: "Nomor HP tidak valid", text: "Gunakan format Indonesia, mis. 08123456789 atau +6281234567890", icon: "warning", confirmButtonColor: "#f59e0b" });
      return;
    }
    if (!POSTAL_REGEX.test(form.postalCode)) {
      Swal.fire({ title: "Kode pos tidak valid", text: "Kode pos harus 5 digit angka.", icon: "warning", confirmButtonColor: "#f59e0b" });
      return;
    }
    if (editingId) {
      update.mutate({ id: editingId, dto: form });
    } else {
      create.mutate(form);
    }
  };

  const addresses = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Alamat Pengiriman</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola alamat pengiriman pesananmu.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Alamat
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
            <h2 className="font-bold text-gray-800">{editingId ? "Edit Alamat" : "Alamat Baru"}</h2>
            <button type="button" onClick={reset} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Label (mis. Rumah, Kantor)" value={form.label} onChange={(v) => setForm({ ...form, label: v })} required />
            <Field label="Nama Penerima" value={form.recipientName} onChange={(v) => setForm({ ...form, recipientName: v })} required />
            <Field label="Nomor HP Penerima" value={form.recipientPhone} onChange={(v) => setForm({ ...form, recipientPhone: v })} required placeholder="08123456789" hint="Format Indonesia (mis. 08xx atau +62)" />
            <Field label="Kode Pos" value={form.postalCode} onChange={(v) => setForm({ ...form, postalCode: v })} required placeholder="10110" />
            <div className="md:col-span-2">
              <Field label="Alamat Jalan" value={form.street} onChange={(v) => setForm({ ...form, street: v })} required />
            </div>
            <Field label="Kota" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
            <Field label="Provinsi" value={form.province} onChange={(v) => setForm({ ...form, province: v })} required />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="rounded border-gray-300 text-cyan-500"
            />
            Jadikan alamat utama
          </label>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={create.isPending || update.isPending}
              className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
            >
              {editingId ? "Simpan Perubahan" : "Tambah Alamat"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="border border-gray-200 text-gray-600 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50"
            >
              Batal
            </button>
          </div>
        </motion.form>
      )}

      {isLoading ? (
        <SkeletonList count={2} />
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <MapPin className="w-14 h-14 text-cyan-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800">Belum ada alamat tersimpan</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">Tambahkan alamat untuk memudahkan checkout dan pengiriman.</p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
            >
              <Plus className="w-4 h-4" /> Tambah Alamat Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative"
            >
              {a.isDefault && (
                <span className="absolute top-4 right-4 text-[10px] font-semibold bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-cyan-700" /> Utama
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-cyan-500" />
                <p className="font-semibold text-gray-800">{a.label}</p>
              </div>
              <p className="text-sm text-gray-700 font-medium">{a.recipientName}</p>
              <p className="text-xs text-cyan-600 font-mono mb-2">{a.recipientPhone}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{a.street}</p>
              <p className="text-sm text-gray-500 mt-1">{a.city}, {a.province} {a.postalCode}</p>
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => startEdit(a)}
                  className="text-xs text-cyan-500 hover:text-cyan-600 font-medium flex items-center gap-1"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={async () => {
                    const result = await Swal.fire({
                      title: "Hapus Alamat?",
                      text: "Alamat ini akan dihapus permanen.",
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonColor: "#ef4444",
                      cancelButtonColor: "#6b7280",
                      confirmButtonText: "Ya, Hapus",
                      cancelButtonText: "Batal",
                    });
                    if (result.isConfirmed) remove.mutate(a.id);
                  }}
                  className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder, hint }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 bg-white transition"
      />
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
