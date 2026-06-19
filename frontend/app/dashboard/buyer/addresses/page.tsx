"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, Plus, Pencil, Trash2, Star, X } from "lucide-react";
import Swal from "sweetalert2";
import api from "@/lib/api";

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

interface FormState {
  label: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

const empty: FormState = { label: "", street: "", city: "", province: "", postalCode: "", isDefault: false };

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
            <Field label="Kode Pos" value={form.postalCode} onChange={(v) => setForm({ ...form, postalCode: v })} required />
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
        <p className="text-center text-gray-400 py-12">Memuat alamat...</p>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700">Belum ada alamat tersimpan</h3>
          <p className="text-sm text-gray-400 mt-1">Tambahkan alamat untuk memudahkan checkout.</p>
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

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 bg-white transition"
      />
    </div>
  );
}
