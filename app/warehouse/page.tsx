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

  const orders = await prisma.order.findMany({
    where: { assignedWarehouseId: warehouseId, status: "PROCESSING", deliveryPersonId: null },
    include: { user: true, shippingAddress: true, items: true },
    orderBy: { createdAt: "desc" }
  });

  const localAgents = await prisma.deliveryPerson.findMany({
    where: { warehouseId },
    include: { user: true, orders: { where: { status: "SHIPPED" } } }
  });

  return (
    <WarehouseDashboard 
      warehouse={staffRecord.warehouse} 
      orders={orders} 
      localAgents={localAgents} 
    />
  );
}
