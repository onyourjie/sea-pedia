import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "SEAPEDIA — Marketplace Maritim Indonesia",
  description: "Platform maritim multi-role untuk nelayan, pedagang, dan pecinta laut di seluruh Nusantara.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="antialiased font-sans bg-white text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
