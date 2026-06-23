"use client";

import { useQuery } from "@tanstack/react-query";
import { Truck } from "lucide-react";
import api from "@/lib/api";
import { SkeletonTable } from "@/components/ui/skeleton";

interface AdminDelivery {
  id: string;
  takenAt?: string;
  completedAt?: string;
  createdAt: string;
  order: { status: string; deliveryMethod: string; total: string };
  driver?: { user: { username: string } };
}

const STATUS_COLOR: Record<string, string> = {
  SEDANG_DIKEMAS: "bg-orange-50 text-orange-600",
  MENUNGGU_PENGIRIM: "bg-yellow-50 text-yellow-700",
  SEDANG_DIKIRIM: "bg-blue-50 text-blue-600",
  PESANAN_SELESAI: "bg-green-50 text-green-700",
  DIKEMBALIKAN: "bg-red-50 text-red-600",
};

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

export default function AdminDeliveriesPage() {
  const { data, isLoading } = useQuery<{ data: AdminDelivery[]; total: number }>({
    queryKey: ["admin-deliveries"],
    queryFn: () => api.get("/admin/deliveries?page=1&limit=100").then((r) => r.data),
  });

  const deliveries = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Monitoring Pengiriman</h1>
        <p className="text-sm text-gray-500 mt-0.5">{data?.total ?? 0} job pengiriman total.</p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><SkeletonTable rows={6} /></div>
      ) : deliveries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Truck className="w-14 h-14 text-purple-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800">Belum ada job pengiriman</h3>
          <p className="text-sm text-gray-500 mt-1">Job muncul setelah Seller memproses pesanan dan Driver mengambil delivery.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">ID</th>
                <th className="text-left px-4 py-3 font-semibold">Driver</th>
                <th className="text-left px-4 py-3 font-semibold">Metode</th>
                <th className="text-right px-4 py-3 font-semibold">Nilai Order</th>
                <th className="text-right px-4 py-3 font-semibold">Status Order</th>
                <th className="text-right px-4 py-3 font-semibold">Diambil</th>
                <th className="text-right px-4 py-3 font-semibold">Selesai</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">#{d.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-gray-700">{d.driver?.user.username || <span className="text-gray-400 italic">Belum diambil</span>}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{d.order.deliveryMethod.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-right font-semibold text-cyan-600">{formatPrice(Number(d.order.total))}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[d.order.status] || "bg-gray-50 text-gray-600"}`}>
                      {d.order.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-500">
                    {d.takenAt ? new Date(d.takenAt).toLocaleDateString("id-ID") : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-500">
                    {d.completedAt ? new Date(d.completedAt).toLocaleDateString("id-ID") : "-"}
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
