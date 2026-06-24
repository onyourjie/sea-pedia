"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Package, Plus, Pencil, Trash2, X, Image as ImageIcon, Eye } from "lucide-react";
import Swal from "sweetalert2";
import api from "@/lib/api";
import { SkeletonTable } from "@/components/ui/skeleton";

interface SpecItem { key: string; value: string; }

interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  stock: number;
  imageUrl?: string;
  imageUrls?: string[];
  discount?: number;
  specifications?: Record<string, string> | null;
  isActive: boolean;
}

interface FormState {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  imageUrls: string[];
  discount: number;
  specifications: SpecItem[];
}

const empty: FormState = {
  name: "",
  description: "",
  price: 0,
  stock: 0,
  imageUrl: "",
  imageUrls: [],
  discount: 0,
  specifications: [{ key: "", value: "" }],
};

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

function specsToList(specs: Record<string, string> | null | undefined): SpecItem[] {
  if (!specs || typeof specs !== "object") return [{ key: "", value: "" }];
  const list = Object.entries(specs).map(([key, value]) => ({ key, value: String(value) }));
  return list.length > 0 ? list : [{ key: "", value: "" }];
}

function buildPayload(form: FormState) {
  const specs: Record<string, string> = {};
  for (const { key, value } of form.specifications) {
    const k = key.trim();
    const v = value.trim();
    if (k) specs[k] = v;
  }
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    price: form.price,
    stock: form.stock,
    imageUrl: form.imageUrl.trim() || undefined,
    imageUrls: form.imageUrls.map((u) => u.trim()).filter(Boolean),
    discount: form.discount,
    specifications: Object.keys(specs).length > 0 ? specs : undefined,
  };
}

export default function SellerProductsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const { data, isLoading } = useQuery<Product[]>({
    queryKey: ["seller-products"],
    queryFn: () => api.get("/products/seller/list").then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: (dto: FormState) => api.post("/products/seller", buildPayload(dto)).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller-products"] });
      qc.invalidateQueries({ queryKey: ["seller-my-store"] });
      Swal.fire({ title: "Berhasil!", text: "Produk berhasil ditambahkan.", icon: "success", timer: 1500, showConfirmButton: false });
      reset();
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Swal.fire({ title: "Gagal", text: e?.response?.data?.message || "Gagal menambah produk", icon: "error", confirmButtonColor: "#ef4444" });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: FormState }) =>
      api.patch(`/products/seller/${id}`, buildPayload(dto)).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller-products"] });
      Swal.fire({ title: "Berhasil!", text: "Produk diperbarui.", icon: "success", timer: 1500, showConfirmButton: false });
      reset();
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Swal.fire({ title: "Gagal", text: e?.response?.data?.message || "Gagal memperbarui produk", icon: "error", confirmButtonColor: "#ef4444" });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/products/seller/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller-products"] });
      qc.invalidateQueries({ queryKey: ["seller-my-store"] });
      Swal.fire({ title: "Terhapus!", text: "Produk berhasil dihapus.", icon: "success", timer: 1500, showConfirmButton: false });
    },
    onError: () => Swal.fire({ title: "Gagal", text: "Gagal menghapus produk.", icon: "error" }),
  });

  const reset = () => {
    setForm(empty);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (p: Product) => {
    setForm({
      name: p.name,
      description: p.description || "",
      price: Number(p.price),
      stock: p.stock,
      imageUrl: p.imageUrl || "",
      imageUrls: p.imageUrls || [],
      discount: p.discount || 0,
      specifications: specsToList(p.specifications),
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.price <= 0) {
      Swal.fire({ title: "Input Tidak Lengkap", text: "Nama produk dan harga wajib diisi.", icon: "warning", confirmButtonColor: "#f97316" });
      return;
    }
    if (editingId) update.mutate({ id: editingId, dto: form });
    else create.mutate(form);
  };

  const products = data || [];

  const updateImageUrl = (idx: number, value: string) => {
    setForm((f) => {
      const next = [...f.imageUrls];
      next[idx] = value;
      return { ...f, imageUrls: next };
    });
  };

  const addImageUrl = () => {
    if (form.imageUrls.length >= 8) return;
    setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, ""] }));
  };

  const removeImageUrl = (idx: number) => {
    setForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((_, i) => i !== idx) }));
  };

  const updateSpec = (idx: number, field: "key" | "value", value: string) => {
    setForm((f) => {
      const next = [...f.specifications];
      next[idx] = { ...next[idx], [field]: value };
      return { ...f, specifications: next };
    });
  };

  const addSpec = () => {
    setForm((f) => ({ ...f, specifications: [...f.specifications, { key: "", value: "" }] }));
  };

  const removeSpec = (idx: number) => {
    setForm((f) => {
      const next = f.specifications.filter((_, i) => i !== idx);
      return { ...f, specifications: next.length === 0 ? [{ key: "", value: "" }] : next };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-800">Produk</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} produk terdaftar</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-3 sm:px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" /> <span className="hidden sm:inline">Tambah Produk</span><span className="sm:hidden">Tambah</span>
          </button>
        )}
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800">{editingId ? "Edit Produk" : "Produk Baru"}</h2>
            <button type="button" onClick={reset} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Nama Produk</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                maxLength={200}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Harga (IDR)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                min={0}
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Stok</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                min={0}
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Diskon (%) <span className="text-gray-400 font-normal">— produk dengan diskon &gt; 0 muncul di Hot Deals</span>
              </label>
              <input
                type="number"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                min={0}
                max={90}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Gambar Utama (URL)</label>
              <input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Deskripsi</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 resize-none"
              />
            </div>
          </div>

          {/* Multi-image */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Gambar Tambahan ({form.imageUrls.length}/8)
              </label>
              <button
                type="button"
                onClick={addImageUrl}
                disabled={form.imageUrls.length >= 8}
                className="text-xs text-orange-500 hover:text-orange-600 font-semibold disabled:opacity-40 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Tambah Gambar
              </button>
            </div>
            <div className="space-y-2">
              {form.imageUrls.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    value={url}
                    onChange={(e) => updateImageUrl(idx, e.target.value)}
                    placeholder={`Gambar ke-${idx + 2} (URL)`}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeImageUrl(idx)}
                    className="text-gray-400 hover:text-red-500 p-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {form.imageUrls.length === 0 && (
                <p className="text-xs text-gray-400 italic">Belum ada gambar tambahan. Carousel di halaman detail butuh minimal 2 gambar.</p>
              )}
            </div>
          </div>

          {/* Spesifikasi */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700">Spesifikasi Produk</label>
              <button
                type="button"
                onClick={addSpec}
                className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Tambah Baris
              </button>
            </div>
            <div className="space-y-2">
              {form.specifications.map((spec, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-[11rem_minmax(0,1fr)_auto] gap-2">
                  <input
                    value={spec.key}
                    onChange={(e) => updateSpec(idx, "key", e.target.value)}
                    placeholder="Nama (mis. Berat)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
                  />
                  <input
                    value={spec.value}
                    onChange={(e) => updateSpec(idx, "value", e.target.value)}
                    placeholder="Nilai (mis. 500g)"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpec(idx)}
                    className="text-gray-400 hover:text-red-500 p-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={create.isPending || update.isPending}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
            >
              {editingId ? "Simpan Perubahan" : "Tambah Produk"}
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><SkeletonTable rows={5} /></div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Package className="w-14 h-14 text-orange-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800">Belum ada produk</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">Tambahkan produk pertama untuk mulai jualan dan menerima pesanan.</p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
            >
              <Plus className="w-4 h-4" /> Tambah Produk Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="dashboard-responsive-table">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Produk</th>
                <th className="text-right px-4 py-3 font-semibold">Harga</th>
                <th className="text-right px-4 py-3 font-semibold">Diskon</th>
                <th className="text-right px-4 py-3 font-semibold">Stok</th>
                <th className="text-center px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td data-label="Produk" className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <img
                          src={p.imageUrl || "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=120"}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-gray-400 line-clamp-1">{p.description || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td data-label="Harga" className="px-4 py-3 text-right font-semibold text-cyan-600">{formatPrice(Number(p.price))}</td>
                  <td data-label="Diskon" className="px-4 py-3 text-right">
                    {p.discount && p.discount > 0 ? (
                      <span className="text-xs font-bold text-orange-600">{p.discount}%</span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td data-label="Stok" className="px-4 py-3 text-right">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.stock > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td data-label="Aksi" className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/products/${p.id}`}
                        aria-label={`Lihat detail ${p.name}`}
                        title="Lihat detail produk"
                        className="text-orange-500 hover:text-orange-600 p-1.5 rounded hover:bg-orange-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => startEdit(p)}
                        aria-label={`Edit ${p.name}`}
                        title="Edit produk"
                        className="text-cyan-500 hover:text-cyan-600 p-1.5 rounded hover:bg-cyan-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          const result = await Swal.fire({
                            title: "Hapus Produk?",
                            text: `Hapus produk "${p.name}"?`,
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#ef4444",
                            cancelButtonColor: "#6b7280",
                            confirmButtonText: "Ya, Hapus",
                            cancelButtonText: "Batal",
                          });
                          if (result.isConfirmed) remove.mutate(p.id);
                        }}
                        className="text-red-500 hover:text-red-600 p-1.5 rounded hover:bg-red-50"
                        aria-label={`Hapus ${p.name}`}
                        title="Hapus produk"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
