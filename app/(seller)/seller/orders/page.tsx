import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import SellerOrderManager from "./SellerOrderManager";

export default async function SellerOrdersPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) redirect("/sell");

  const products = await prisma.product.findMany({
    where: { sellerId: seller.id },
    select: { id: true }
  });

  const productIds = products.map(p => p.id);

  const orderItems = await prisma.orderItem.findMany({
    where: { variant: { productId: { in: productIds } } },
    include: {
      order: {
        include: {
          user: { select: { name: true, email: true, phone: true } },
          shippingAddress: true
        }
      },
      variant: {
        include: {
          product: {
            select: { title: true, images: true }
          }
        }
      }
    },
    orderBy: { order: { createdAt: "desc" } }
  });

  return <SellerOrderManager orderItems={JSON.parse(JSON.stringify(orderItems))} />;
}
