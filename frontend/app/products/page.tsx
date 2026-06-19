"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Star, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

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
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(1);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const limit = 12;

  const promoParam = searchParams.get("promo") || "";

  useEffect(() => {
    const s = searchParams.get("search") || "";
    const so = searchParams.get("sort") || "newest";
    setSearch(s);
    setSearchInput(s);
    setSort(so);
    setPage(1);
  }, [searchParams]);

  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: ["products", search, sort, page, minPrice, maxPrice, promoParam],
    queryFn: () => {
      let url = `/products?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (sort) url += `&sort=${sort}`;
      if (minPrice) url += `&minPrice=${minPrice}`;
      if (maxPrice) url += `&maxPrice=${maxPrice}`;
      if (promoParam) url += `&promo=1`;
      return api.get(url).then((r) => r.data);
    },
  });

  const products = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const applyPriceFilter = () => {
    setMinPrice(minPriceInput);
    setMaxPrice(maxPriceInput);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setSearchInput("");
    setMinPrice("");
    setMaxPrice("");
    setMinPriceInput("");
    setMaxPriceInput("");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar filter */}
        <aside className="w-56 shrink-0 hidden md:block">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-cyan-500" /> Filter
              </h3>
              <button
                onClick={resetFilters}
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
                  <span className="text-xs text-gray-500">Min</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    className="w-full text-xs outline-none bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-gray-500">Max</span>
                  <input
                    type="number"
                    placeholder="10.000.000"
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    className="w-full text-xs outline-none bg-transparent"
                  />
                </div>
                <button
                  onClick={applyPriceFilter}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold py-2 rounded-lg transition"
                >
                  Terapkan Filter
                </button>
                {(minPrice || maxPrice) && (
                  <p className="text-[10px] text-cyan-600 text-center">
                    Filter aktif: {minPrice ? `Rp ${Number(minPrice).toLocaleString("id-ID")}` : "0"} – {maxPrice ? `Rp ${Number(maxPrice).toLocaleString("id-ID")}` : "∞"}
                  </p>
                )}
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

          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{search ? `Hasil: "${search}"` : "Semua Produk"}</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {isLoading ? "Memuat..." : `Menampilkan ${products.length} dari ${total} produk`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <form onSubmit={handleSearch} className="flex items-center border border-gray-200 rounded-full px-3 py-1.5 bg-white gap-2 hover:border-cyan-300 transition">
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari produk..."
                  className="text-xs outline-none bg-transparent w-32"
                />
                <button type="submit" className="text-xs text-cyan-500 font-semibold">Cari</button>
              </form>
              <span className="text-xs text-gray-500 hidden sm:block">Urutkan:</span>
              <div className="flex gap-1 flex-wrap">
                {SORTS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { setSort(s.value); setPage(1); }}
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

      <Footer />
    </div>
  );
}
