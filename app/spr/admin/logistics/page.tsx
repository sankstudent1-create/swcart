import { prisma } from "@/lib/db";
import { checkSuperAdmin } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import LogisticsManager from "./LogisticsManager";

export default async function LogisticsPage() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const warehouses = await prisma.warehouse.findMany({
    include: { staff: { include: { user: true } } }
  });
  const vehicles = await prisma.vehicle.findMany();
  const deliveryAgents = await prisma.deliveryPerson.findMany({
    include: { user: true, warehouse: true, orders: { where: { status: "SHIPPED" } } }
  });
  const users = await prisma.user.findMany({
    where: { roles: { none: { role: { name: "DELIVERY" } } } }
  });
  
  // Orders pending dispatch (Not assigned to a warehouse yet)
  const dbOrders = await prisma.order.findMany({
    where: { status: { in: ["PENDING", "PROCESSING"] }, assignedWarehouseId: null, deliveryPersonId: null },
    include: { user: true, shippingAddress: true, sellerOrders: { include: { items: true } } },
    orderBy: { createdAt: "desc" }
  });

  const orders = dbOrders.map(o => ({
    ...o,
    items: o.sellerOrders.flatMap(so => so.items)
  }));

  return (
    <LogisticsManager 
      warehouses={warehouses} 
      vehicles={vehicles} 
      deliveryAgents={deliveryAgents} 
      users={users} 
      orders={orders} 
    />
  );
}
