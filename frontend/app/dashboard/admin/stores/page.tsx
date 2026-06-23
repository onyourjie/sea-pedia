"use client";

import { useQuery } from "@tanstack/react-query";
import { Store } from "lucide-react";
import api from "@/lib/api";
import { DiceBearAvatar } from "@/components/ui/dicebear-avatar";
import { SkeletonTable } from "@/components/ui/skeleton";

interface AdminStore {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  _count: { products: number };
}

export default function AdminStoresPage() {
  const { data, isLoading } = useQuery<{ data: AdminStore[]; total: number }>({
    queryKey: ["admin-stores"],
    queryFn: () => api.get("/stores?page=1&limit=100").then((r) => r.data),
  });

  const stores = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Toko Terdaftar</h1>
        <p className="text-sm text-gray-500 mt-0.5">{data?.total ?? 0} toko aktif di Seapedia.</p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><SkeletonTable rows={6} /></div>
      ) : stores.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Store className="w-14 h-14 text-purple-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800">Belum ada toko terdaftar</h3>
          <p className="text-sm text-gray-500 mt-1">Toko akan muncul di sini setelah Seller pertama membuat profil tokonya.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Nama Toko</th>
                <th className="text-left px-4 py-3 font-semibold">Deskripsi</th>
                <th className="text-right px-4 py-3 font-semibold">Produk</th>
                <th className="text-right px-4 py-3 font-semibold">Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <DiceBearAvatar seed={s.name} type="store" className="h-9 w-9 ring-2 ring-cyan-100" />
                      <span className="font-semibold text-gray-800">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs">{s.description || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-semibold bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full">
                      {s._count.products}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-500">
                    {new Date(s.createdAt).toLocaleDateString("id-ID")}
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
