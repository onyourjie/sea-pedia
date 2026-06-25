import type { Metadata } from "next";
import { ContactPageContent } from "@/components/contact/contact-page-content";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: "Contact Us — SEAPEDIA",
  description:
    "Kenali founder SEAPEDIA dan hubungi kami untuk pertanyaan atau kolaborasi ekosistem maritim.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <ContactPageContent />
      <Footer />
    </div>
  );
}
