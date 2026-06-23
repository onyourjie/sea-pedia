"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  Star,
  ChevronLeft,
  ChevronRight,
  Tag,
  Gift,
  Copy,
  Check,
} from "lucide-react";
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
  ratingAverage?: number;
  reviewCount?: number;
}

interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

interface Offer {
  id: string;
  code: string;
  description?: string;
  discountAmount?: string | number | null;
  discountPct?: string | number | null;
  maxDiscount?: string | number | null;
  minOrder?: string | number | null;
  usageLimit: number;
  usageCount: number;
  expiresAt: string;
  type: "voucher" | "promo";
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
    <motion.div whileHover={{ y: -3 }} className="group h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden">
      <Link href={`/products/${product.id}`} className="flex h-full flex-col">
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <img
            src={product.imageUrl || "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            onError={(e) => {
              const image = e.currentTarget;
              image.onerror = null;
              image.src = "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80";
            }}
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
        <div className="flex flex-1 flex-col p-3">
          <p className="min-h-10 text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-1.5">{product.name}</p>
          {discountedPrice ? (
            <div className="min-h-11">
              <p className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</p>
              <p className="text-base font-bold text-cyan-600">{formatPrice(discountedPrice)}</p>
            </div>
          ) : (
            <div className="min-h-11 flex items-end">
              <p className="text-base font-bold text-cyan-600">{formatPrice(product.price)}</p>
            </div>
          )}
          <div className="flex items-center gap-1 mt-auto pt-1.5">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-500">
              {product.ratingAverage && product.ratingAverage > 0 ? product.ratingAverage.toFixed(1) : "Baru"}
            </span>
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

function OfferCard({
  offer,
  copied,
  onCopy,
}: {
  offer: Offer;
  copied: boolean;
  onCopy: (code: string) => void;
}) {
  const isVoucher = offer.type === "voucher";
  const Icon = isVoucher ? Tag : Gift;
  const accent = isVoucher ? "text-purple-600" : "text-orange-500";
  const softBackground = isVoucher ? "bg-purple-50" : "bg-orange-50";
  const button = isVoucher
    ? "bg-purple-600 hover:bg-purple-700"
    : "bg-orange-500 hover:bg-orange-600";

  return (
    <motion.article
      whileHover={{ y: -3 }}
      className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full ${softBackground}`} />
      <div className="relative flex h-full flex-col">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${softBackground}`}>
              <Icon className={`h-5 w-5 ${accent}`} />
            </div>
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${accent}`}>
                {isVoucher ? "Voucher" : "Promo"}
              </span>
              <h2 className="font-mono text-lg font-bold text-gray-800">{offer.code}</h2>
            </div>
          </div>
        </div>

        <p className="mb-4 min-h-10 text-sm leading-relaxed text-gray-600">
          {offer.description || "Gunakan kode ini saat checkout untuk mendapatkan potongan harga."}
        </p>

        <div className="mb-5 space-y-1.5 text-xs text-gray-500">
          <p>
            Diskon:{" "}
            <strong className="text-gray-700">
              {offer.discountPct
                ? `${Number(offer.discountPct)}%`
                : offer.discountAmount
                  ? formatPrice(Number(offer.discountAmount))
                  : "-"}
            </strong>
            {offer.maxDiscount ? ` (maks. ${formatPrice(Number(offer.maxDiscount))})` : ""}
          </p>
          {offer.minOrder && Number(offer.minOrder) > 0 ? (
            <p>Minimum belanja: {formatPrice(Number(offer.minOrder))}</p>
          ) : (
            <p>Tanpa minimum belanja</p>
          )}
          <p>
            Berlaku sampai{" "}
            {new Date(offer.expiresAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onCopy(offer.code)}
          className={`mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition ${button}`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Kode Tersalin" : "Salin Kode"}
        </button>
      </div>
    </motion.article>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-cyan-50/30 via-white to-orange-50/20" />}>
      <ProductsPageInner />
    </Suspense>
  );
}

function ProductsPageInner() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(1);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const limit = 12;

  const isOffersPage = searchParams.get("promo") === "1";
  const isDealsPage = searchParams.get("deals") === "1";

  useEffect(() => {
    const s = searchParams.get("search") || "";
    const so = searchParams.get("sort") || "newest";
    setSearch(s);
    setSearchInput(s);
    setSort(so);
    setPage(1);
  }, [searchParams]);

  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: ["products", search, sort, page, minPrice, maxPrice, isDealsPage],
    queryFn: () => {
      let url = `/products?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (sort) url += `&sort=${sort}`;
      if (minPrice) url += `&minPrice=${minPrice}`;
      if (maxPrice) url += `&maxPrice=${maxPrice}`;
      if (isDealsPage) url += `&promo=1`;
      return api.get(url).then((r) => r.data);
    },
    enabled: !isOffersPage,
  });

  const { data: offers = [], isLoading: offersLoading } = useQuery<Offer[]>({
    queryKey: ["public-vouchers-promos"],
    queryFn: async () => {
      const [voucherResponse, promoResponse] = await Promise.all([
        api.get("/vouchers"),
        api.get("/promos"),
      ]);
      const vouchers = (Array.isArray(voucherResponse.data) ? voucherResponse.data : []).map(
        (voucher) => ({ ...voucher, type: "voucher" as const }),
      );
      const promos = (Array.isArray(promoResponse.data) ? promoResponse.data : []).map(
        (promo) => ({ ...promo, type: "promo" as const }),
      );
      const now = Date.now();

      return [...vouchers, ...promos]
        .filter((offer) => {
          const hasQuota = offer.usageLimit === 0 || offer.usageCount < offer.usageLimit;
          return new Date(offer.expiresAt).getTime() >= now && hasQuota;
        })
        .sort(
          (a, b) =>
            new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
        );
    },
    enabled: isOffersPage,
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

  const copyOfferCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(""), 1800);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar filter */}
        {!isOffersPage && <aside className="w-56 shrink-0 hidden md:block">
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
        </aside>}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <nav className="text-xs text-gray-400 mb-3 flex items-center gap-1">
            <Link href="/" className="hover:text-cyan-500">Beranda</Link>
            <span>/</span>
            <span className="text-gray-600">{isOffersPage ? "Voucher & Promo" : "Produk"}</span>
            {!isOffersPage && search && (
              <>
                <span>/</span>
                <span className="text-gray-600 capitalize">{search}</span>
              </>
            )}
          </nav>

          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {isOffersPage
                  ? "Voucher & Promo"
                  : search
                    ? `Hasil: "${search}"`
                    : isDealsPage
                      ? "Hot Deals"
                      : "Semua Produk"}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {isOffersPage
                  ? offersLoading
                    ? "Memuat..."
                    : `${offers.length} penawaran aktif dari admin`
                  : isLoading
                    ? "Memuat..."
                    : `Menampilkan ${products.length} dari ${total} produk`}
              </p>
            </div>
            {!isOffersPage && <div className="flex items-center gap-2 flex-wrap">
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
            </div>}
          </div>

          {isOffersPage ? (
            offersLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-72 animate-pulse rounded-2xl border border-gray-100 bg-white" />
                ))}
              </div>
            ) : offers.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">
                <Gift className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <h2 className="font-semibold text-gray-700">Belum ada voucher atau promo aktif</h2>
                <p className="mt-1 text-sm text-gray-400">Cek kembali nanti untuk penawaran terbaru.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {offers.map((offer, i) => (
                  <motion.div
                    key={`${offer.type}-${offer.id}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="h-full"
                  >
                    <OfferCard
                      offer={offer}
                      copied={copiedCode === offer.code}
                      onCopy={copyOfferCode}
                    />
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : products.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="h-full"
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
            </div>
          )}

          {/* Pagination */}
          {!isOffersPage && totalPages > 1 && (
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
