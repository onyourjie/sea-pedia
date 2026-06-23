"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, ShoppingCart, Zap, ChevronRight, ChevronLeft, Heart, Share2, Minus, Plus } from "lucide-react";
import Swal from "sweetalert2";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Navbar } from "@/components/layout/navbar";
import { DiceBearAvatar } from "@/components/ui/dicebear-avatar";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  discount?: number;
  specifications?: Record<string, string> | null;
  ratingAverage?: number;
  reviewCount?: number;
  store?: { id: string; name: string; city?: string };
}

interface ProductReview {
  id: string;
  rating: number;
  comment: string;
  reviewerName: string;
  createdAt: string;
}

interface ProductReviewsResponse {
  data: ProductReview[];
  total: number;
  averageRating: number;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

const TABS = ["Deskripsi Produk", "Spesifikasi", "Ulasan Produk"] as const;

const FAVORITES_KEY = "seapedia_favorites";
const FAVORITES_CHANGED_EVENT = "seapedia:favorites-changed";
const FALLBACK = "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80";

function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"); } catch { return []; }
}

function StarRating({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const dim = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  const rounded = Math.round(value);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${dim} ${i < rounded ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [imageIdx, setImageIdx] = useState(0);
  const [isFavorite, setIsFavorite] = useState(() => getFavorites().includes(id as string));

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["product", id],
    queryFn: () => api.get(`/products/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: reviews } = useQuery<ProductReviewsResponse>({
    queryKey: ["product-reviews", id],
    queryFn: () => api.get(`/products/${id}/reviews?limit=20`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: storeProducts } = useQuery<{ data: Product[] }>({
    queryKey: ["store-products", product?.store?.id],
    queryFn: () => api.get(`/products?storeId=${product?.store?.id}&limit=6`).then((r) => r.data),
    enabled: !!product?.store?.id,
  });

  const galleryImages = useMemo(() => {
    if (!product) return [] as string[];
    const list: string[] = [];
    if (product.imageUrl) list.push(product.imageUrl);
    if (product.imageUrls?.length) list.push(...product.imageUrls.filter(Boolean));
    return list.length > 0 ? Array.from(new Set(list)) : [FALLBACK];
  }, [product]);

  const safeIdx = Math.min(imageIdx, galleryImages.length - 1);
  const relatedProducts = storeProducts?.data?.filter((p) => p.id !== id).slice(0, 5) || [];
  const discountedPrice = product?.discount ? product.price * (1 - product.discount / 100) : null;
  const ratingAvg = product?.ratingAverage ?? 0;
  const reviewCount = product?.reviewCount ?? 0;

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
    window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
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

  const showPrev = () => setImageIdx((i) => (i - 1 + galleryImages.length) % galleryImages.length);
  const showNext = () => setImageIdx((i) => (i + 1) % galleryImages.length);

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

  const specEntries: [string, string][] = product.specifications && typeof product.specifications === "object"
    ? Object.entries(product.specifications)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1 flex-wrap">
          <Link href="/" className="hover:text-cyan-500">Beranda</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/products" className="hover:text-cyan-500">Produk</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-600 line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div>
            <div className="relative rounded-xl overflow-hidden aspect-square bg-gray-50 group">
              <img
                src={galleryImages[safeIdx] || FALLBACK}
                alt={product.name}
                className="w-full h-full object-cover transition duration-500"
                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
              />
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrev}
                    aria-label="Gambar sebelumnya"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 shadow flex items-center justify-center hover:bg-white transition opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    aria-label="Gambar berikutnya"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 shadow flex items-center justify-center hover:bg-white transition opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-white/80 backdrop-blur px-2 py-1 rounded-full">
                    {galleryImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImageIdx(i)}
                        aria-label={`Gambar ${i + 1}`}
                        className={`h-1.5 rounded-full transition ${i === safeIdx ? "w-5 bg-cyan-500" : "w-1.5 bg-gray-300"}`}
                      />
                    ))}
                  </div>
                </>
              )}
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

            {galleryImages.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {galleryImages.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIdx(i)}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${i === safeIdx ? "border-cyan-500" : "border-transparent opacity-70 hover:opacity-100"}`}
                  >
                    <img
                      src={src}
                      alt={`thumb-${i}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <StarRating value={ratingAvg} />
              <span className="text-xs text-gray-500 ml-1">
                {ratingAvg ? ratingAvg.toFixed(1) : "Belum ada"} ({reviewCount} Ulasan)
              </span>
            </div>

            <h1 className="text-xl font-bold text-gray-800 leading-snug mb-3">{product.name}</h1>

            <div className="mb-3">
              {discountedPrice ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-3xl font-bold text-cyan-600">{formatPrice(discountedPrice)}</span>
                  <span className="text-base text-gray-400 line-through">{formatPrice(product.price)}</span>
                  <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                    Hemat {product.discount}%
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-cyan-600">{formatPrice(product.price)}</span>
              )}
            </div>

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

            {product.store && (
              <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <DiceBearAvatar seed={product.store.name} type="store" className="h-9 w-9 ring-2 ring-cyan-100" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{product.store.name}</p>
                    <p className="text-xs text-gray-400">{product.store.city || "Indonesia"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/stores/${product.store.id}`}
                    className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-white transition"
                  >
                    Kunjungi Toko
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-4 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`px-6 py-4 text-sm font-medium transition border-b-2 ${activeTab === i ? "border-cyan-500 text-cyan-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                {tab}
                {tab === "Ulasan Produk" && reviews?.total ? (
                  <span className="ml-1.5 text-xs text-gray-400">({reviews.total})</span>
                ) : null}
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === 0 && (
              <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description || "Tidak ada deskripsi produk."}
              </div>
            )}
            {activeTab === 1 && (
              specEntries.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  {specEntries.map(([k, v]) => (
                    <div key={k} className="flex border-b border-gray-50 py-2">
                      <span className="w-1/3 text-gray-500">{k}</span>
                      <span className="flex-1 text-gray-800 font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Spesifikasi belum ditambahkan oleh penjual.</div>
              )
            )}
            {activeTab === 2 && (
              !reviews || reviews.total === 0 ? (
                <div className="text-sm text-gray-500">Belum ada ulasan untuk produk ini.</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    <div className="text-3xl font-bold text-gray-800">{reviews.averageRating.toFixed(1)}</div>
                    <div>
                      <StarRating value={reviews.averageRating} size="md" />
                      <p className="text-xs text-gray-500 mt-0.5">{reviews.total} ulasan</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {reviews.data.map((r) => (
                      <div key={r.id} className="border-b border-gray-50 pb-3 last:border-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm text-gray-800">{r.reviewerName}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(r.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <StarRating value={r.rating} />
                        <p className="text-sm text-gray-600 mt-1.5">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

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
                  className="h-full"
                >
                  <Link href={`/products/${p.id}`} className="flex h-full flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
                    <div className="aspect-square bg-gray-50 overflow-hidden">
                      <img
                        src={p.imageUrl || FALLBACK}
                        alt={p.name}
                        className="w-full h-full object-cover hover:scale-105 transition duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-2.5">
                      <p className="mb-1 min-h-8 line-clamp-2 text-xs font-medium leading-4 text-gray-700">{p.name}</p>
                      <p className="mt-auto text-sm font-bold text-cyan-600">{formatPrice(p.price)}</p>
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
