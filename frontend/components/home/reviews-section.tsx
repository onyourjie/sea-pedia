"use client";

import { motion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";

interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
}

export function ReviewsSection() {
  const [page, setPage] = useState(0);
  const { data } = useQuery({
    queryKey: ["reviews"],
    queryFn: () => api.get("/reviews?limit=10").then((r: { data: { data: Review[] } }) => r.data),
  });

  const reviews: Review[] = data?.data || [];
  const perPage = 3;
  const pages = Math.ceil(reviews.length / perPage);
  const visible = reviews.slice(page * perPage, page * perPage + perPage);

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Apa Kata Mereka?</h2>
          <p className="text-sm text-gray-500 mt-1">Kepuasan pengguna adalah prioritas kami.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition"
            disabled={page === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            className="w-9 h-9 rounded-full bg-cyan-500 text-white flex items-center justify-center hover:bg-cyan-600 disabled:opacity-40 transition"
            disabled={page >= pages - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {visible.map((review: Review, i: number) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                {review.reviewerName[0]}
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800">{review.reviewerName}</p>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`w-3 h-3 ${j < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200"}`} />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
          </motion.div>
        ))}
      </div>

      {/* Review Form */}
      <ReviewForm />
    </section>
  );
}

function ReviewForm() {
  const [form, setForm] = useState({ reviewerName: "", rating: 5, comment: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/reviews", form);
      setSubmitted(true);
    } catch {}
    setLoading(false);
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center py-8 bg-cyan-50 rounded-2xl">
        <div className="text-3xl mb-2">🎉</div>
        <p className="font-semibold text-cyan-700">Terima kasih atas ulasan Anda!</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-10 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-100"
    >
      <h3 className="font-bold text-gray-800 mb-4">Tulis Ulasan Anda</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-300 bg-white"
          placeholder="Nama Anda"
          value={form.reviewerName}
          onChange={(e) => setForm({ ...form, reviewerName: e.target.value })}
          required
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rating:</span>
          {[1, 2, 3, 4, 5].map((r) => (
            <button key={r} type="button" onClick={() => setForm({ ...form, rating: r })}>
              <Star className={`w-6 h-6 ${r <= form.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 fill-gray-100"} transition`} />
            </button>
          ))}
        </div>
        <textarea
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-300 bg-white resize-none"
          rows={3}
          placeholder="Bagikan pengalaman Anda menggunakan SEAPEDIA..."
          value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition disabled:opacity-60"
        >
          {loading ? "Mengirim..." : "Kirim Ulasan"}
        </button>
      </form>
    </motion.div>
  );
}
