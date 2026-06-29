"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Eye, Package } from "lucide-react";
import api from "@/lib/api";
import { SkeletonTable } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";

const LIMIT = 20;

interface AdminProduct {
  id: string;
  name: string;
  price: string;
  stock: number;
  isActive: boolean;
  imageUrl?: string;
  imageUrls?: string[];
  discount?: number;
  store: { name: string };
}

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ data: AdminProduct[]; total: number }>({
    queryKey: ["admin-products", page],
    queryFn: () => api.get(`/products?page=${page}&limit=${LIMIT}`).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const products = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Produk Marketplace</h1>
        <p className="text-sm text-gray-500 mt-0.5">{data?.total ?? 0} produk terdaftar di seluruh toko.</p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><SkeletonTable rows={6} /></div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Package className="w-14 h-14 text-purple-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800">Belum ada produk di marketplace</h3>
          <p className="text-sm text-gray-500 mt-1">Produk akan muncul setelah Seller membuat produk pertama.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="dashboard-responsive-table">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Produk</th>
                <th className="text-left px-4 py-3 font-semibold">Toko</th>
                <th className="text-right px-4 py-3 font-semibold">Harga</th>
                <th className="text-right px-4 py-3 font-semibold">Diskon</th>
                <th className="text-right px-4 py-3 font-semibold">Gambar</th>
                <th className="text-right px-4 py-3 font-semibold">Stok</th>
                <th className="text-right px-4 py-3 font-semibold">Status</th>
                <th className="text-center px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const galleryCount = (p.imageUrls?.length ?? 0) + (p.imageUrl ? 1 : 0);
                return (
                  <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td data-label="Produk" className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          <Image
                            src={p.imageUrl || "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=120"}
                            alt={p.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <p className="font-medium text-gray-800 line-clamp-1">{p.name}</p>
                      </div>
                    </td>
                    <td data-label="Toko" className="px-4 py-3 text-gray-600">{p.store.name}</td>
                    <td data-label="Harga" className="px-4 py-3 text-right font-semibold text-cyan-600">{formatPrice(Number(p.price))}</td>
                    <td data-label="Diskon" className="px-4 py-3 text-right">
                      {p.discount && p.discount > 0 ? (
                        <span className="text-xs font-bold text-orange-600">{p.discount}%</span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td data-label="Gambar" className="px-4 py-3 text-right text-xs text-gray-500">{galleryCount} foto</td>
                    <td data-label="Stok" className="px-4 py-3 text-right text-gray-700">{p.stock}</td>
                    <td data-label="Status" className="px-4 py-3 text-right">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                        {p.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td data-label="Aksi" className="px-4 py-3 text-center">
                      <Link
                        href={`/products/${p.id}`}
                        aria-label={`Lihat detail ${p.name}`}
                        title="Lihat detail produk"
                        className="inline-flex items-center justify-center text-purple-600 hover:text-purple-700 p-2 rounded-lg hover:bg-purple-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} total={data?.total ?? 0} limit={LIMIT} onPageChange={setPage} accent="bg-purple-600" />
    </div>
  );
}
