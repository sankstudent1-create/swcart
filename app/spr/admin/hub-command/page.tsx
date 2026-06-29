import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import HubCommandClient from "./HubCommandClient";

export default async function HubCommandPage({ searchParams }: { searchParams: { hub?: string } }) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  // Fetch all warehouses for the dropdown
  const allWarehouses = await prisma.warehouse.findMany({
    select: { id: true, name: true, location: true },
    orderBy: { name: "asc" }
  });

  const selectedHubId = searchParams.hub || (allWarehouses.length > 0 ? allWarehouses[0].id : null);

  let hubData = null;

  if (selectedHubId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      warehouse,
      todayOrders,
      historicalOrders,
      ordersByStatusRaw,
      localAgents,
      trackingLogs,
      inventory
    ] = await Promise.all([
      prisma.warehouse.findUnique({
        where: { id: selectedHubId },
        include: { staff: { include: { user: { select: { name: true, email: true } } } } }
      }),
      prisma.order.findMany({
        where: { assignedWarehouseId: selectedHubId, createdAt: { gte: today } },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" }
      }),
      prisma.order.findMany({
        where: { assignedWarehouseId: selectedHubId, createdAt: { gte: thirtyDaysAgo } },
        include: { user: { select: { name: true, email: true } }, deliveryPerson: { include: { user: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" }
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: { assignedWarehouseId: selectedHubId },
        _count: { status: true }
      }),
      prisma.deliveryPerson.findMany({
        where: { warehouseId: selectedHubId },
        include: { 
          user: { select: { name: true, email: true, phone: true } }, 
          vehicle: true,
          orders: { where: { status: "SHIPPED" }, select: { id: true } }
        }
      }),
      prisma.trackingHistory.findMany({
        where: { order: { assignedWarehouseId: selectedHubId } },
        include: { order: { select: { trackingNumber: true } } },
        orderBy: { timestamp: "desc" },
        take: 30
      }),
      prisma.inventory.findMany({
        where: { warehouseId: selectedHubId },
        include: { variant: { include: { product: { select: { title: true } } }, sku: true } }
      })
    ]);

    // Format orders by status
    const ordersByStatus = ordersByStatusRaw.map(o => ({
      status: o.status,
      count: o._count.status
    }));

    // 7-day order trend
    const last7Days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayOrders = historicalOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= dayStart && orderDate < dayEnd;
      });

      last7Days.push({
        label: dayStart.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
        count: dayOrders.length
      });
    }

    hubData = {
      warehouse,
      todayOrders,
      historicalOrders,
      ordersByStatus,
      localAgents,
      trackingLogs,
      inventory,
      last7Days
    };
  }

  return (
    <HubCommandClient 
      allWarehouses={allWarehouses} 
      selectedHubId={selectedHubId} 
      hubData={hubData} 
    />
  );
}
