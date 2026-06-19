"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Gagal memuat data", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-red-500" />
      </div>
      <p className="text-sm font-medium text-gray-700">{message}</p>
      <p className="text-xs text-gray-400 mt-1">Periksa koneksi internet kamu</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-2 text-xs font-medium text-cyan-600 hover:text-cyan-700 px-4 py-2 rounded-full border border-cyan-200 hover:bg-cyan-50 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = "Belum ada data", icon: Icon }: { message?: string; icon?: React.ElementType }) {
  const BoxIcon = Icon;
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {BoxIcon && <BoxIcon className="w-10 h-10 text-gray-200 mb-3" />}
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}
