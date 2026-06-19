"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, Truck, Tag, Wallet, CheckCircle2, Plus } from "lucide-react";
import Swal from "sweetalert2";
import api from "@/lib/api";

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: { id: string; name: string; price: string; imageUrl?: string; store: { id: string; name: string } };
}

interface Cart {
  id: string;
  items: CartItem[];
}

interface WalletData {
  balance: string;
}

const DELIVERY_OPTIONS = [
  { value: "INSTANT", label: "Instant", desc: "1-3 jam (area terdekat)", fee: 25000 },
  { value: "NEXT_DAY", label: "Next Day", desc: "1 hari kerja", fee: 15000 },
  { value: "REGULAR", label: "Regular", desc: "2-3 hari kerja", fee: 9000 },
];

const PPN_RATE = 0.12;

function formatPrice(p: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}

export default function CheckoutPage() {
  const router = useRouter();
  const [addressId, setAddressId] = useState<string>("");
  const [deliveryMethod, setDeliveryMethod] = useState<"INSTANT" | "NEXT_DAY" | "REGULAR">("REGULAR");
  const [voucherCode, setVoucherCode] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const { data: cart, isLoading: cartLoading } = useQuery<Cart>({
    queryKey: ["cart"],
    queryFn: () => api.get("/cart").then((r) => r.data),
  });

  const { data: addresses } = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: () => api.get("/addresses").then((r) => r.data),
  });

  const { data: wallet } = useQuery<WalletData>({
    queryKey: ["wallet-checkout"],
    queryFn: () => api.get("/wallet").then((r) => r.data),
  });

  useEffect(() => {
    if (addresses && addresses.length > 0 && !addressId) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setAddressId(def.id);
    }
  }, [addresses, addressId]);

  const items = cart?.items || [];
  const subtotal = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
  const deliveryFee = DELIVERY_OPTIONS.find((o) => o.value === deliveryMethod)?.fee || 0;
  const totalDiscount = voucherDiscount + promoDiscount;
  const discountedSubtotal = Math.max(0, subtotal - totalDiscount);
  const taxBase = discountedSubtotal + deliveryFee;
  const ppn = Math.round(taxBase * PPN_RATE);
  const total = taxBase + ppn;

  const balance = Number(wallet?.balance || 0);
  const insufficient = balance < total;

  const validateVoucher = useMutation({
    mutationFn: (code: string) => api.get(`/vouchers/validate/${code}`).then((r) => r.data),
    onSuccess: (data) => {
      if (!data.valid) {
        Swal.fire({ title: "Voucher Tidak Valid", text: data.reason || "Voucher tidak valid", icon: "error", confirmButtonColor: "#ef4444" });
        setVoucherDiscount(0);
        return;
      }
      const v = data.voucher;
      const raw = v.discountPct ? (subtotal * Number(v.discountPct)) / 100 : Number(v.discountAmount || 0);
      const applied = v.maxDiscount ? Math.min(raw, Number(v.maxDiscount)) : raw;
      if (v.minOrder && subtotal < Number(v.minOrder)) {
        Swal.fire({ title: "Minimum Belanja", text: `Minimum belanja ${formatPrice(Number(v.minOrder))} untuk voucher ini.`, icon: "warning", confirmButtonColor: "#06b6d4" });
        setVoucherDiscount(0);
        return;
      }
      setVoucherDiscount(applied);
      Swal.fire({ title: "Voucher Diterapkan!", text: `Hemat ${formatPrice(applied)}`, icon: "success", timer: 1500, showConfirmButton: false });
    },
    onError: () => Swal.fire({ title: "Gagal", text: "Voucher tidak valid.", icon: "error", confirmButtonColor: "#ef4444" }),
  });

  const validatePromo = useMutation({
    mutationFn: (code: string) => api.get(`/promos/validate/${code}`).then((r) => r.data),
    onSuccess: (data) => {
      if (!data.valid) {
        Swal.fire({ title: "Promo Tidak Valid", text: data.reason || "Promo tidak valid", icon: "error", confirmButtonColor: "#ef4444" });
        setPromoDiscount(0);
        return;
      }
      const p = data.promo;
      const raw = p.discountPct ? (subtotal * Number(p.discountPct)) / 100 : Number(p.discountAmount || 0);
      const applied = p.maxDiscount ? Math.min(raw, Number(p.maxDiscount)) : raw;
      if (p.minOrder && subtotal < Number(p.minOrder)) {
        Swal.fire({ title: "Minimum Belanja", text: `Minimum belanja ${formatPrice(Number(p.minOrder))} untuk promo ini.`, icon: "warning", confirmButtonColor: "#06b6d4" });
        setPromoDiscount(0);
        return;
      }
      setPromoDiscount(applied);
      Swal.fire({ title: "Promo Diterapkan!", text: `Hemat ${formatPrice(applied)}`, icon: "success", timer: 1500, showConfirmButton: false });
    },
    onError: () => Swal.fire({ title: "Gagal", text: "Promo tidak valid.", icon: "error", confirmButtonColor: "#ef4444" }),
  });

  const handleCheckout = async () => {
    if (!addressId) {
      Swal.fire({ title: "Pilih Alamat", text: "Pilih alamat pengiriman terlebih dahulu.", icon: "warning", confirmButtonColor: "#06b6d4" });
      return;
    }
    if (insufficient) {
      Swal.fire({ title: "Saldo Tidak Cukup", text: "Saldo wallet tidak cukup. Top up dulu.", icon: "warning", confirmButtonColor: "#06b6d4" });
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, string> = { addressId, deliveryMethod };
      if (voucherCode && voucherDiscount > 0) payload.voucherCode = voucherCode;
      if (promoCode && promoDiscount > 0) payload.promoCode = promoCode;
      const res = await api.post("/orders/checkout", payload);
      await Swal.fire({ title: "Pesanan Berhasil!", text: "Pesananmu sedang dikemas oleh seller.", icon: "success", confirmButtonColor: "#06b6d4" });
      router.push(`/dashboard/buyer/orders/${res.data.order.id}`);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      Swal.fire({ title: "Checkout Gagal", text: e?.response?.data?.message || "Checkout gagal, coba lagi.", icon: "error", confirmButtonColor: "#ef4444" });
    }
    setSubmitting(false);
  };

  if (cartLoading) return <p className="text-center text-gray-400 py-12">Memuat...</p>;
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <h3 className="font-semibold text-gray-700">Keranjang kosong</h3>
        <Link href="/products" className="inline-block mt-4 bg-cyan-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
          Belanja Sekarang
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Checkout</h1>
        <p className="text-sm text-gray-500 mt-0.5">Periksa pesanan dan selesaikan pembayaran.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Address */}
          <Section icon={MapPin} title="Alamat Pengiriman">
            {!addresses || addresses.length === 0 ? (
              <Link href="/dashboard/buyer/addresses" className="flex items-center gap-2 text-sm text-cyan-600 font-medium">
                <Plus className="w-4 h-4" /> Tambah alamat
              </Link>
            ) : (
              <div className="space-y-2">
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      addressId === a.id ? "border-cyan-400 bg-cyan-50" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={addressId === a.id}
                      onChange={() => setAddressId(a.id)}
                      className="mt-1 text-cyan-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">
                        {a.label}
                        {a.isDefault && <span className="ml-2 text-[10px] bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">Utama</span>}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{a.street}, {a.city}, {a.province} {a.postalCode}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </Section>

          {/* Delivery method */}
          <Section icon={Truck} title="Metode Pengiriman">
            <div className="space-y-2">
              {DELIVERY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    deliveryMethod === opt.value ? "border-cyan-400 bg-cyan-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery"
                    checked={deliveryMethod === opt.value}
                    onChange={() => setDeliveryMethod(opt.value as "INSTANT" | "NEXT_DAY" | "REGULAR")}
                    className="text-cyan-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                  <p className="text-sm font-semibold text-cyan-600">{formatPrice(opt.fee)}</p>
                </label>
              ))}
            </div>
          </Section>

          {/* Discounts */}
          <Section icon={Tag} title="Voucher & Promo">
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  placeholder="Kode voucher"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => voucherCode && validateVoucher.mutate(voucherCode)}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold px-4 rounded-xl"
                >
                  Pakai
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="Kode promo"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => promoCode && validatePromo.mutate(promoCode)}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 rounded-xl"
                >
                  Pakai
                </button>
              </div>
            </div>
          </Section>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit lg:sticky lg:top-20 space-y-4">
          <h2 className="font-bold text-gray-800">Ringkasan Pesanan</h2>

          <div className="space-y-2 max-h-40 overflow-auto">
            {items.map((i) => (
              <div key={i.id} className="flex items-center gap-2 text-sm">
                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  <img src={i.product.imageUrl || "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=80"} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 line-clamp-1">{i.product.name}</p>
                  <p className="text-xs text-gray-400">{i.quantity} × {formatPrice(Number(i.product.price))}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
            <Row label="Subtotal" value={formatPrice(subtotal)} />
            {totalDiscount > 0 && <Row label="Diskon" value={`-${formatPrice(totalDiscount)}`} highlight="text-green-600" />}
            <Row label="Ongkir" value={formatPrice(deliveryFee)} />
            <Row label="PPN 12%" value={formatPrice(ppn)} muted />
            <div className="flex justify-between text-base font-bold text-gray-800 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span className="text-cyan-600">{formatPrice(total)}</span>
            </div>
          </div>

          <div className={`flex items-center gap-2 p-3 rounded-xl text-xs ${insufficient ? "bg-red-50 text-red-700" : "bg-cyan-50 text-cyan-700"}`}>
            <Wallet className="w-4 h-4" />
            <span>Saldo: <strong>{formatPrice(balance)}</strong></span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={submitting || insufficient || !addressId}
            className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition"
          >
            {submitting ? "Memproses..." : <><CheckCircle2 className="w-4 h-4" /> Bayar Sekarang</>}
          </button>
          {insufficient && (
            <Link href="/dashboard/buyer/wallet" className="block text-center text-xs text-cyan-500 hover:text-cyan-600 font-medium">
              Top Up Wallet →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof MapPin; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-cyan-500" />
        <h2 className="font-bold text-gray-800">{title}</h2>
      </div>
      {children}
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
