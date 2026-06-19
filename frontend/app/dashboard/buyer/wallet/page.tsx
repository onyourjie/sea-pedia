"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownLeft, RefreshCw, CreditCard, AlertCircle, Shield, Search } from "lucide-react";
import Swal from "sweetalert2";
import api from "@/lib/api";

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000];

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  createdAt: string;
  note?: string;
}

const TX_LABEL: Record<string, { label: string; color: string; icon: typeof ArrowUpRight }> = {
  TOP_UP: { label: "Top Up", color: "text-green-600", icon: ArrowUpRight },
  PAYMENT: { label: "Pembayaran", color: "text-red-500", icon: ArrowDownLeft },
  REFUND: { label: "Refund", color: "text-blue-500", icon: RefreshCw },
};

export default function WalletPage() {
  const queryClient = useQueryClient();
  const [topUpAmount, setTopUpAmount] = useState(0);

  const { data: walletData } = useQuery({
    queryKey: ["buyer-wallet"],
    queryFn: () => api.get("/wallet").then((r) => r.data),
  });

  const { data: txData } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: () => api.get("/wallet/transactions?limit=10").then((r) => r.data),
  });

  const topUpMutation = useMutation({
    mutationFn: (amount: number) => api.post("/wallet/topup", { amount }),
    onSuccess: (_, amount) => {
      queryClient.invalidateQueries({ queryKey: ["buyer-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setTopUpAmount(0);
      Swal.fire({
        title: "Top Up Berhasil!",
        text: `Saldo Anda berhasil ditambahkan sebesar ${formatPrice(amount)}.`,
        icon: "success",
        confirmButtonColor: "#06b6d4",
        confirmButtonText: "OK",
      });
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Swal.fire({
        title: "Gagal",
        text: e?.response?.data?.message || "Top up gagal, coba lagi.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    },
  });

  const balance = walletData?.data?.balance ?? 0;
  const transactions: Transaction[] = txData?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Wallet Saya</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola saldo dan pantau semua transaksi belanja Anda di Seapedia.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Balance card */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border border-cyan-100 p-6 flex flex-col justify-between min-h-[140px]">
          <div>
            <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-1">Saldo Wallet Saat Ini</p>
            <p className="text-4xl font-bold text-gray-800 mb-1">{formatPrice(balance)}</p>
            <div className="flex items-center gap-1.5 text-xs text-cyan-600">
              <Shield className="w-3.5 h-3.5" /> Terverifikasi &amp; Aman
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-1.5">
              <ArrowUpRight className="w-4 h-4" /> Top Up Saldo
            </button>
            <button className="flex-1 border border-cyan-300 text-cyan-600 hover:bg-cyan-50 font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-1.5">
              <ArrowDownLeft className="w-4 h-4" /> Tarik Saldo
            </button>
          </div>
        </div>

        {/* Top up panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight className="w-4 h-4 text-cyan-500" />
            <h3 className="font-bold text-gray-800 text-sm">Isi Saldo Cepat</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">Pilih nominal atau masukkan jumlah yang Anda inginkan</p>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setTopUpAmount(amt)}
                className={`py-2 rounded-xl text-xs font-semibold border transition ${
                  topUpAmount === amt
                    ? "border-cyan-400 bg-cyan-50 text-cyan-600"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                Rp {amt >= 1000 ? `${amt / 1000}rb` : amt}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-1.5 block">Nominal Lainnya</label>
            <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-cyan-300 focus-within:border-cyan-400 transition">
              <span className="text-sm text-gray-500 mr-2">Rp</span>
              <input
                type="number"
                value={topUpAmount || ""}
                onChange={(e) => setTopUpAmount(Number(e.target.value))}
                placeholder="0"
                className="flex-1 text-sm outline-none bg-transparent"
              />
            </div>
          </div>

          <button
            onClick={() => topUpAmount > 0 && topUpMutation.mutate(topUpAmount)}
            disabled={topUpAmount <= 0 || topUpMutation.isPending}
            className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition shadow-lg shadow-cyan-500/20"
          >
            {topUpMutation.isPending ? "Memproses..." : "Konfirmasi Top Up"}
          </button>
        </div>
      </div>

      {/* Info badges */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: CreditCard, label: "Metode Pembayaran", value: "Terhubung ke 3 Bank" },
          { icon: AlertCircle, label: "Batas Transaksi", value: "Hingga Rp 10.000.000" },
          { icon: Shield, label: "Keamanan", value: "Autentikasi 2-Lapis Aktif" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-cyan-500" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{item.label}</p>
                <p className="text-sm font-semibold text-gray-700">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-cyan-500" />
            <h2 className="font-bold text-gray-800">Riwayat Transaksi Wallet</h2>
          </div>
          <div className="flex items-center gap-2">
            <select className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none text-gray-600">
              <option>Semua Transaksi</option>
              <option>Top Up</option>
              <option>Pembayaran</option>
              <option>Refund</option>
            </select>
            <button className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition">
              <Search className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tanggal &amp; Waktu</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Jenis Transaksi</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nominal</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Saldo Akhir</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-gray-400">Belum ada transaksi</td>
                </tr>
              )}
              {transactions.map((tx) => {
                const info = TX_LABEL[tx.type] || { label: tx.type, color: "text-gray-600", icon: RefreshCw };
                const Icon = info.icon;
                const isCredit = tx.type === "TOP_UP" || tx.type === "REFUND";
                return (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })},{" "}
                      {new Date(tx.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${info.color}`} />
                        <span className={`font-medium ${info.color}`}>{info.label}</span>
                      </div>
                    </td>
                    <td className={`px-5 py-3.5 text-right font-semibold text-sm ${isCredit ? "text-green-600" : "text-red-500"}`}>
                      {isCredit ? "+" : "–"} {formatPrice(Math.abs(tx.amount))}
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm text-gray-600">{formatPrice(tx.balanceAfter)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button className="text-xs text-cyan-500 hover:text-cyan-600 font-medium">Detail</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
