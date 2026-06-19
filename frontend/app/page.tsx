import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/home/hero-section";
import { CategorySection } from "@/components/home/category-section";
import { FeaturedProducts } from "@/components/home/featured-products";
import { PromoSection } from "@/components/home/promo-section";
import { FeaturesSection } from "@/components/home/features-section";
import { ReviewsSection } from "@/components/home/reviews-section";
import { CtaSection } from "@/components/home/cta-section";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <CategorySection />
        <PromoSection />
        <FeaturedProducts />
        <FeaturesSection />
        <ReviewsSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
