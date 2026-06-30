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

  const rawOrderItems = await prisma.orderItem.findMany({
    where: { variant: { productId: { in: productIds } } },
    include: {
      sellerOrder: {
        include: {
          order: {
            include: {
              user: { select: { name: true, email: true, phone: true } },
              shippingAddress: true,
              coupon: true
            }
          }
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
    orderBy: { sellerOrder: { createdAt: "desc" } }
  });

  // Map back to expected structure so SellerOrderManager continues to work
  const formattedItems = rawOrderItems.map((item: any) => ({
    ...item,
    order: {
      ...item.sellerOrder.order,
      status: item.sellerOrder.status, // use SellerOrder status
      shippingProvider: item.sellerOrder.shippingProvider,
      trackingNumber: item.sellerOrder.trackingNumber,
      id: item.sellerOrder.id // Use SellerOrderId so update actions work correctly
    }
  }));

  return <SellerOrderManager orderItems={JSON.parse(JSON.stringify(formattedItems))} />;
}
