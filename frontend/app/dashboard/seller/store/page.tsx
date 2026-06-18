"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Store, Save, Package, ClipboardList } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface MyStore {
  id: string;
  name: string;
  description?: string;
  _count: { products: number; orders: number };
}

export default function SellerStorePage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: store, isLoading } = useQuery<MyStore | null>({
    queryKey: ["seller-my-store"],
    queryFn: async () => {
      try {
        const r = await api.get("/stores/seller/my-store");
        return r.data;
      } catch {
        return null;
      }
    },
  });

  useEffect(() => {
    if (store) {
      setName(store.name);
      setDescription(store.description || "");
    }
  }, [store]);

  const create = useMutation({
    mutationFn: () => api.post("/stores", { name, description }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller-my-store"] });
      toast.success("Toko berhasil dibuat!");
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e?.response?.data?.message || "Gagal membuat toko");
    },
  });

  const update = useMutation({
    mutationFn: () => api.patch("/stores", { name, description }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller-my-store"] });
      toast.success("Toko berhasil diperbarui!");
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e?.response?.data?.message || "Gagal memperbarui toko");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama toko wajib diisi");
      return;
    }
    if (store) update.mutate();
    else create.mutate();
  };

  if (isLoading) return <p className="text-center text-gray-400 py-12">Memuat...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Toko Saya</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {store ? "Kelola informasi toko." : "Buat toko untuk mulai jualan."}
        </p>
      </div>

      {store && (
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-100 flex items-center justify-center mb-3">
              <Package className="w-4 h-4 text-cyan-600" />
            </div>
            <p className="text-xs text-gray-500">Total Produk</p>
            <p className="text-xl font-bold text-gray-800">{store._count.products}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
              <ClipboardList className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500">Total Pesanan</p>
            <p className="text-xl font-bold text-gray-800">{store._count.orders}</p>
          </motion.div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5"
      >
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-orange-500" />
          <h2 className="font-bold text-gray-800">{store ? "Informasi Toko" : "Buat Toko Baru"}</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Toko</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mis. Bahari Sentosa"
            required
            maxLength={100}
            className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 bg-white transition"
          />
          <p className="text-xs text-gray-400 mt-1">Nama toko harus unik. Tidak boleh sama dengan toko lain di Seapedia.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi Toko</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ceritakan tentang toko Anda..."
            rows={4}
            className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 bg-white transition resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={create.isPending || update.isPending}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-xl transition shadow-lg shadow-orange-500/25 text-sm flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> {store ? "Simpan Perubahan" : "Buat Toko"}
        </button>
      </form>
    </div>
  );
}
