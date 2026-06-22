import { ChevronDown, HelpCircle, LifeBuoy, MessageCircle, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FaqHero } from "@/components/faq/faq-hero";

const FAQS = [
  {
    question: "Apa itu Seapedia?",
    answer:
      "Seapedia adalah marketplace maritim untuk membeli produk kelautan, mengelola pesanan, wallet, toko, sampai pengiriman dalam satu ekosistem.",
  },
  {
    question: "Bagaimana cara membeli produk?",
    answer:
      "Masuk sebagai pembeli, buka halaman produk, tambahkan barang ke keranjang, pilih alamat, lalu selesaikan pembayaran melalui wallet.",
  },
  {
    question: "Apakah saya bisa punya lebih dari satu peran?",
    answer:
      "Bisa. Akun yang mendukung beberapa peran dapat berpindah antara pembeli, penjual, driver, atau admin lewat tombol ganti peran.",
  },
  {
    question: "Bagaimana penjual mengelola produk dan pesanan?",
    answer:
      "Penjual dapat membuka dashboard seller untuk mengatur toko, menambahkan produk, memproses pesanan masuk, dan melihat laporan pendapatan.",
  },
  {
    question: "Kapan pesanan dikirim?",
    answer:
      "Setelah pesanan diproses penjual, sistem akan menunggu driver mengambil job pengiriman. Status pesanan bisa dipantau dari dashboard pembeli.",
  },
  {
    question: "Apa fungsi wallet di Seapedia?",
    answer:
      "Wallet dipakai untuk menyimpan saldo pembeli dan melakukan pembayaran pesanan dengan alur yang lebih cepat.",
  },
];

const SUPPORT_ITEMS = [
  {
    icon: MessageCircle,
    title: "Pertanyaan Umum",
    text: "Jawaban singkat untuk alur belanja, peran akun, dan pengiriman.",
    color: "text-cyan-600 bg-cyan-50",
  },
  {
    icon: ShieldCheck,
    title: "Transaksi Aman",
    text: "Status pesanan, wallet, dan laporan dibuat agar mudah dipantau.",
    color: "text-green-600 bg-green-50",
  },
  {
    icon: LifeBuoy,
    title: "Butuh Bantuan",
    text: "Akses dashboard sesuai peran untuk melihat detail aktivitas akun.",
    color: "text-orange-600 bg-orange-50",
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main>
        <FaqHero />

        <section className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid md:grid-cols-3 gap-4">
            {SUPPORT_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="font-bold text-gray-800">{item.title}</h2>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">{item.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 pb-14">
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-2 text-cyan-600 text-sm font-semibold">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">Pertanyaan yang Sering Ditanyakan</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => (
              <details
                key={faq.question}
                className="group bg-white border border-gray-100 rounded-2xl shadow-sm open:border-cyan-100 open:shadow-md transition"
                open={index === 0}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
                  <span className="font-semibold text-gray-800">{faq.question}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 transition group-open:rotate-180 group-open:text-cyan-500" />
                </summary>
                <div className="px-5 pb-5 text-sm text-gray-500 leading-relaxed">{faq.answer}</div>
              </details>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
