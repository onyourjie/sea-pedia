"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, Star, ChevronLeft, ChevronRight, Waves } from "lucide-react";
import api from "@/lib/api";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  store?: { name: string };
  discount?: number;
}

interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

const CATEGORIES = [
  { label: "Semua", value: "" },
  { label: "Ikan Segar", value: "ikan" },
  { label: "Alat Pancing", value: "pancing" },
  { label: "Kapal & Boat", value: "kapal" },
  { label: "Suku Cadang", value: "suku-cadang" },
  { label: "Navigasi", value: "navigasi" },
  { label: "Keselamatan", value: "keselamatan" },
];

const SORTS = [
  { label: "Terbaru", value: "newest" },
  { label: "Harga Terendah", value: "price_asc" },
  { label: "Harga Tertinggi", value: "price_desc" },
  { label: "Terlaris", value: "bestseller" },
];

function ProductCard({ product }: { product: Product }) {
  const discountedPrice = product.discount ? product.price * (1 - product.discount / 100) : null;

  return (
    <motion.div whileHover={{ y: -3 }} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <img
            src={product.imageUrl || "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
          {product.discount && (
            <span className="absolute top-2 left-2 text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
              {product.discount}% OFF
            </span>
          )}
          {product.stock < 10 && product.stock > 0 && (
            <span className="absolute top-2 right-2 text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
              Stok Terbatas
            </span>
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
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-500">4.9</span>
            <span className="text-gray-300 text-xs">·</span>
            <span className="text-xs text-gray-400 truncate">{product.store?.name}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: ["products", search, sort, page],
    queryFn: () =>
      api.get(`/products?page=${page}&limit=${limit}${search ? `&search=${search}` : ""}`).then((r) => r.data),
  });

  const products = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-cyan-500 font-bold text-lg shrink-0">
            <Waves className="w-5 h-5" />
            SEAPEDIA
          </Link>
          <form onSubmit={handleSearch} className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari produk maritim..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 bg-gray-50"
            />
          </form>
          <div className="flex items-center gap-2 ml-auto">
            <Link href="/login" className="text-sm text-gray-600 hover:text-cyan-500 font-medium px-3 py-1.5">Masuk</Link>
            <Link href="/register" className="text-sm bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-4 py-1.5 rounded-full transition">Daftar</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar filter */}
        <aside className="w-56 shrink-0 hidden md:block">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-cyan-500" /> Filter
              </h3>
              <button
                onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
                className="text-xs text-cyan-500 hover:text-cyan-600 font-medium"
              >
                Reset
              </button>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Kategori</p>
              <ul className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <li key={cat.value}>
                    <button
                      onClick={() => { setSearch(cat.value); setPage(1); }}
                      className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition ${search === cat.value ? "bg-cyan-50 text-cyan-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      {cat.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Harga</p>
              <div className="space-y-2">
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-gray-500">Rp</span>
                  <input type="number" placeholder="0" className="w-full text-xs outline-none bg-transparent" />
                </div>
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-gray-500">Rp</span>
                  <input type="number" placeholder="10.000.000" className="w-full text-xs outline-none bg-transparent" />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <nav className="text-xs text-gray-400 mb-3 flex items-center gap-1">
            <Link href="/" className="hover:text-cyan-500">Beranda</Link>
            <span>/</span>
            <span className="text-gray-600">Produk</span>
            {search && (
              <>
                <span>/</span>
                <span className="text-gray-600 capitalize">{search}</span>
              </>
            )}
          </nav>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{search ? `Hasil: "${search}"` : "Semua Produk"}</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {isLoading ? "Memuat..." : `Menampilkan ${products.length} dari ${total} produk`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 hidden sm:block">Urutkan:</span>
              <div className="flex gap-1">
                {SORTS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSort(s.value)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${sort === s.value ? "bg-cyan-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition ${page === p ? "bg-cyan-500 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-1.5 text-cyan-500 font-bold mb-3">
              <Waves className="w-4 h-4" /> SEAPEDIA
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">Marketplace kelautan terbesar di Indonesia.</p>
          </div>
          {[
            { title: "Layanan Pelanggan", links: ["Bantuan", "Cara Pembelian", "Lacak Pesanan", "Pengembalian"] },
            { title: "Jelajahi SEAPEDIA", links: ["Tentang Kami", "Karir", "Blog Kelautan", "Kontak Media"] },
            { title: "Keamanan & Privasi", links: ["Syarat Layanan", "Kebijakan Privasi"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-gray-700 mb-3 text-xs uppercase tracking-wider">{col.title}</h4>
              <ul className="space-y-1.5">
                {col.links.map((l) => (
                  <li key={l}><a href="#" className="text-xs text-gray-400 hover:text-cyan-500 transition">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
          © 2026 SEAPEDIA. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
