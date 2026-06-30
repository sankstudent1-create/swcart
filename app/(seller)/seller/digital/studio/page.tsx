import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import DigitalStudioManager from "./DigitalStudioManager";

export default async function DigitalStudioPage(props: { searchParams: Promise<{ id?: string }> }) {
  const searchParams = await props.searchParams;
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) redirect("/sell");

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  let product = null;
  if (searchParams.id) {
    product = await prisma.product.findUnique({
      where: { id: searchParams.id },
      include: {
        digitalAssets: true,
        courseChapters: {
          include: { 
            lessons: { 
              orderBy: { order: "asc" },
              include: { quizQuestions: true }
            } 
          },
          orderBy: { order: "asc" }
        }
      }
    });

    // Make sure they own this product
    if (product && product.sellerId !== seller.id) {
      redirect("/seller/digital");
    }
  }

  return (
    <DigitalStudioManager
      categories={categories}
      product={product ? JSON.parse(JSON.stringify(product)) : null}
    />
  );
}
