"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import api from "@/lib/api";
import { SkeletonTable } from "@/components/ui/skeleton";

interface AdminOrder {
  id: string;
  status: string;
  total: string;
  deliveryMethod: string;
  isOverdue: boolean;
  createdAt: string;
  store: { name: string };
  buyer: { user: { username: string } };
}

const STATUS_COLOR: Record<string, string> = {
  SEDANG_DIKEMAS: "bg-orange-50 text-orange-600",
  MENUNGGU_PENGIRIM: "bg-yellow-50 text-yellow-700",
  SEDANG_DIKIRIM: "bg-blue-50 text-blue-600",
  PESANAN_SELESAI: "bg-green-50 text-green-700",
  DIKEMBALIKAN: "bg-red-50 text-red-600",
};

const FILTERS = ["Semua", "SEDANG_DIKEMAS", "MENUNGGU_PENGIRIM", "SEDANG_DIKIRIM", "PESANAN_SELESAI", "DIKEMBALIKAN"];

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState("Semua");

  const { data, isLoading } = useQuery<{ data: AdminOrder[]; total: number }>({
    queryKey: ["admin-orders"],
    queryFn: () => api.get("/admin/orders?page=1&limit=100").then((r) => r.data),
  });

  const orders = (data?.data || []).filter((o) => filter === "Semua" || o.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Semua Pesanan</h1>
        <p className="text-sm text-gray-500 mt-0.5">{data?.total ?? 0} pesanan total di marketplace.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition ${
                filter === f ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><SkeletonTable rows={6} /></div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <ClipboardList className="w-14 h-14 text-purple-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800">Tidak ada pesanan untuk filter ini</h3>
          <p className="text-sm text-gray-500 mt-1">Coba pilih filter status lain di atas untuk melihat pesanan.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="dashboard-responsive-table">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">ID</th>
                <th className="text-left px-4 py-3 font-semibold">Pembeli</th>
                <th className="text-left px-4 py-3 font-semibold">Toko</th>
                <th className="text-left px-4 py-3 font-semibold">Pengiriman</th>
                <th className="text-right px-4 py-3 font-semibold">Total</th>
                <th className="text-right px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td data-label="ID" className="px-4 py-3 text-xs font-mono text-gray-500">#{o.id.slice(0, 8)}</td>
                  <td data-label="Pembeli" className="px-4 py-3 text-gray-700">{o.buyer.user.username}</td>
                  <td data-label="Toko" className="px-4 py-3 text-gray-700">{o.store.name}</td>
                  <td data-label="Pengiriman" className="px-4 py-3 text-gray-600 text-xs">{o.deliveryMethod.replace("_", " ")}</td>
                  <td data-label="Total" className="px-4 py-3 text-right font-semibold text-cyan-600">{formatPrice(Number(o.total))}</td>
                  <td data-label="Status" className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {o.isOverdue && (
                        <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          Overdue
                        </span>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status] || "bg-gray-50 text-gray-600"}`}>
                        {o.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </td>
                  <td data-label="Tanggal" className="px-4 py-3 text-right text-xs text-gray-500">
                    {new Date(o.createdAt).toLocaleDateString("id-ID")}
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
