"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronLeft, Package, MapPin, CreditCard, Truck, CheckCircle2, Box, Clock, RotateCcw } from "lucide-react";
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
  store: { id: string; name: string };
  address?: { label: string; street: string; city: string; province: string; postalCode: string };
  items: { id: string; name: string; price: string; quantity: number }[];
  statusHistory: { id: string; status: string; note?: string; createdAt: string }[];
  voucher?: { code: string };
  promo?: { code: string };
  delivery?: { driver?: { user: { username: string } }; takenAt?: string; completedAt?: string };
}

const TIMELINE_STEPS = [
  { status: "SEDANG_DIKEMAS", label: "Sedang Dikemas", icon: Box },
  { status: "MENUNGGU_PENGIRIM", label: "Menunggu Pengirim", icon: Clock },
  { status: "SEDANG_DIKIRIM", label: "Sedang Dikirim", icon: Truck },
  { status: "PESANAN_SELESAI", label: "Pesanan Selesai", icon: CheckCircle2 },
];

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const { data: order, isLoading } = useQuery<OrderDetail>({
    queryKey: ["order-detail", id],
    queryFn: () => api.get(`/orders/buyer/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) return <p className="text-center text-gray-400 py-12">Memuat detail pesanan...</p>;
  if (!order) return <p className="text-center text-gray-400 py-12">Pesanan tidak ditemukan.</p>;

  const isReturned = order.status === "DIKEMBALIKAN";
  const currentStepIdx = TIMELINE_STEPS.findIndex((s) => s.status === order.status);

  const findHistory = (status: string) => order.statusHistory.find((h) => h.status === status);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/buyer/orders" className="inline-flex items-center gap-1 text-sm text-cyan-500 hover:text-cyan-600 font-medium">
        <ChevronLeft className="w-4 h-4" /> Kembali ke daftar pesanan
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Detail Pesanan</h1>
          <p className="text-xs text-gray-400 font-mono mt-1">#{order.id}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Tanggal pemesanan</p>
          <p className="text-sm font-semibold text-gray-700">{formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-4">Status Pesanan</h2>
        {isReturned ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
            <RotateCcw className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-semibold text-red-700">Pesanan Dikembalikan</p>
              <p className="text-xs text-red-600 mt-0.5">
                {findHistory("DIKEMBALIKAN")?.note || "Order dikembalikan dan dana telah direfund ke wallet."}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200" />
            <motion.div
              className="absolute top-5 left-5 h-0.5 bg-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStepIdx / (TIMELINE_STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.6 }}
              style={{ maxWidth: "calc(100% - 40px)" }}
            />
            <div className="relative grid grid-cols-4 gap-2">
              {TIMELINE_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const reached = idx <= currentStepIdx;
                const history = findHistory(step.status);
                return (
                  <div key={step.status} className="text-center">
                    <div
                      className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center transition ${
                        reached ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30" : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className={`text-[11px] mt-2 font-semibold ${reached ? "text-cyan-600" : "text-gray-400"}`}>{step.label}</p>
                    {history && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(history.createdAt)}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-700 mb-2">Riwayat Status</p>
          <div className="space-y-1.5">
            {order.statusHistory.map((h) => (
              <div key={h.id} className="flex justify-between text-xs">
                <span className="text-gray-600">{h.status.replace(/_/g, " ")}{h.note ? ` — ${h.note}` : ""}</span>
                <span className="text-gray-400">{formatDateTime(h.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Items */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-cyan-500" />
              <h2 className="font-bold text-gray-800">Item — {order.store.name}</h2>
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

          {/* Address */}
          {order.address && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-cyan-500" />
                <h2 className="font-bold text-gray-800">Alamat Pengiriman</h2>
              </div>
              <p className="text-sm font-semibold text-gray-700">{order.address.label}</p>
              <p className="text-sm text-gray-600 mt-1">{order.address.street}</p>
              <p className="text-sm text-gray-500">{order.address.city}, {order.address.province} {order.address.postalCode}</p>
              <p className="text-xs text-gray-500 mt-3">
                Metode pengiriman: <strong className="text-gray-700">{order.deliveryMethod.replace("_", " ")}</strong>
              </p>
              {order.delivery?.driver && (
                <p className="text-xs text-gray-500 mt-1">
                  Driver: <strong className="text-gray-700">{order.delivery.driver.user.username}</strong>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Payment summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-cyan-500" />
            <h2 className="font-bold text-gray-800">Rincian Pembayaran</h2>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Subtotal" value={formatPrice(Number(order.subtotal))} />
            {Number(order.discountAmount) > 0 && (
              <Row
                label={`Diskon${order.voucher ? ` (${order.voucher.code})` : ""}${order.promo ? ` (${order.promo.code})` : ""}`}
                value={`-${formatPrice(Number(order.discountAmount))}`}
                highlight="text-green-600"
              />
            )}
            <Row label="Ongkir" value={formatPrice(Number(order.deliveryFee))} />
            <Row label="PPN 12%" value={formatPrice(Number(order.ppn))} muted />
            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100">
              <span className="text-gray-800">Total</span>
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
