import Hero from "@/components/Hero";
import CategoryRail from "@/components/CategoryRail";
import PromoStrip from "@/components/PromoStrip";
import ProductGrid from "@/components/ProductGrid";
import DealBanner from "@/components/DealBanner";
import Newsletter from "@/components/Newsletter";

export default function Home() {
  return (
    <main>
      <Hero />
      <CategoryRail />
      <PromoStrip />
      <ProductGrid />
      <DealBanner />
      <Newsletter />
    </main>
  );
}
