import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import SellerReviewManager from "./SellerReviewManager";

export default async function SellerReviewsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) redirect("/sell");

  const rawReviews = await prisma.review.findMany({
    where: { product: { sellerId: seller.id } },
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { title: true, images: true, id: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return <SellerReviewManager reviews={JSON.parse(JSON.stringify(rawReviews))} />;
}
