import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import WarehouseDashboard from "./WarehouseDashboard";

export default async function WarehousePage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const staffRecord = await prisma.warehouseStaff.findUnique({
    where: { userId },
    include: { warehouse: true }
  });

  if (!staffRecord) redirect("/");

  const warehouseId = staffRecord.warehouseId;

  const inboundOrders = await prisma.order.findMany({
    where: { assignedWarehouseId: warehouseId, status: "IN_TRANSIT_TO_HUB" },
    include: { user: true, shippingAddress: true },
    orderBy: { createdAt: "desc" }
  });

  const atHubOrders = await prisma.order.findMany({
    where: { assignedWarehouseId: warehouseId, status: "AT_HUB", deliveryPersonId: null },
    include: { user: true, shippingAddress: true },
    orderBy: { createdAt: "desc" }
  });

  const outboundOrders = await prisma.order.findMany({
    where: { assignedWarehouseId: warehouseId, status: { in: ["SHIPPED", "DELIVERED"] }, deliveryPersonId: { not: null } },
    include: { user: true, shippingAddress: true, deliveryPerson: { include: { user: true, vehicle: true } } },
    orderBy: { updatedAt: "desc" },
    take: 50
  });

  const localAgents = await prisma.deliveryPerson.findMany({
    where: { warehouseId },
    include: { user: true, orders: { where: { status: "SHIPPED" } } }
  });

  const allWarehouses = await prisma.warehouse.findMany({
    where: { id: { not: warehouseId } }
  });

  const users = await prisma.user.findMany({
    where: { roles: { none: { role: { name: "DELIVERY" } } } },
    orderBy: { name: "asc" }
  });

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { licensePlate: "asc" }
  });

  const pendingPickups = await prisma.order.findMany({
    where: { assignedWarehouseId: warehouseId, status: "PROCESSING", deliveryPersonId: { not: null } },
    include: {
      user: true,
      deliveryPerson: { include: { user: true } },
      sellerOrders: {
        include: {
          seller: true,
          items: { include: { variant: { include: { product: true } } } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const trackingLogs = await prisma.trackingHistory.findMany({
    where: { order: { assignedWarehouseId: warehouseId } },
    include: { order: true },
    orderBy: { timestamp: "desc" },
    take: 20
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const analytics = {
    outForDelivery: await prisma.order.count({ where: { assignedWarehouseId: warehouseId, status: "SHIPPED", deliveryPersonId: { not: null } } }),
    deliveredToday: await prisma.order.count({ where: { assignedWarehouseId: warehouseId, status: "DELIVERED", updatedAt: { gte: today } } }),
    inTransitToHere: inboundOrders.length,
    readyForSort: atHubOrders.length
  };

  return (
    <WarehouseDashboard 
      warehouse={staffRecord.warehouse} 
      inboundOrders={inboundOrders}
      atHubOrders={atHubOrders}
      outboundOrders={outboundOrders}
      localAgents={localAgents} 
      allWarehouses={allWarehouses}
      analytics={analytics}
      users={users}
      vehicles={vehicles}
      pendingPickups={pendingPickups}
      trackingLogs={trackingLogs}
    />
  );
}
