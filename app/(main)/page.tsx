import Hero from "@/components/Hero";
import CategoryRail from "@/components/CategoryRail";
import PromoStrip from "@/components/PromoStrip";
import ProductGrid from "@/components/ProductGrid";
import DealBanner from "@/components/DealBanner";
import Newsletter from "@/components/Newsletter";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const sp = await searchParams;
  const activeCat = sp.cat || undefined;

  return (
    <main>
      <Hero />
      <CategoryRail activeCat={activeCat} />
      <PromoStrip />
      <ProductGrid cat={activeCat} />
      <DealBanner />
      <Newsletter />
    </main>
  );
}
