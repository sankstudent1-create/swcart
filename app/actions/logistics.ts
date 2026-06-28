"use server";

import { prisma } from "@/lib/db";
import { checkSuperAdmin } from "./auth";
import { revalidatePath } from "next/cache";

export async function createWarehouseAction(data: { name: string; location: string; pincodes: string[] }) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };
  try {
    await prisma.warehouse.create({
      data: { name: data.name, location: data.location, pincodes: data.pincodes }
    });
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

export async function updateWarehouseAction(id: string, data: { name: string; location: string; pincodes: string[] }) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };
  try {
    await prisma.warehouse.update({
      where: { id },
      data: { name: data.name, location: data.location, pincodes: data.pincodes }
    });
    revalidatePath("/spr/admin/logistics");
    return { success: true, message: "Warehouse updated" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update warehouse" };
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

export async function assignDeliveryAgentAction(userId: string, vehicleId: string | null, warehouseId: string | null) {
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
      update: { vehicleId: vehicleId || null, warehouseId: warehouseId || null },
      create: { userId, vehicleId: vehicleId || null, warehouseId: warehouseId || null }
    });
    
    revalidatePath("/spr/admin/logistics");
    return { success: true, message: "Delivery Agent assigned" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to assign delivery agent" };
  }
}

export async function assignWarehouseStaffAction(userId: string, warehouseId: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };
  try {
    let role = await prisma.role.findUnique({ where: { name: "WAREHOUSE_MANAGER" } });
    if (!role) role = await prisma.role.create({ data: { name: "WAREHOUSE_MANAGER" } });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {}, create: { userId, roleId: role.id }
    });

    await prisma.warehouseStaff.upsert({
      where: { userId },
      update: { warehouseId },
      create: { userId, warehouseId }
    });

    revalidatePath("/spr/admin/logistics");
    return { success: true, message: "Warehouse Manager assigned" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to assign warehouse manager" };
  }
}

export async function dispatchOrderAction(orderId: string, assignedWarehouseId: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        assignedWarehouseId,
        shippingProvider: "Internal Delivery",
        status: "IN_TRANSIT_TO_HUB",
        trackingNumber: "SW-" + Date.now().toString().slice(-8)
      }
    });

    await prisma.trackingHistory.create({
      data: {
        orderId,
        status: "In Transit to Hub",
        location: "Dispatched from Origin",
      }
    });
    revalidatePath("/spr/admin/logistics");
    return { success: true, message: "Order Dispatched to Agent" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to dispatch order" };
  }
}

export async function autoRouteLogisticsAction(sellerOrderId: string) {
  try {
    const sellerOrder = await prisma.sellerOrder.findUnique({
      where: { id: sellerOrderId },
      include: { seller: true, order: true }
    });

    if (!sellerOrder) return { success: false, message: "Order not found" };

    const pickupPincode = sellerOrder.seller.pickupPincode;
    if (!pickupPincode) {
      return { success: false, message: "Store Pickup Pincode not set. Please update your Seller Settings." };
    }

    // 1. Hub Identification
    const warehouses = await prisma.warehouse.findMany();
    const nearestWarehouse = warehouses.find(w => w.pincodes.includes(pickupPincode));

    if (!nearestWarehouse) {
      return { success: false, message: "No Swcart Hub available for your pincode area." };
    }

    // 2. First-Mile Assignment
    const availableAgent = await prisma.deliveryPerson.findFirst({
      where: { warehouseId: nearestWarehouse.id },
      include: { user: true }
    });

    if (!availableAgent) {
      return { success: false, message: "No delivery agents currently available at the assigned hub." };
    }

    // 3. Status Update
    await prisma.$transaction([
      prisma.sellerOrder.update({
        where: { id: sellerOrderId },
        data: { 
          status: "READY_FOR_PICKUP",
          shippingProvider: "Internal Logistics",
          trackingNumber: `SW-${sellerOrderId.slice(-6).toUpperCase()}`
        }
      }),
      prisma.trackingHistory.create({
        data: {
          orderId: sellerOrder.orderId,
          status: "Pickup Assigned",
          location: `Agent (${availableAgent.user.name}) assigned from ${nearestWarehouse.name}`,
          timestamp: new Date()
        }
      }),
      // Also update parent Order
      prisma.order.update({
        where: { id: sellerOrder.orderId },
        data: {
          assignedWarehouseId: nearestWarehouse.id,
          deliveryPersonId: availableAgent.id,
          status: "PROCESSING"
        }
      })
    ]);

    revalidatePath("/seller/orders");
    return { success: true, message: `Routed to ${nearestWarehouse.name}. Agent assigned for pickup.` };
  } catch (error: any) {
    return { success: false, message: error.message || "Routing failed" };
  }
}
