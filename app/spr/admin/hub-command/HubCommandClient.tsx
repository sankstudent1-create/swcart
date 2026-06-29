"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function statusColor(s: string) {
  const map: Record<string, string> = {
    PENDING: "#ff9500", PROCESSING: "#007aff",
    SHIPPED: "#5856d6", DELIVERED: "#34c759",
    CANCELLED: "#ff3b30", RETURNED: "#af52de",
    AT_HUB: "#ffcc00", IN_TRANSIT_TO_HUB: "#00c7be"
  };
  return map[s] || "#999";
}

export default function HubCommandClient({ allWarehouses, selectedHubId, hubData }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");

  const handleHubChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams);
    if (e.target.value) {
      params.set("hub", e.target.value);
    } else {
      params.delete("hub");
    }
    router.push(`/spr/admin/hub-command?${params.toString()}`);
  };

  if (!selectedHubId) {
    return (
      <div className="text-center py-5">
        <h3 className="fw-bold text-dark mb-3">Hub Command Center</h3>
        <p className="text-muted mb-4">Please select a hub to view its data.</p>
        <select className="form-select mx-auto" style={{ maxWidth: 300 }} onChange={handleHubChange} value="">
          <option value="">-- Select Hub --</option>
          {allWarehouses.map((w: any) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>
    );
  }

  if (!hubData || !hubData.warehouse) {
    return <div className="text-center py-5 text-muted">Hub not found or loading error.</div>;
  }

  const { warehouse, todayOrders, historicalOrders, ordersByStatus, localAgents, trackingLogs, inventory, last7Days } = hubData;
  const maxWeeklyCount = Math.max(...last7Days.map((d: any) => d.count), 1);
  const totalOrders = ordersByStatus.reduce((acc: number, curr: any) => acc + curr.count, 0);

  const totalDelivered = ordersByStatus.find((o: any) => o.status === "DELIVERED")?.count || 0;
  const totalInTransit = ordersByStatus.find((o: any) => o.status === "IN_TRANSIT_TO_HUB")?.count || 0;
  const totalAtHub = ordersByStatus.find((o: any) => o.status === "AT_HUB")?.count || 0;

  return (
    <div className="container-fluid p-0 font-jakarta">
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-1px" }}>
            <i className="bi bi-radar me-2 text-danger"></i>Hub Command Center
          </h2>
          <p className="text-muted mb-0 small">Superadmin view: cross-hub intelligence & remote operations</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <label className="text-muted small fw-bold">Select Hub:</label>
          <select 
            className="form-select fw-semibold border-0 shadow-sm" 
            style={{ width: 250, background: "#fff" }} 
            value={selectedHubId} 
            onChange={handleHubChange}
          >
            {allWarehouses.map((w: any) => (
              <option key={w.id} value={w.id}>{w.name} ({w.location})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {[
          { label: "Today's Orders", value: todayOrders.length, sub: "Created today", icon: "bi-calendar-day", color: "#007aff" },
          { label: "Stationed Agents", value: localAgents.length, sub: "Registered at hub", icon: "bi-people", color: "#5856d6" },
          { label: "Total Delivered", value: totalDelivered, sub: "Historical success", icon: "bi-check-circle", color: "#34c759" },
          { label: "Active In-Transit", value: totalInTransit, sub: "Inbound to hub", icon: "bi-truck", color: "#ff9500" },
          { label: "Sorting Deck", value: totalAtHub, sub: "At hub now", icon: "bi-box-seam", color: "#ff3b30" },
        ].map((card, i) => (
          <div key={i} className="col-12 col-sm-6 col-lg">
            <div className="rounded-4 p-3 h-100 position-relative overflow-hidden shadow-sm" style={{ background: "#fff" }}>
              <div className="position-absolute" style={{ bottom: -12, right: -8, fontSize: "4rem", opacity: 0.05, color: card.color }}>
                <i className={`bi ${card.icon}`}></i>
              </div>
              <div className="rounded-3 d-inline-flex align-items-center justify-content-center mb-2" style={{ width: 32, height: 32, background: `${card.color}15`, color: card.color, fontSize: "0.9rem" }}>
                <i className={`bi ${card.icon}`}></i>
              </div>
              <div className="fw-bold text-dark" style={{ fontSize: "1.4rem", lineHeight: 1.1 }}>{card.value}</div>
              <div className="text-muted mt-1 fw-bold text-uppercase" style={{ fontSize: ".65rem", letterSpacing: "0.5px" }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-4 shadow-sm overflow-hidden mb-4">
        <div className="d-flex border-bottom bg-light px-2 pt-2 gap-1 overflow-auto">
          {[
            { id: "overview", label: "Hub Overview", icon: "bi-grid" },
            { id: "orders", label: "Orders Ledger", icon: "bi-receipt" },
            { id: "agents", label: "Agent Fleet", icon: "bi-person-vcard" },
            { id: "inventory", label: "Hub Inventory", icon: "bi-boxes" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn border-0 rounded-top-3 px-4 py-2 fw-bold text-nowrap transition-all ${activeTab === tab.id ? 'bg-white text-danger shadow-sm border-bottom border-danger border-2' : 'text-muted hover-bg-white'}`}
              style={{ fontSize: "0.85rem" }}
            >
              <i className={`bi ${tab.icon} me-2`}></i>{tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 p-lg-5">
          {activeTab === "overview" && (
            <div className="row g-4">
              <div className="col-lg-8 d-flex flex-column gap-4">
                <div className="border rounded-4 p-4">
                  <h6 className="fw-bold mb-4 text-dark"><i className="bi bi-graph-up me-2 text-danger"></i>7-Day Order Volume (Historical)</h6>
                  <div className="d-flex align-items-end gap-2" style={{ height: 180 }}>
                    {last7Days.map((d: any, i: number) => (
                      <div key={i} className="d-flex flex-column align-items-center gap-2 flex-grow-1">
                        <div className="text-muted small fw-bold" style={{ fontSize: ".65rem" }}>
                          {d.count > 0 ? d.count : ""}
                        </div>
                        <div
                          className="w-100 rounded-top-3 transition-all"
                          style={{
                            height: `${Math.max(4, (d.count / maxWeeklyCount) * 100)}%`,
                            background: d.count > 0 ? "linear-gradient(180deg, var(--red) 0%, rgba(232,71,42,0.3) 100%)" : "#f5f5f5",
                            minHeight: 4,
                          }}
                        ></div>
                        <span className="text-muted fw-semibold text-nowrap" style={{ fontSize: ".65rem" }}>{d.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border rounded-4 p-4">
                  <h6 className="fw-bold mb-4 text-dark"><i className="bi bi-clock-history me-2 text-primary"></i>Recent Hub Activity</h6>
                  <div className="d-flex flex-column gap-3" style={{ maxHeight: 300, overflowY: "auto" }}>
                    {trackingLogs.map((log: any) => (
                      <div key={log.id} className="d-flex align-items-start gap-3 pb-3 border-bottom last-border-none">
                        <div className="rounded-circle bg-light d-flex align-items-center justify-content-center text-secondary flex-shrink-0" style={{ width: 32, height: 32 }}>
                          <i className="bi bi-record-circle" style={{ fontSize: "0.8rem" }}></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-dark" style={{ fontSize: "0.85rem" }}>
                            {log.status} <span className="text-muted font-monospace ms-1 small">({log.order?.trackingNumber})</span>
                          </div>
                          <div className="text-muted small mt-1" style={{ fontSize: "0.7rem" }}>
                            {new Date(log.timestamp).toLocaleString()} • {log.location || "Local Hub"}
                          </div>
                        </div>
                      </div>
                    ))}
                    {trackingLogs.length === 0 && <div className="text-muted small text-center py-3">No tracking logs found for this hub.</div>}
                  </div>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="border rounded-4 p-4 h-100">
                  <h6 className="fw-bold mb-4 text-dark"><i className="bi bi-pie-chart me-2 text-warning"></i>Historical Orders by Status</h6>
                  {ordersByStatus.length === 0 ? (
                    <div className="text-center text-muted py-4 small">No orders found</div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {ordersByStatus.sort((a: any, b: any) => b.count - a.count).map((s: any) => {
                        const pct = Math.round((s.count / totalOrders) * 100);
                        const color = statusColor(s.status);
                        return (
                          <div key={s.status}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="small fw-bold" style={{ color, fontSize: ".75rem" }}>{s.status.replace(/_/g, " ")}</span>
                              <span className="text-muted small fw-semibold" style={{ fontSize: ".7rem" }}>{s.count} ({pct}%)</span>
                            </div>
                            <div className="rounded-pill bg-light" style={{ height: 6 }}>
                              <div className="rounded-pill transition-all" style={{ height: "100%", width: `${pct}%`, background: color }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div>
              <h6 className="fw-bold mb-4 text-dark"><i className="bi bi-receipt me-2 text-success"></i>Historical Orders (Last 30 Days)</h6>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead className="table-light text-muted small text-uppercase" style={{ letterSpacing: "1px", fontSize: "0.7rem" }}>
                    <tr>
                      <th className="border-0 rounded-start">Order / Tracking</th>
                      <th className="border-0">Customer</th>
                      <th className="border-0">Date</th>
                      <th className="border-0">Agent</th>
                      <th className="border-0 text-end rounded-end">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalOrders.map((o: any) => (
                      <tr key={o.id} className="hover-bg-light transition-all border-bottom">
                        <td className="py-3">
                          <div className="fw-bold text-dark" style={{ fontSize: "0.85rem" }}>#{o.id.slice(-6).toUpperCase()}</div>
                          <div className="text-muted font-monospace" style={{ fontSize: "0.7rem" }}>{o.trackingNumber}</div>
                        </td>
                        <td className="py-3">
                          <div className="fw-semibold text-dark" style={{ fontSize: "0.85rem" }}>{o.user.name}</div>
                          <div className="text-muted" style={{ fontSize: "0.7rem" }}>{o.user.email}</div>
                        </td>
                        <td className="py-3 text-muted" style={{ fontSize: "0.8rem" }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 text-muted" style={{ fontSize: "0.8rem" }}>
                          {o.deliveryPerson ? o.deliveryPerson.user.name : "Unassigned"}
                        </td>
                        <td className="py-3 text-end">
                          <span className="badge rounded-pill fw-bold" style={{ fontSize: "0.7rem", padding: "5px 12px", background: `${statusColor(o.status)}20`, color: statusColor(o.status) }}>
                            {o.status.replace(/_/g, " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {historicalOrders.length === 0 && (
                      <tr><td colSpan={5} className="text-center text-muted py-5">No orders in the last 30 days.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "agents" && (
            <div>
              <h6 className="fw-bold mb-4 text-dark"><i className="bi bi-person-vcard me-2 text-primary"></i>Stationed Delivery Fleet</h6>
              <div className="row g-3">
                {localAgents.map((a: any) => (
                  <div key={a.id} className="col-md-6 col-lg-4">
                    <div className="border rounded-4 p-3 d-flex flex-column gap-3 h-100 hover-lift transition-all">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-circle bg-danger text-white d-flex justify-content-center align-items-center fw-bold" style={{ width: 40, height: 40 }}>
                            {a.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-bold text-dark">{a.user.name}</div>
                            <div className="text-muted" style={{ fontSize: "0.7rem" }}>{a.user.email}</div>
                          </div>
                        </div>
                        <span className="badge bg-light text-dark border">Agent</span>
                      </div>
                      
                      <div className="bg-light rounded-3 p-2 small d-flex flex-column gap-1">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted"><i className="bi bi-telephone me-1"></i>Phone:</span>
                          <span className="fw-semibold text-dark">{a.user.phone || "N/A"}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted"><i className="bi bi-car-front me-1"></i>Vehicle:</span>
                          <span className="fw-semibold text-dark">{a.vehicle ? `${a.vehicle.type} (${a.vehicle.licensePlate})` : "None"}</span>
                        </div>
                        <div className="d-flex justify-content-between border-top pt-1 mt-1">
                          <span className="text-muted"><i className="bi bi-box-seam me-1"></i>Active Packages:</span>
                          <span className="fw-bold text-danger">{a.orders.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {localAgents.length === 0 && (
                  <div className="col-12 text-center text-muted py-5 border rounded-4 bg-light">No agents registered at this hub.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "inventory" && (
            <div>
               <h6 className="fw-bold mb-4 text-dark"><i className="bi bi-boxes me-2 text-info"></i>Physical Inventory at Hub</h6>
               <div className="table-responsive">
                <table className="table align-middle">
                  <thead className="table-light text-muted small text-uppercase" style={{ letterSpacing: "1px", fontSize: "0.7rem" }}>
                    <tr>
                      <th className="border-0 rounded-start">Product</th>
                      <th className="border-0">SKU / Variant ID</th>
                      <th className="border-0">Stock Status</th>
                      <th className="border-0 text-end rounded-end">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((inv: any) => (
                      <tr key={inv.id} className="border-bottom">
                        <td className="py-3 fw-bold text-dark" style={{ fontSize: "0.85rem" }}>
                          {inv.variant?.product?.title || "Unknown Product"}
                        </td>
                        <td className="py-3 text-muted font-monospace" style={{ fontSize: "0.75rem" }}>
                          {inv.variant?.sku || inv.variantId.slice(0, 8)}
                        </td>
                        <td className="py-3">
                          <span className={`badge rounded-pill px-2 py-1 ${inv.quantity > 10 ? 'bg-success bg-opacity-10 text-success' : inv.quantity > 0 ? 'bg-warning bg-opacity-10 text-warning' : 'bg-danger bg-opacity-10 text-danger'}`}>
                            {inv.quantity > 10 ? 'In Stock' : inv.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="py-3 text-end fw-bold fs-6">
                          {inv.quantity}
                        </td>
                      </tr>
                    ))}
                    {inventory.length === 0 && (
                      <tr><td colSpan={4} className="text-center text-muted py-5">No inventory tracked at this location.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .hover-bg-white:hover { background-color: rgba(255,255,255,0.5); }
        .hover-bg-light:hover { background-color: #f8f9fa !important; }
        .hover-lift:hover { transform: translateY(-3px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.08)!important; }
        .transition-all { transition: all 0.3s ease; }
      `}</style>
    </div>
  );
}
