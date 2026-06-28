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

export async function receivePackageAction(orderId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    const staff = await prisma.warehouseStaff.findUnique({ where: { userId }, include: { warehouse: true } });
    if (!staff) return { success: false, message: "Unauthorized" };

    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: "AT_HUB",
        deliveryPersonId: null
      }
    });

    await prisma.trackingHistory.create({
      data: {
        orderId,
        status: "Arrived at Hub",
        location: staff.warehouse.name
      }
    });

    revalidatePath("/warehouse");
    return { success: true, message: "Package received at hub" };
  } catch (err: any) {
    return { success: false, message: "Failed to receive package" };
  }
}

export async function forwardPackageAction(orderId: string, targetWarehouseId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    const staff = await prisma.warehouseStaff.findUnique({ where: { userId }, include: { warehouse: true } });
    if (!staff) return { success: false, message: "Unauthorized" };

    await prisma.order.update({
      where: { id: orderId },
      data: {
        assignedWarehouseId: targetWarehouseId,
        status: "IN_TRANSIT_TO_HUB"
      }
    });

    await prisma.trackingHistory.create({
      data: {
        orderId,
        status: "Forwarded to Next Hub",
        location: `Dispatched from ${staff.warehouse.name}`
      }
    });

    revalidatePath("/warehouse");
    return { success: true, message: "Package forwarded" };
  } catch (err: any) {
    return { success: false, message: "Failed to forward package" };
  }
}

export async function registerWarehouseAgentAction(userIdToRegister: string, vehicleId: string | null) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    const staff = await prisma.warehouseStaff.findUnique({
      where: { userId },
      include: { warehouse: true }
    });
    if (!staff) return { success: false, message: "Unauthorized: Not a Warehouse Manager" };

    // 1. Ensure the user exists
    const targetUser = await prisma.user.findUnique({ where: { id: userIdToRegister } });
    if (!targetUser) return { success: false, message: "User not found" };

    // 2. Assign role DELIVERY
    let role = await prisma.role.findUnique({ where: { name: "DELIVERY" } });
    if (!role) role = await prisma.role.create({ data: { name: "DELIVERY" } });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: userIdToRegister, roleId: role.id } },
      update: {}, create: { userId: userIdToRegister, roleId: role.id }
    });

    // 3. Create or update DeliveryPerson profile
    await prisma.deliveryPerson.upsert({
      where: { userId: userIdToRegister },
      update: { vehicleId: vehicleId || null, warehouseId: staff.warehouseId },
      create: { userId: userIdToRegister, vehicleId: vehicleId || null, warehouseId: staff.warehouseId }
    });

    revalidatePath("/warehouse");
    return { success: true, message: "Delivery Agent registered successfully" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to register delivery agent" };
  }
}

export async function updateWarehouseAgentAction(deliveryPersonId: string, vehicleId: string | null) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    const staff = await prisma.warehouseStaff.findUnique({ where: { userId } });
    if (!staff) return { success: false, message: "Unauthorized" };

    await prisma.deliveryPerson.update({
      where: { id: deliveryPersonId, warehouseId: staff.warehouseId },
      data: { vehicleId: vehicleId || null }
    });

    revalidatePath("/warehouse");
    return { success: true, message: "Agent vehicle updated successfully" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update agent" };
  }
}

export async function removeWarehouseAgentAction(deliveryPersonId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    const staff = await prisma.warehouseStaff.findUnique({ where: { userId } });
    if (!staff) return { success: false, message: "Unauthorized" };

    await prisma.deliveryPerson.update({
      where: { id: deliveryPersonId, warehouseId: staff.warehouseId },
      data: { warehouseId: null, vehicleId: null }
    });

    revalidatePath("/warehouse");
    return { success: true, message: "Agent removed from hub" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to remove agent" };
  }
}
