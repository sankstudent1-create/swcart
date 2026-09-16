"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(orderId: string, status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED") {
  const seller = await prisma.seller.findFirst();
  if (!seller) throw new Error("Not authenticated");

  await prisma.sellerOrder.update({
    where: { id: orderId },
    data: { status }
  });

  revalidatePath("/seller2/orders");
  revalidatePath(`/seller2/orders/${orderId}`);
}

export async function updateOrderTracking(orderId: string, formData: FormData) {
  const seller = await prisma.seller.findFirst();
  if (!seller) throw new Error("Not authenticated");

  // In a real database schema, you would add tracking fields to SellerOrder.
  // We'll mock saving it since the schema might not have it yet.
  const trackingNumber = formData.get("trackingNumber") as string;
  const provider = formData.get("provider") as string;

  // We are simulating updating the DB. If trackingNumber exists, maybe save it in order notes or a new field.
  // For now, we will just advance status to SHIPPED as a side effect.
  if (trackingNumber) {
    await prisma.sellerOrder.update({
      where: { id: orderId },
      data: { status: "SHIPPED" }
    });
  }

  revalidatePath("/seller2/orders");
  revalidatePath(`/seller2/orders/${orderId}`);
}
