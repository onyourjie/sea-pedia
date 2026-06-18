"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Package, MapPin, User, Truck, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface OrderDetail {
  id: string;
  status: string;
  subtotal: string;
  discountAmount: string;
  deliveryFee: string;
  ppn: string;
  total: string;
  deliveryMethod: string;
  createdAt: string;
  buyer?: { user: { username: string; email: string } };
  address?: { label: string; street: string; city: string; province: string; postalCode: string };
  items: { id: string; name: string; price: string; quantity: number }[];
  statusHistory: { id: string; status: string; note?: string; createdAt: string }[];
  delivery?: { driver?: { user: { username: string } } };
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  SEDANG_DIKEMAS: { label: "Sedang Dikemas", color: "bg-orange-50 text-orange-600" },
  MENUNGGU_PENGIRIM: { label: "Menunggu Pengirim", color: "bg-yellow-50 text-yellow-700" },
  SEDANG_DIKIRIM: { label: "Sedang Dikirim", color: "bg-blue-50 text-blue-600" },
  PESANAN_SELESAI: { label: "Pesanan Selesai", color: "bg-green-50 text-green-700" },
  DIKEMBALIKAN: { label: "Dikembalikan", color: "bg-red-50 text-red-600" },
};

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function SellerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery<OrderDetail>({
    queryKey: ["seller-order-detail", id],
    queryFn: () => api.get(`/orders/seller/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const process = useMutation({
    mutationFn: () => api.post(`/orders/seller/${id}/process`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller-order-detail", id] });
      qc.invalidateQueries({ queryKey: ["seller-orders-list"] });
      qc.invalidateQueries({ queryKey: ["seller-orders-recent"] });
      toast.success("Pesanan diproses. Driver akan dapat mengambil job.");
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e?.response?.data?.message || "Gagal memproses pesanan");
    },
  });

  if (isLoading) return <p className="text-center text-gray-400 py-12">Memuat...</p>;
  if (!order) return <p className="text-center text-gray-400 py-12">Pesanan tidak ditemukan.</p>;

  const status = STATUS_LABEL[order.status] || { label: order.status, color: "bg-gray-50 text-gray-600" };
  const canProcess = order.status === "SEDANG_DIKEMAS";

  return (
    <div className="space-y-6">
      <Link href="/dashboard/seller/orders" className="inline-flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 font-medium">
        <ChevronLeft className="w-4 h-4" /> Kembali ke pesanan
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Detail Pesanan</h1>
          <p className="text-xs text-gray-400 font-mono mt-1">#{order.id}</p>
          <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${status.color}`}>
            {status.label}
          </span>
        </div>
        {canProcess && (
          <button
            onClick={() => process.mutate()}
            disabled={process.isPending}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold px-5 py-3 rounded-xl transition shadow-lg shadow-orange-500/25 flex items-center gap-2"
          >
            <Truck className="w-4 h-4" /> {process.isPending ? "Memproses..." : "Proses Pesanan"}
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Items */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-orange-500" />
              <h2 className="font-bold text-gray-800">Item Pesanan</h2>
            </div>
            <div className="space-y-2">
              {order.items.map((it) => (
                <div key={it.id} className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
                  <div>
                    <p className="text-gray-700 font-medium">{it.name}</p>
                    <p className="text-xs text-gray-400">{it.quantity} × {formatPrice(Number(it.price))}</p>
                  </div>
                  <p className="font-semibold text-gray-800">{formatPrice(Number(it.price) * it.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Buyer & Address */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-orange-500" />
              <h2 className="font-bold text-gray-800">Pembeli</h2>
            </div>
            <div className="text-sm">
              <p className="text-gray-700 font-semibold">{order.buyer?.user.username}</p>
              <p className="text-xs text-gray-500">{order.buyer?.user.email}</p>
            </div>
            {order.address && (
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  <p className="text-sm font-semibold text-gray-700">{order.address.label}</p>
                </div>
                <p className="text-xs text-gray-500 ml-5">{order.address.street}, {order.address.city}, {order.address.province} {order.address.postalCode}</p>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 text-xs text-gray-500">
              Pengiriman: <strong className="text-gray-700">{order.deliveryMethod.replace("_", " ")}</strong>
              {order.delivery?.driver && (
                <p className="mt-1">Driver: <strong className="text-gray-700">{order.delivery.driver.user.username}</strong></p>
              )}
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-orange-500" />
              <h2 className="font-bold text-gray-800">Riwayat Status</h2>
            </div>
            <div className="space-y-2">
              {order.statusHistory.map((h) => (
                <div key={h.id} className="flex justify-between text-xs pb-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-gray-700">{h.status.replace(/_/g, " ")}</p>
                    {h.note && <p className="text-gray-400 mt-0.5">{h.note}</p>}
                  </div>
                  <p className="text-gray-400">{formatDateTime(h.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit">
          <h2 className="font-bold text-gray-800 mb-3">Rincian Pembayaran</h2>
          <div className="space-y-2 text-sm">
            <Row label="Subtotal" value={formatPrice(Number(order.subtotal))} />
            {Number(order.discountAmount) > 0 && (
              <Row label="Diskon" value={`-${formatPrice(Number(order.discountAmount))}`} highlight="text-green-600" />
            )}
            <Row label="Ongkir" value={formatPrice(Number(order.deliveryFee))} />
            <Row label="PPN 12%" value={formatPrice(Number(order.ppn))} muted />
            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100">
              <span>Total</span>
              <span className="text-cyan-600">{formatPrice(Number(order.total))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, muted, highlight }: { label: string; value: string; muted?: boolean; highlight?: string }) {
  return (
    <div className={`flex justify-between ${muted ? "text-gray-500" : "text-gray-700"}`}>
      <span>{label}</span>
      <span className={highlight || ""}>{value}</span>
    </div>
  );
}
