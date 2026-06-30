import React from "react";
import { checkSuperAdmin } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import LogisticsCommand from "./LogisticsCommand";

export default async function SuperadLogisticsPage() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/login?error=unauthorized_god_mode");

  const warehouses = await prisma.warehouse.findMany({
    include: {
      staff: { include: { user: true } },
      inventory: true,
      _count: { select: { inventory: true } }
    }
  });

  const vehicles = await prisma.vehicle.findMany();
  
  const deliveryAgents = await prisma.deliveryPerson.findMany({
    include: { user: true, warehouse: true, vehicle: true }
  });

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 className="fw-bolder text-white mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-truck text-warning"></i> Fleet & Hub Controller
          </h2>
          <p className="text-muted small mb-0">Manage the logistics network, route bulk orders, and assign fleet vehicles.</p>
        </div>
      </div>

      <LogisticsCommand 
        initialWarehouses={warehouses} 
        initialVehicles={vehicles}
        initialAgents={deliveryAgents}
      />
    </div>
  );
}
