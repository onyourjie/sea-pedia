"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Heart, ShoppingCart, Trash2, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import api from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const FAVORITES_KEY = "seapedia_favorites";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  discount?: number;
  store?: { id: string; name: string };
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

function getFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"); } catch { return []; }
}

function removeFavorite(id: string) {
  const favs = getFavoriteIds().filter((f) => f !== id);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

export default function WishlistPage() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    setFavoriteIds(getFavoriteIds());
  }, []);

  const { data, isLoading } = useQuery<Product[]>({
    queryKey: ["wishlist-products", favoriteIds.join(",")],
    queryFn: async () => {
      if (favoriteIds.length === 0) return [];
      const results = await Promise.all(
        favoriteIds.map((id) => api.get(`/products/${id}`).then((r) => r.data).catch(() => null))
      );
      return results.filter(Boolean) as Product[];
    },
    enabled: favoriteIds.length > 0,
  });

  const products = data || [];

  const handleRemove = (product: Product) => {
    Swal.fire({
      title: "Hapus dari Favorit?",
      text: `"${product.name}" akan dihapus dari daftar favorit.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        removeFavorite(product.id);
        setFavoriteIds((prev) => prev.filter((id) => id !== product.id));
        Swal.fire({ title: "Dihapus!", icon: "success", timer: 1200, showConfirmButton: false, toast: true, position: "top-end" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-cyan-500 hover:text-cyan-600 font-medium mb-6">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Produk
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <Heart className="w-5 h-5 fill-red-500 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Favorit Saya</h1>
            <p className="text-sm text-gray-500">{favoriteIds.length} produk tersimpan</p>
          </div>
        </div>

        {favoriteIds.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum ada produk favorit</h3>
            <p className="text-sm text-gray-400 mb-6">Tap ikon hati pada produk untuk menyimpannya di sini.</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-6 py-3 rounded-full transition"
            >
              <ShoppingCart className="w-4 h-4" /> Mulai Belanja
            </Link>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: favoriteIds.length }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {products.map((product, i) => {
              const discountedPrice = product.discount ? product.price * (1 - product.discount / 100) : null;
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden relative"
                >
                  <button
                    onClick={() => handleRemove(product)}
                    className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-500" />
                  </button>
                  <Link href={`/products/${product.id}`}>
                    <div className="relative aspect-square bg-gray-50 overflow-hidden">
                      <img
                        src={product.imageUrl || "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80"; }}
                      />
                      {product.discount && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                          {product.discount}% OFF
                        </span>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-xs font-bold text-white bg-black/60 px-3 py-1 rounded-full">Habis</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-1.5">{product.name}</p>
                      {discountedPrice ? (
                        <div>
                          <p className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</p>
                          <p className="text-base font-bold text-cyan-600">{formatPrice(discountedPrice)}</p>
                        </div>
                      ) : (
                        <p className="text-base font-bold text-cyan-600">{formatPrice(product.price)}</p>
                      )}
                      {product.store && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{product.store.name}</p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
