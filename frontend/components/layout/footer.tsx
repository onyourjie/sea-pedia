import Link from "next/link";
import { Waves } from "lucide-react";
import { Icon } from "@iconify/react";

const SOCIAL = [
  { icon: "mdi:facebook", href: "#" },
  { icon: "mdi:instagram", href: "#" },
  { icon: "mdi:twitter", href: "#" },
  { icon: "mdi:youtube", href: "#" },
];

const POPULAR_CATEGORIES = [
  { label: "Seafood", value: "seafood" },
  { label: "Alat Pancing", value: "pancing" },
  { label: "Suku Cadang Kapal", value: "suku-cadang" },
];

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-bold text-xl mb-3">
              <Waves className="w-6 h-6 text-cyan-400" />
              SEAPEDIA
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Marketplace multi-role pertama di Asia Tenggara untuk ekosistem maritim yang modern dan terpercaya.
            </p>
            <div className="flex gap-3 mt-4">
              {SOCIAL.map((s, i) => (
                <a key={i} href={s.href} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-cyan-500 transition">
                  <Icon icon={s.icon} className="w-4 h-4 text-gray-300" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Kategori Populer</h4>
            <ul className="space-y-2 text-sm">
              {POPULAR_CATEGORIES.map((item) => (
                <li key={item.value}><Link href={`/products?category=${item.value}`} className="hover:text-cyan-400 transition">{item.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Bantuan</h4>
            <ul className="space-y-2 text-sm">
              {["Pusat Bantuan", "Syarat & Ketentuan", "Kebijakan Privasi", "Panduan Seller"].map((item) => (
                <li key={item}><a href="#" className="hover:text-cyan-400 transition">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Unduh Aplikasi</h4>
            <div className="flex flex-col gap-2">
              <a href="#" className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 transition">
                <Icon icon="mdi:apple" className="w-5 h-5 text-gray-300" />
                <span className="text-xs"><span className="block text-gray-400 text-[10px]">Download on the</span>App Store</span>
              </a>
              <a href="#" className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 transition">
                <Icon icon="mdi:google-play" className="w-5 h-5 text-gray-300" />
                <span className="text-xs"><span className="block text-gray-400 text-[10px]">Get it on</span>Google Play</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
          © 2026 SEAPEDIA. Bangga Buatan Indonesia.
        </div>
      </div>
    </footer>
  );
}
