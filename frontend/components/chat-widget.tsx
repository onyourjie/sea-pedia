"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react";
import { isAxiosError } from "axios";
import api from "@/lib/api";

interface Message {
  role: "user" | "model";
  content: string;
}

interface ChatErrorResponse {
  message?: string;
}

const WELCOME: Message = {
  role: "model",
  content:
    "Halo! Saya asisten SEAPEDIA. Saya bisa bantu kamu cek status pesanan, cari produk, atau jawab pertanyaan seputar platform. Ada yang bisa saya bantu?",
};

const QUICK_REPLIES = [
  "Cek status pesanan saya",
  "Berapa ongkir pengiriman?",
  "Rekomendasi produk seafood",
  "Cara top up wallet",
  "Kebijakan refund pesanan",
  "Cara jadi seller",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function ChatBubble({ msg }: { msg: Message }) {
  const isBot = msg.role === "model";
  return (
    <div className={`flex gap-2 ${isBot ? "justify-start" : "justify-end"}`}>
      {isBot && (
        <div className="w-7 h-7 rounded-full bg-cyan-500 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isBot
            ? "bg-gray-100 text-gray-800 rounded-tl-sm"
            : "bg-cyan-500 text-white rounded-tr-sm"
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || loading) return;

    setShowQuickReplies(false);
    const userMsg: Message = { role: "user", content: message };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const history = next.slice(1, -1);
      const { data } = await api.post("/chat", { message, history });
      setMessages([...next, { role: "model", content: data.reply }]);
    } catch (err: unknown) {
      const errMsg = isAxiosError<ChatErrorResponse>(err)
        ? err.response?.data?.message || "Maaf, terjadi kesalahan. Silakan coba lagi."
        : "Maaf, terjadi kesalahan. Silakan coba lagi.";
      setMessages([...next, { role: "model", content: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const sendQuickReply = (q: string) => send(q);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 flex flex-col rounded-2xl shadow-2xl border border-gray-200 bg-white overflow-hidden"
          style={{ maxHeight: "min(560px, calc(100dvh - 100px))" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-cyan-500 text-white">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Asisten SEAPEDIA</p>
              <p className="text-xs text-cyan-100">Online • Siap membantu</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Tutup chat"
              className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-white">
            {messages.map((m, i) => (
              <ChatBubble key={i} msg={m} />
            ))}

            {/* Quick reply chips — only shown before user sends first message */}
            {showQuickReplies && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                  onClick={() => sendQuickReply(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-cyan-200 text-cyan-700 bg-cyan-50 hover:bg-cyan-100 transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-cyan-500 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100 bg-white">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ketik pesan..."
              disabled={loading}
              maxLength={500}
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:opacity-60"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              aria-label="Kirim pesan"
              className="w-9 h-9 rounded-xl bg-cyan-500 text-white flex items-center justify-center hover:bg-cyan-600 disabled:opacity-40 transition"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Floating bubble */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Tutup chat" : "Buka chat asisten"}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-cyan-500 text-white shadow-lg hover:bg-cyan-600 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>
    </>
  );
}
