"use server";

import { prisma } from "@/lib/db";
import { checkSuperAdmin } from "./auth";
import { revalidatePath } from "next/cache";

export async function createWarehouseAction(data: { name: string, location: string }) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };
  try {
    await prisma.warehouse.create({ data });
    revalidatePath("/spr/admin/logistics");
    return { success: true, message: "Warehouse created" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to create warehouse" };
  }
}

export async function deleteWarehouseAction(id: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };
  try {
    await prisma.warehouse.delete({ where: { id } });
    revalidatePath("/spr/admin/logistics");
    return { success: true, message: "Warehouse deleted" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to delete warehouse" };
  }
}

export async function createVehicleAction(data: { licensePlate: string, type: string, capacity: number }) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };
  try {
    await prisma.vehicle.create({ data: { ...data, licensePlate: data.licensePlate.toUpperCase() } });
    revalidatePath("/spr/admin/logistics");
    return { success: true, message: "Vehicle created" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to create vehicle" };
  }
}

export async function deleteVehicleAction(id: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };
  try {
    await prisma.vehicle.delete({ where: { id } });
    revalidatePath("/spr/admin/logistics");
    return { success: true, message: "Vehicle deleted" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to delete vehicle" };
  }
}

export async function assignDeliveryAgentAction(userId: string, vehicleId: string | null) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };
  try {
    // Ensure they have the role
    let role = await prisma.role.findUnique({ where: { name: "DELIVERY" } });
    if (!role) role = await prisma.role.create({ data: { name: "DELIVERY" } });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {}, create: { userId, roleId: role.id }
    });
    
    // Upsert DeliveryPerson profile
    await prisma.deliveryPerson.upsert({
      where: { userId },
      update: { vehicleId: vehicleId || null },
      create: { userId, vehicleId: vehicleId || null }
    });
    
    revalidatePath("/spr/admin/logistics");
    return { success: true, message: "Delivery Agent assigned" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to assign delivery agent" };
  }
}

export async function dispatchOrderAction(orderId: string, deliveryPersonId: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryPersonId,
        shippingProvider: "Internal Delivery",
        status: "SHIPPED",
        trackingNumber: "SW-" + Date.now().toString().slice(-8)
      }
    });

    await prisma.trackingHistory.create({
      data: {
        orderId,
        status: "Shipped",
        location: "Warehouse Dispatch",
      }
    });
    revalidatePath("/spr/admin/logistics");
    return { success: true, message: "Order Dispatched to Agent" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to dispatch order" };
  }
}
