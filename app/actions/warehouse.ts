"use server";

import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/app/actions/auth";
import { revalidatePath } from "next/cache";

export async function assignAgentToOrderAction(orderId: string, deliveryPersonId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    const isManager = await prisma.userRole.findFirst({
      where: { userId, role: { name: "WAREHOUSE_MANAGER" } }
    });
    if (!isManager) return { success: false, message: "Unauthorized" };

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { success: false, message: "Order not found" };

    await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryPersonId,
        status: "SHIPPED"
      }
    });

    await prisma.trackingHistory.create({
      data: {
        orderId,
        status: "Out for Delivery",
        location: "Local Dispatch"
      }
    });

    revalidatePath("/warehouse");
    return { success: true, message: "Order assigned to agent successfully" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to assign order" };
  }
}
