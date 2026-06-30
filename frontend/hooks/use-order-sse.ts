"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth.store";

const STATUS_LABEL: Record<string, string> = {
  SEDANG_DIKEMAS: "Pesanan sedang dikemas",
  MENUNGGU_PENGIRIM: "Menunggu pengirim",
  SEDANG_DIKIRIM: "Pesanan sedang dikirim",
  PESANAN_SELESAI: "Pesanan selesai",
  DIKEMBALIKAN: "Pesanan dikembalikan",
};

const STATUS_ICON: Record<string, string> = {
  SEDANG_DIKEMAS: "📦",
  MENUNGGU_PENGIRIM: "⏳",
  SEDANG_DIKIRIM: "🚚",
  PESANAN_SELESAI: "✅",
  DIKEMBALIKAN: "↩️",
};

export function useOrderSSE() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const activeRole = useAuthStore((s) => s.user?.activeRole);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Wait for Zustand to rehydrate from localStorage before checking auth
    if (!hasHydrated) return;

    // Only subscribe when logged in as BUYER
    if (!token || activeRole !== "BUYER") {
      esRef.current?.close();
      esRef.current = null;
      return;
    }

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
    const url = `${apiUrl}/events/orders`;

    // Close any existing connection before opening a new one
    esRef.current?.close();

    // EventSource doesn't support custom headers natively — pass token as query param
    const es = new EventSource(`${url}?token=${token}`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as {
          orderId: string;
          status: string;
          note?: string;
        };
        const label = STATUS_LABEL[event.status] ?? event.status;
        const icon = STATUS_ICON[event.status] ?? "🔔";
        const isDone = event.status === "PESANAN_SELESAI";
        const isReturn = event.status === "DIKEMBALIKAN";

        queryClient.invalidateQueries({ queryKey: ["buyer-orders"] });
        queryClient.invalidateQueries({ queryKey: ["buyer-orders-all"] });
        queryClient.invalidateQueries({ queryKey: ["order-detail", event.orderId] });
        queryClient.invalidateQueries({ queryKey: ["buyer-wallet"] });
        queryClient.invalidateQueries({ queryKey: ["cart"] });

        toast(
          `${icon} ${label}\nOrder #${event.orderId.slice(0, 8)}${event.note ? `\n${event.note}` : ""}`,
          {
            duration: isDone || isReturn ? 6000 : 4000,
            style: {
              background: isReturn
                ? "#fef2f2"
                : isDone
                  ? "#f0fdf4"
                  : "#f0f9ff",
              color: "#1f2937",
              fontSize: "13px",
              whiteSpace: "pre-line",
            },
          }
        );
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      // Browser will auto-reconnect on error — no manual retry needed
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [token, activeRole, hasHydrated, queryClient]);
}
