"use client";

import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import api from "@/lib/api";

interface AdminProduct {
  id: string;
  name: string;
  price: string;
  stock: number;
  isActive: boolean;
  imageUrl?: string;
  store: { name: string };
}

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

export default function AdminProductsPage() {
  const { data, isLoading } = useQuery<{ data: AdminProduct[]; total: number }>({
    queryKey: ["admin-products"],
    queryFn: () => api.get("/products?page=1&limit=100").then((r) => r.data),
  });

  const products = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Produk Marketplace</h1>
        <p className="text-sm text-gray-500 mt-0.5">{data?.total ?? 0} produk terdaftar di seluruh toko.</p>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-400 py-12">Memuat...</p>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada produk</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Produk</th>
                <th className="text-left px-4 py-3 font-semibold">Toko</th>
                <th className="text-right px-4 py-3 font-semibold">Harga</th>
                <th className="text-right px-4 py-3 font-semibold">Stok</th>
                <th className="text-right px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <img
                          src={p.imageUrl || "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=120"}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="font-medium text-gray-800 line-clamp-1">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.store.name}</td>
                  <td className="px-4 py-3 text-right font-semibold text-cyan-600">{formatPrice(Number(p.price))}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{p.stock}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {p.isActive ? "Aktif" : "Nonaktif"}
                    </span>
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
