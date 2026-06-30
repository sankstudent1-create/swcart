import React from "react";
import { checkSuperAdmin } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import MacroActionsPanel from "./MacroActionsPanel";

export default async function SuperadDashboard() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/login?error=unauthorized_god_mode");

  // Fetch quick stats for overview
  const [
    userCount, sellerCount, productCount, orderCount, warehouseCount,
    pendingSellers, pendingReturns
  ] = await Promise.all([
    prisma.user.count(),
    prisma.seller.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.warehouse.count(),
    prisma.sellerApplication.count({ where: { status: "PENDING" } }),
    prisma.sellerOrder.count({ where: { status: "RETURN_REQUESTED" } })
  ]);

  const stats = [
    { label: "Total Users", value: userCount, icon: "bi-people", color: "primary" },
    { label: "Active Sellers", value: sellerCount, icon: "bi-shop", color: "success" },
    { label: "Products Catalog", value: productCount, icon: "bi-box-seam", color: "info" },
    { label: "Global Orders", value: orderCount, icon: "bi-cart-check", color: "warning" },
    { label: "Warehouses", value: warehouseCount, icon: "bi-building", color: "secondary" },
  ];

  return (
    <div className="fade-in">
      <div className="mb-5">
        <h1 className="fw-bolder text-white mb-2" style={{ letterSpacing: "-1px" }}>Data Control Center</h1>
        <p className="text-muted fs-5">Execute global macros and manage all raw database entities directly.</p>
      </div>

      {/* Stats Grid */}
      <div className="row g-4 mb-5">
        {stats.map((s, i) => (
          <div key={i} className="col-md-4 col-lg">
            <div className="p-4 rounded-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className={`text-${s.color} mb-3`}>
                <i className={`bi ${s.icon} fs-3`}></i>
              </div>
              <div className="fw-bolder fs-2 text-white lh-1 mb-1">{s.value.toLocaleString()}</div>
              <div className="text-muted small fw-semibold text-uppercase tracking-wide" style={{ letterSpacing: "1px" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Alerts & Actionable Items */}
        <div className="col-lg-4">
          <div className="rounded-4 p-4 h-100" style={{ background: "rgba(230,57,70,0.05)", border: "1px solid rgba(230,57,70,0.2)" }}>
            <h5 className="fw-bolder text-white mb-4 d-flex align-items-center">
              <i className="bi bi-bell-fill text-danger me-2"></i> Attention Required
            </h5>
            
            <div className="d-flex flex-column gap-3">
              <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-dark bg-opacity-50">
                <div>
                  <div className="fw-bold text-white">Pending Sellers</div>
                  <div className="text-muted small">Applications waiting review</div>
                </div>
                <div className="fs-3 fw-bolder text-danger">{pendingSellers}</div>
              </div>
              
              <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-dark bg-opacity-50">
                <div>
                  <div className="fw-bold text-white">Pending Returns</div>
                  <div className="text-muted small">Returns requested by users</div>
                </div>
                <div className="fs-3 fw-bolder text-warning">{pendingReturns}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Joint-Table Macros Panel */}
        <div className="col-lg-8">
          <MacroActionsPanel />
        </div>
      </div>
    </div>
  );
}
