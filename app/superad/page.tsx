import React from "react";
import { checkSuperAdmin } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import MacroActionsPanel from "./MacroActionsPanel";

export default async function SuperadDashboard() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/login?error=unauthorized_god_mode");

  // Fetch quick stats for overview
  const [
    userCount, sellerCount, productCount, orderCount, warehouseCount,
    pendingSellers, pendingReturns, totalRevenue
  ] = await Promise.all([
    prisma.user.count(),
    prisma.seller.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.warehouse.count(),
    prisma.sellerApplication.count({ where: { status: "PENDING" } }),
    prisma.sellerOrder.count({ where: { status: "RETURN_REQUESTED" } }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: "DELIVERED" } })
  ]);

  const revenue = totalRevenue._sum.totalAmount || 0;

  const stats = [
    { label: "Total Users", value: userCount, icon: "bi-people", color: "primary" },
    { label: "Active Sellers", value: sellerCount, icon: "bi-shop", color: "success" },
    { label: "Products Catalog", value: productCount, icon: "bi-box-seam", color: "info" },
    { label: "Global Orders", value: orderCount, icon: "bi-cart-check", color: "warning" },
    { label: "Warehouses", value: warehouseCount, icon: "bi-building", color: "secondary" },
  ];

  // Mock data for graphs and logs
  const graphData = [35, 45, 30, 60, 55, 75, 90, 85, 110, 100, 120, 140];
  const maxGraph = Math.max(...graphData);

  const mockLogs = [
    { time: "2 mins ago", action: "WIPE_USER", target: "u_abc123", status: "SUCCESS" },
    { time: "15 mins ago", action: "FORCE_DELIVER", target: "ord_9982", status: "SUCCESS" },
    { time: "1 hour ago", action: "ARCHIVE_SELLER", target: "sel_987x", status: "SUCCESS" },
    { time: "3 hours ago", action: "CONFIG_UPDATE", target: "System.Payout", status: "WARNING" },
  ];

  return (
    <div className="fade-in">
      
      {/* Top Analytics Row */}
      <div className="row g-4 mb-5">
        {/* Financial Pulse */}
        <div className="col-lg-8">
          <div className="p-4 rounded-4 h-100 position-relative overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}>
            <div className="position-absolute top-0 end-0 p-4 opacity-25">
              <i className="bi bi-graph-up-arrow" style={{ fontSize: "10rem", color: "var(--bs-primary)" }}></i>
            </div>
            
            <div className="position-relative z-1 d-flex justify-content-between align-items-start mb-4">
              <div>
                <h5 className="fw-bolder text-white mb-1"><i className="bi bi-wallet2 text-primary me-2"></i>Financial Pulse</h5>
                <p className="text-muted small mb-0">Total delivered GMV and 30-day growth trajectory.</p>
              </div>
              <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50">+24.5% MoM</span>
            </div>

            <div className="position-relative z-1">
              <div className="fw-bolder text-white lh-1 mb-4" style={{ fontSize: "3.5rem" }}>₹{revenue.toLocaleString()}</div>
              
              {/* Custom CSS Bar Graph */}
              <div className="d-flex align-items-end gap-2 mt-4" style={{ height: "100px" }}>
                {graphData.map((val, idx) => (
                  <div key={idx} className="flex-grow-1 rounded-top" style={{ 
                    height: `${(val / maxGraph) * 100}%`, 
                    background: idx === graphData.length - 1 ? "var(--bs-primary)" : "rgba(255,255,255,0.1)",
                    transition: "height 1s ease"
                  }}></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="col-lg-4">
          <div className="p-4 rounded-4 h-100 d-flex flex-column" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}>
            <h5 className="fw-bolder text-white mb-4"><i className="bi bi-cpu text-info me-2"></i>System Health</h5>
            
            <div className="flex-grow-1 d-flex flex-column justify-content-center gap-4">
              <div>
                <div className="d-flex justify-content-between text-muted small mb-1 fw-bold">
                  <span>DB Connection Pool</span>
                  <span className="text-white">42 / 100</span>
                </div>
                <div className="progress bg-dark" style={{ height: "6px" }}>
                  <div className="progress-bar bg-info" style={{ width: "42%" }}></div>
                </div>
              </div>
              
              <div>
                <div className="d-flex justify-content-between text-muted small mb-1 fw-bold">
                  <span>Storage (Images)</span>
                  <span className="text-white">68%</span>
                </div>
                <div className="progress bg-dark" style={{ height: "6px" }}>
                  <div className="progress-bar bg-warning" style={{ width: "68%" }}></div>
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between text-muted small mb-1 fw-bold">
                  <span>Background Workers</span>
                  <span className="text-danger pulse-dot">95%</span>
                </div>
                <div className="progress bg-dark" style={{ height: "6px" }}>
                  <div className="progress-bar bg-danger" style={{ width: "95%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="row g-4 mb-5">
        {stats.map((s, i) => (
          <div key={i} className="col-md-4 col-lg">
            <div className="p-4 rounded-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", transition: "all 0.3s" }}>
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
        <div className="col-lg-4 d-flex flex-column gap-4">
          <div className="rounded-4 p-4" style={{ background: "linear-gradient(145deg, rgba(230,57,70,0.1) 0%, rgba(20,20,25,0) 100%)", border: "1px solid rgba(230,57,70,0.2)" }}>
            <h6 className="fw-bolder text-white mb-4 d-flex align-items-center text-uppercase tracking-wide small" style={{ letterSpacing: "1px" }}>
              <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i> Action Required
            </h6>
            
            <div className="d-flex flex-column gap-3">
              <div className="d-flex justify-content-between align-items-center p-3 rounded-3" style={{ background: "rgba(0,0,0,0.3)" }}>
                <div>
                  <div className="fw-bold text-white fs-6">Pending Sellers</div>
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>Awaiting KYC verification</div>
                </div>
                <div className="fs-4 fw-bolder text-danger">{pendingSellers}</div>
              </div>
              
              <div className="d-flex justify-content-between align-items-center p-3 rounded-3" style={{ background: "rgba(0,0,0,0.3)" }}>
                <div>
                  <div className="fw-bold text-white fs-6">Return Requests</div>
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>Require manual dispute handling</div>
                </div>
                <div className="fs-4 fw-bolder text-warning">{pendingReturns}</div>
              </div>
            </div>
          </div>

          <div className="rounded-4 p-4 flex-grow-1" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <h6 className="fw-bolder text-white mb-4 d-flex align-items-center text-uppercase tracking-wide small" style={{ letterSpacing: "1px" }}>
              <i className="bi bi-terminal text-success me-2"></i> Live Audit Feed
            </h6>
            
            <div className="d-flex flex-column gap-3">
              {mockLogs.map((log, i) => (
                <div key={i} className="d-flex align-items-start gap-3 pb-3 border-bottom border-secondary border-opacity-10 last-border-none">
                  <div className={`mt-1 rounded-circle bg-${log.status === 'SUCCESS' ? 'success' : 'warning'} bg-opacity-25 d-flex align-items-center justify-content-center border border-${log.status === 'SUCCESS' ? 'success' : 'warning'} border-opacity-50`} style={{ width: 8, height: 8 }}></div>
                  <div>
                    <div className="fw-bold text-white small font-monospace">{log.action} <span className="text-muted">-></span> {log.target}</div>
                    <div className="text-muted" style={{ fontSize: "0.65rem" }}>{log.time} by admin_sys</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Joint-Table Macros Panel */}
        <div className="col-lg-8">
          <MacroActionsPanel />
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .last-border-none:last-child { border-bottom: none !important; padding-bottom: 0 !important; }
      `}} />
    </div>
  );
}
