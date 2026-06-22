import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import SellerOrderManager from "./SellerOrderManager";

export default async function SellerOrdersPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const seller = await prisma.seller.findUnique({
    where: { userId }
  });

  if (!seller) {
    redirect("/sell");
  }

  // Get products owned by seller
  const products = await prisma.product.findMany({
    where: { sellerId: seller.id }
  });

  const productIds = products.map(p => p.id);

  // Fetch order items matching products
  const orderItems = await prisma.orderItem.findMany({
    where: { variant: { productId: { in: productIds } } },
    include: {
      order: {
        include: {
          user: true,
          shippingAddress: true
        }
      },
      variant: {
        include: { product: true }
      }
    },
    orderBy: { order: { createdAt: "desc" } }
  });

  // Client serialization
  const serializedOrderItems = JSON.parse(JSON.stringify(orderItems));

  return (
    <SellerOrderManager orderItems={serializedOrderItems} />
  );
}
