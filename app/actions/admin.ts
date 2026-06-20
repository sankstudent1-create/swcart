"use server";

import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateOrderStatusAction(orderId: string, status: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });
    revalidatePath("/spr/admin/orders");
    revalidatePath("/spr/admin");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to update order status" };
  }
}

export async function updateSettingsAction(formData: FormData) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    const defaultGst = parseFloat(formData.get("defaultGst") as string) || 18;
    const deliveryFee = parseFloat(formData.get("deliveryFee") as string) || 50;
    const freeShippingThresh = parseFloat(formData.get("freeShippingThresh") as string) || 499;
    const contactEmail = formData.get("contactEmail") as string || "support@swcart.com";

    await prisma.siteSetting.upsert({
      where: { id: "GLOBAL" },
      update: { defaultGst, deliveryFee, freeShippingThresh, contactEmail },
      create: { id: "GLOBAL", defaultGst, deliveryFee, freeShippingThresh, contactEmail }
    });

    revalidatePath("/spr/admin/settings");
    return { success: true, message: "Settings updated successfully" };
  } catch (error) {
    return { success: false, message: "Failed to update settings" };
  }
}
