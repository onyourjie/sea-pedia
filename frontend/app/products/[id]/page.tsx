"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, ShoppingCart, Zap, Shield, ChevronRight, Heart, Share2, Minus, Plus } from "lucide-react";
import Swal from "sweetalert2";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Navbar } from "@/components/layout/navbar";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
  imageUrl?: string;
  discount?: number;
  store?: { id: string; name: string; city?: string };
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

const TABS = ["Deskripsi Produk", "Spesifikasi", "Ulasan Produk"];

const FAVORITES_KEY = "seapedia_favorites";

function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"); } catch { return []; }
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [isFavorite, setIsFavorite] = useState(() => getFavorites().includes(id as string));

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["product", id],
    queryFn: () => api.get(`/products/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: storeProducts } = useQuery<{ data: Product[] }>({
    queryKey: ["store-products", product?.store?.id],
    queryFn: () => api.get(`/products?storeId=${product?.store?.id}&limit=6`).then((r) => r.data),
    enabled: !!product?.store?.id,
  });

  const relatedProducts = storeProducts?.data?.filter((p) => p.id !== id).slice(0, 5) || [];
  const discountedPrice = product?.discount ? product.price * (1 - product.discount / 100) : null;

  const toggleFavorite = () => {
    const favs = getFavorites();
    const productId = id as string;
    let updated: string[];
    if (favs.includes(productId)) {
      updated = favs.filter((f) => f !== productId);
      setIsFavorite(false);
      Swal.fire({ title: "Dihapus dari Favorit", icon: "info", timer: 1200, showConfirmButton: false, toast: true, position: "top-end" });
    } else {
      updated = [...favs, productId];
      setIsFavorite(true);
      Swal.fire({ title: "Ditambahkan ke Favorit!", icon: "success", timer: 1200, showConfirmButton: false, toast: true, position: "top-end" });
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  };

  const addToCart = useMutation({
    mutationFn: () => api.post("/cart/items", { productId: id, quantity: qty }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      Swal.fire({ title: "Berhasil!", text: `${product?.name} ditambahkan ke keranjang!`, icon: "success", timer: 1500, showConfirmButton: false, toast: true, position: "top-end" });
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Swal.fire({ title: "Gagal", text: e?.response?.data?.message || "Gagal menambah ke keranjang", icon: "error", confirmButtonColor: "#ef4444" });
    },
  });

  const handleAddToCart = () => {
    if (!token) {
      Swal.fire({ title: "Belum Login", text: "Silakan login terlebih dahulu", icon: "warning", confirmButtonColor: "#06b6d4" }).then(() => router.push("/login"));
      return;
    }
    if (user?.activeRole !== "BUYER") {
      Swal.fire({ title: "Akses Ditolak", text: "Hanya pembeli yang bisa menambah ke keranjang", icon: "warning", confirmButtonColor: "#06b6d4" });
      return;
    }
    addToCart.mutate();
  };

  const handleBuyNow = () => {
    if (!token) {
      Swal.fire({ title: "Belum Login", text: "Silakan login terlebih dahulu", icon: "warning", confirmButtonColor: "#06b6d4" }).then(() => router.push("/login"));
      return;
    }
    if (user?.activeRole !== "BUYER") {
      Swal.fire({ title: "Akses Ditolak", text: "Hanya pembeli yang bisa membeli produk", icon: "warning", confirmButtonColor: "#06b6d4" });
      return;
    }
    addToCart.mutate(undefined, {
      onSuccess: () => {
        router.push("/dashboard/buyer/checkout");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
            <p className="text-sm text-gray-400">Memuat produk...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 mb-3">Produk tidak ditemukan</p>
            <Link href="/products" className="text-cyan-500 hover:underline text-sm">Kembali ke produk</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1 flex-wrap">
          <Link href="/" className="hover:text-cyan-500">Beranda</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/products" className="hover:text-cyan-500">Produk</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-600 line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Left: image */}
          <div>
            <div className="relative rounded-xl overflow-hidden aspect-square bg-gray-50 group">
              <img
                src={product.imageUrl || "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80"}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80"; }}
              />
              <button className="absolute top-3 right-12 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition">
                <Share2 className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={toggleFavorite}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition"
              >
                <Heart className={`w-4 h-4 transition ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-500 hover:text-red-500"}`} />
              </button>
            </div>
          </div>

          {/* Right: info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                ))}
                <span className="text-xs text-gray-500 ml-1">4.9 (124 Ulasan)</span>
              </div>
            </div>

            <h1 className="text-xl font-bold text-gray-800 leading-snug mb-3">{product.name}</h1>

            <div className="mb-3">
              {discountedPrice ? (
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-cyan-600">{formatPrice(discountedPrice)}</span>
                  <span className="text-base text-gray-400 line-through">{formatPrice(product.price)}</span>
                  <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                    Hemat {product.discount}%
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-cyan-600">{formatPrice(product.price)}</span>
              )}
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-cyan-600">
                <Shield className="w-3.5 h-3.5" />
                Bebas ongkir ke seluruh Indonesia
              </div>
            </div>

            {/* Qty */}
            <div className="flex items-center gap-4 mb-5">
              <span className="text-sm text-gray-600">Jumlah</span>
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-2 py-1">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-gray-400">Stok tersedia: {product.stock}</span>
            </div>

            {/* CTA */}
            <div className="flex gap-3 mb-5">
              <button
                onClick={handleAddToCart}
                disabled={addToCart.isPending || product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 disabled:opacity-60 font-semibold py-3 rounded-xl text-sm transition"
              >
                <ShoppingCart className="w-4 h-4" />
                {addToCart.isPending ? "Menambahkan..." : "Tambah ke Keranjang"}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={addToCart.isPending || product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition shadow-lg shadow-orange-500/25"
              >
                <Zap className="w-4 h-4" />
                Beli Sekarang
              </button>
            </div>

            {/* Store */}
            {product.store && (
              <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {product.store.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-800">{product.store.name}</p>
                      <span className="text-[10px] bg-cyan-100 text-cyan-600 font-semibold px-1.5 py-0.5 rounded-full">Official Store</span>
                    </div>
                    <p className="text-xs text-gray-400">4.9 (25rb Penjualan) · {product.store.city || "Indonesia"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-white transition">Chat</button>
                  <Link
                    href={`/stores/${product.store.id}`}
                    className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-white transition"
                  >
                    Kunjungi Toko
                  </Link>
                </div>
              </div>
            )}

            {/* Trust badges */}
            <div className="flex gap-4 mt-4">
              {["100% Original", "Garansi SEAPEDIA"].map((badge) => (
                <div key={badge} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Shield className="w-3.5 h-3.5 text-cyan-500" />
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-4 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`px-6 py-4 text-sm font-medium transition border-b-2 ${activeTab === i ? "border-cyan-500 text-cyan-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === 0 && (
              <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                {product.description || "Tidak ada deskripsi produk."}
              </div>
            )}
            {activeTab === 1 && <div className="text-sm text-gray-500">Informasi spesifikasi belum tersedia.</div>}
            {activeTab === 2 && <div className="text-sm text-gray-500">Belum ada ulasan untuk produk ini.</div>}
          </div>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Produk Lain dari Toko Ini</h2>
              {product.store && (
                <Link href={`/stores/${product.store.id}`} className="text-sm text-cyan-500 hover:text-cyan-600 flex items-center gap-1">
                  Lihat Semua <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {relatedProducts.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -3 }}
                >
                  <Link href={`/products/${p.id}`} className="block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
                    <div className="aspect-square bg-gray-50 overflow-hidden">
                      <img
                        src={p.imageUrl || "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&q=80"}
                        alt={p.name}
                        className="w-full h-full object-cover hover:scale-105 transition duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&q=80"; }}
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs text-gray-700 font-medium line-clamp-2 mb-1">{p.name}</p>
                      <p className="text-sm font-bold text-cyan-600">{formatPrice(p.price)}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
