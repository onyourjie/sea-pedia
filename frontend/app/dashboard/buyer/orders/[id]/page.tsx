"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronLeft, Package, MapPin, CreditCard, Truck, CheckCircle2, Box, Clock, RotateCcw, Star, MessageSquarePlus, X } from "lucide-react";
import Swal from "sweetalert2";
import api from "@/lib/api";
import { SkeletonDetail } from "@/components/ui/skeleton";

interface OrderItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
  productId: string;
  review?: { id: string; rating: number; comment: string } | null;
}

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
  address?: { label: string; recipientName: string; recipientPhone: string; street: string; city: string; province: string; postalCode: string };
  items: OrderItem[];
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

function ReviewModal({
  item,
  onClose,
  onSubmit,
  isPending,
}: {
  item: OrderItem;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  isPending: boolean;
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Beri Ulasan Produk</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-700 mb-4 line-clamp-2">{item.name}</p>

        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">Rating</p>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1;
              const active = value <= (hoverRating || rating);
              return (
                <button
                  key={value}
                  type="button"
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(value)}
                  className="p-1"
                  aria-label={`${value} bintang`}
                >
                  <Star className={`w-7 h-7 transition ${active ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-700 mb-2 block">Komentar</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Bagikan pengalamanmu dengan produk ini..."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-cyan-400 resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!comment.trim() || isPending}
            onClick={() => onSubmit(rating, comment)}
            className="flex-1 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl"
          >
            {isPending ? "Mengirim..." : "Kirim Ulasan"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const qc = useQueryClient();
  const [reviewing, setReviewing] = useState<OrderItem | null>(null);

  const { data: order, isLoading } = useQuery<OrderDetail>({
    queryKey: ["order-detail", id],
    queryFn: () => api.get(`/orders/buyer/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const submitReview = useMutation({
    mutationFn: ({ orderItemId, rating, comment }: { orderItemId: string; rating: number; comment: string }) =>
      api.post("/product-reviews", { orderItemId, rating, comment }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order-detail", id] });
      qc.invalidateQueries({ queryKey: ["product-reviews"] });
      Swal.fire({ title: "Terima kasih!", text: "Ulasan berhasil dikirim.", icon: "success", timer: 1500, showConfirmButton: false });
      setReviewing(null);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Swal.fire({ title: "Gagal", text: e?.response?.data?.message || "Gagal mengirim ulasan", icon: "error", confirmButtonColor: "#ef4444" });
    },
  });

  if (isLoading) return <div className="py-2"><SkeletonDetail /></div>;
  if (!order) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
      <Package className="w-14 h-14 text-cyan-200 mx-auto mb-3" />
      <h3 className="font-semibold text-gray-800">Pesanan tidak ditemukan</h3>
      <p className="text-sm text-gray-500 mt-1 mb-4">Mungkin pesanan ini sudah dihapus atau bukan milikmu.</p>
      <Link href="/dashboard/buyer/orders" className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
        <ChevronLeft className="w-4 h-4" /> Kembali ke Pesanan
      </Link>
    </div>
  );

  const isCompleted = order.status === "PESANAN_SELESAI";
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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-cyan-500" />
              <h2 className="font-bold text-gray-800">Item — {order.store.name}</h2>
            </div>
            <div className="space-y-3">
              {order.items.map((it) => (
                <div key={it.id} className="border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                  <div className="flex justify-between text-sm">
                    <div className="flex-1 pr-3">
                      <Link href={`/products/${it.productId}`} className="text-gray-700 font-medium hover:text-cyan-600">{it.name}</Link>
                      <p className="text-xs text-gray-400 mt-0.5">{it.quantity} × {formatPrice(Number(it.price))}</p>
                    </div>
                    <p className="font-semibold text-gray-800">{formatPrice(Number(it.price) * it.quantity)}</p>
                  </div>
                  {isCompleted && (
                    <div className="mt-2">
                      {it.review ? (
                        <div className="bg-green-50 border border-green-100 rounded-lg p-2.5 text-xs">
                          <div className="flex items-center gap-1 mb-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < it.review!.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                            ))}
                            <span className="ml-1 text-green-700 font-semibold">Sudah diulas</span>
                          </div>
                          <p className="text-gray-600 line-clamp-2">{it.review.comment}</p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReviewing(it)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-cyan-50 text-cyan-600 hover:bg-cyan-100 px-3 py-1.5 rounded-full transition"
                        >
                          <MessageSquarePlus className="w-3.5 h-3.5" /> Beri Ulasan
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {order.address && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-cyan-500" />
                <h2 className="font-bold text-gray-800">Alamat Pengiriman</h2>
              </div>
              <p className="text-sm font-semibold text-gray-700">{order.address.label}</p>
              <p className="text-sm text-gray-700 mt-1">{order.address.recipientName} <span className="text-cyan-600 font-mono ml-1">{order.address.recipientPhone}</span></p>
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

      {reviewing && (
        <ReviewModal
          item={reviewing}
          onClose={() => setReviewing(null)}
          isPending={submitReview.isPending}
          onSubmit={(rating, comment) =>
            submitReview.mutate({ orderItemId: reviewing.id, rating, comment })
          }
        />
      )}
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
