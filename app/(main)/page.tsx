import Hero from "@/components/Hero";
import CategoryRail from "@/components/CategoryRail";
import PromoStrip from "@/components/PromoStrip";
import ProductGrid from "@/components/ProductGrid";
import DealBanner from "@/components/DealBanner";
import Newsletter from "@/components/Newsletter";
import { prisma } from "@/lib/db";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const sp = await searchParams;
  const activeCat = sp.cat || undefined;

  // Fetch real database records for the Hero section
  const activeCustomersCount = await prisma.user.count();
  const sellerCount = await prisma.seller.count({ where: { isVerified: true } });
  const dbHeroProducts = await prisma.product.findMany({
    where: { isPublished: true, deletedAt: null },
    take: 2,
    orderBy: { createdAt: "desc" },
  });

  return (
    <main>
      <Hero 
        products={dbHeroProducts}
        metrics={{ activeCustomers: activeCustomersCount, sellers: sellerCount }}
      />
      <CategoryRail activeCat={activeCat} />
      <PromoStrip />
      <ProductGrid cat={activeCat} />
      <DealBanner />
      <Newsletter />
    </main>
  );
}
