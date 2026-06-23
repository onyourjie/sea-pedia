"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ShoppingCart, Trash2, Minus, Plus, Store, AlertCircle, ArrowRight, ShoppingBag } from "lucide-react";
import Swal from "sweetalert2";
import api from "@/lib/api";
import { SkeletonList } from "@/components/ui/skeleton";

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: string;
    stock: number;
    imageUrl?: string;
    store: { id: string; name: string };
  };
}

interface Cart {
  id: string;
  storeId: string | null;
  items: CartItem[];
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

export default function CartPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const { data: cart, isLoading } = useQuery<Cart>({
    queryKey: ["cart"],
    queryFn: () => api.get("/cart").then((r) => r.data),
  });

  const updateQty = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      api.patch(`/cart/items/${productId}`, { quantity }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Swal.fire({ title: "Gagal", text: e?.response?.data?.message || "Gagal update kuantitas", icon: "error", confirmButtonColor: "#ef4444" });
    },
  });

  const removeItem = useMutation({
    mutationFn: (productId: string) => api.delete(`/cart/items/${productId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      Swal.fire({ title: "Dihapus!", text: "Item dihapus dari keranjang.", icon: "success", timer: 1200, showConfirmButton: false, toast: true, position: "top-end" });
    },
  });

  const clearCart = useMutation({
    mutationFn: () => api.delete("/cart/clear").then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      Swal.fire({ title: "Keranjang Dikosongkan", icon: "success", timer: 1200, showConfirmButton: false, toast: true, position: "top-end" });
    },
  });

  const handleQty = async (item: CartItem, delta: number) => {
    const next = item.quantity + delta;
    if (next < 1) return;
    if (next > item.product.stock) {
      Swal.fire({ title: "Stok Tidak Cukup", text: `Stok tersedia: ${item.product.stock}`, icon: "warning", confirmButtonColor: "#06b6d4" });
      return;
    }
    setBusy(item.productId);
    await updateQty.mutateAsync({ productId: item.productId, quantity: next });
    setBusy(null);
  };

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  const storeName = items[0]?.product.store.name;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Keranjang Belanja</h1>
          <p className="text-sm text-gray-500 mt-0.5">Periksa pesananmu sebelum lanjut ke checkout.</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => clearCart.mutate()}
            className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Kosongkan
          </button>
        )}
      </div>

      {/* Single-store info banner */}
      <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
        <div className="text-sm text-cyan-800">
          <p className="font-semibold">Aturan Single-Store Checkout</p>
          <p className="text-xs text-cyan-700 mt-0.5">
            Satu keranjang hanya bisa berisi produk dari satu toko. Untuk membeli dari toko lain, kosongkan dulu keranjang.
          </p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <ShoppingCart className="w-14 h-14 text-cyan-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800">Keranjang masih kosong</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">Yuk mulai belanja produk hasil laut terbaik!</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
          >
            <ShoppingBag className="w-4 h-4" /> Telusuri Produk
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            {storeName && (
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Store className="w-4 h-4 text-cyan-500" />
                <p className="text-sm font-semibold text-gray-700">{storeName}</p>
              </div>
            )}
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  <img
                    src={item.product.imageUrl || "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=200"}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 line-clamp-1">{item.product.name}</p>
                  <p className="text-sm text-cyan-600 font-bold mt-1">{formatPrice(Number(item.product.price))}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Stok: {item.product.stock}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQty(item, -1)}
                    disabled={busy === item.productId || item.quantity <= 1}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => handleQty(item, 1)}
                    disabled={busy === item.productId || item.quantity >= item.product.stock}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem.mutate(item.productId)}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit sticky top-20 space-y-4">
            <h2 className="font-bold text-gray-800">Ringkasan</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({items.length} item)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-gray-400">Ongkir, diskon, dan PPN dihitung di checkout.</p>
            </div>
            <button
              onClick={() => router.push("/dashboard/buyer/checkout")}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-cyan-500/25 text-sm flex items-center justify-center gap-2"
            >
              Lanjut ke Checkout <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="/products"
              className="block text-center text-xs text-cyan-500 hover:text-cyan-600 font-medium"
            >
              ← Lanjut Belanja
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
