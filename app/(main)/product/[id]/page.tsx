import Link from "next/link";
import { prisma } from "@/lib/db";
import { getProductById } from "@/lib/queries";
import ProductDetailClient from "./ProductDetailClient";
import { notFound } from "next/navigation";
import { getSessionUserId } from "@/app/actions/auth";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getProductById(id);

  if (!p) notFound();

  const userId = await getSessionUserId();
  let hasPurchasedAndDelivered = false;
  if (userId) {
    // 1. Check if they have an active course enrollment
    const enrollment = await prisma.userCourseEnrollment.findUnique({
      where: { userId_productId: { userId, productId: id } }
    });
    
    if (enrollment) {
      hasPurchasedAndDelivered = true;
    } else {
      // 2. Fallback: check if they bought it via a paid/delivered order
      const deliveredOrder = await prisma.order.findFirst({
        where: {
          userId,
          status: { in: ["DELIVERED", "COMPLETED"] },
          sellerOrders: {
            some: {
              items: {
                some: {
                  variant: {
                    productId: id
                  }
                }
              }
            }
          }
        }
      });
      if (deliveredOrder) {
        hasPurchasedAndDelivered = true;
      }
    }
  }

  // Serialize dates
  const product = JSON.parse(JSON.stringify(p));

  return <ProductDetailClient product={product} hasPurchasedAndDelivered={hasPurchasedAndDelivered} />;
}
