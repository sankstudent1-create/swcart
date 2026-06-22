import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import SellerProductManager from "./SellerProductManager";

export default async function SellerProductsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const seller = await prisma.seller.findUnique({
    where: { userId }
  });

  if (!seller) {
    redirect("/sell");
  }

  // Fetch products
  const products = await prisma.product.findMany({
    where: { sellerId: seller.id },
    include: { category: true },
    orderBy: { createdAt: "desc" }
  });

  // Fetch categories
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" }
  });

  // Safe client serialization
  const serializedProducts = JSON.parse(JSON.stringify(products));
  const serializedCategories = JSON.parse(JSON.stringify(categories));

  return (
    <SellerProductManager 
      products={serializedProducts} 
      categories={serializedCategories} 
    />
  );
}
