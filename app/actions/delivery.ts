"use server";

import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/app/actions/auth";
import { revalidatePath } from "next/cache";

export async function updateDeliveryStatusAction(orderId: string, status: string, location: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    const deliveryPerson = await prisma.deliveryPerson.findUnique({ where: { userId } });
    if (!deliveryPerson) return { success: false, message: "Not a delivery agent" };

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.deliveryPersonId !== deliveryPerson.id) {
      return { success: false, message: "Order not assigned to you" };
    }

    // Update order status if DELIVERED or RETURNED
    let orderStatus = order.status;
    if (status === "Delivered") orderStatus = "DELIVERED";
    if (status === "Failed Attempt") orderStatus = "PROCESSING"; // Keep it processing or pending
    if (status === "Out for Delivery") orderStatus = "SHIPPED";
    if (status === "Picked Up") orderStatus = "IN_TRANSIT_TO_HUB";

    await prisma.order.update({
      where: { id: orderId },
      data: { status: orderStatus }
    });

    await prisma.trackingHistory.create({
      data: {
        orderId,
        status,
        location
      }
    });

    revalidatePath("/delivery");
    return { success: true, message: `Status updated to ${status}` };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update status" };
  }
}
