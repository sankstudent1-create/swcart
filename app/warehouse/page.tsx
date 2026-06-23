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
    where: { assignedWarehouseId: warehouseId, status: "IN_TRANSIT_TO_HUB", deliveryPersonId: null },
    include: { user: true, shippingAddress: true, items: true },
    orderBy: { createdAt: "desc" }
  });

  const atHubOrders = await prisma.order.findMany({
    where: { assignedWarehouseId: warehouseId, status: "AT_HUB", deliveryPersonId: null },
    include: { user: true, shippingAddress: true, items: true },
    orderBy: { createdAt: "desc" }
  });

  const localAgents = await prisma.deliveryPerson.findMany({
    where: { warehouseId },
    include: { user: true, orders: { where: { status: "SHIPPED" } } }
  });

  const allWarehouses = await prisma.warehouse.findMany({
    where: { id: { not: warehouseId } }
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
      localAgents={localAgents} 
      allWarehouses={allWarehouses}
      analytics={analytics}
    />
  );
}
