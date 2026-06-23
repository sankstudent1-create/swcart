"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { updateSellerOrderLogisticsAction } from "@/app/actions/seller";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  orderId: string;
  quantity: number;
  priceAtBuy: number;
  order: {
    id: string;
    status: string;
    shippingProvider: string | null;
    trackingNumber: string | null;
    totalAmount: number;
    createdAt: string;
    user: { name: string; email: string; phone: string | null; };
    shippingAddress: { street: string; city: string; state: string; postalCode: string; country: string; } | null;
  };
  variant: {
    sku: string;
    size: string | null;
    color: string | null;
    product: { title: string; images: string[]; };
  };
}

const STATUS_OPTIONS = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];
const COURIER_OPTIONS = ["Delhivery", "BlueDart", "FedEx", "DHL", "Ekart", "XpressBees", "Ecom Express", "India Post", "Internal Delivery"];

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  PENDING:    { color: "#ff9500", bg: "rgba(255,149,0,0.15)",    icon: "bi-hourglass-split",   label: "Pending"    },
  PROCESSING: { color: "#007aff", bg: "rgba(0,122,255,0.15)",    icon: "bi-gear",               label: "Processing" },
  SHIPPED:    { color: "#5856d6", bg: "rgba(88,86,214,0.15)",    icon: "bi-truck",              label: "Shipped"    },
  DELIVERED:  { color: "#34c759", bg: "rgba(52,199,89,0.15)",    icon: "bi-check-circle-fill",  label: "Delivered"  },
  CANCELLED:  { color: "#ff3b30", bg: "rgba(255,59,48,0.15)",    icon: "bi-x-circle",           label: "Cancelled"  },
  RETURNED:   { color: "#af52de", bg: "rgba(175,82,222,0.15)",   icon: "bi-arrow-return-left",  label: "Returned"   },
};

const FALLBACK_IMG = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=80&q=60";

export default function SellerOrderManager({ orderItems }: { orderItems: OrderItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [logisticsForm, setLogisticsForm] = useState({ status: "PENDING", shippingProvider: "Delhivery", trackingNumber: "" });

  // Group items by orderId
  const groupedOrders = useMemo(() => {
    const map: Record<string, { order: any; items: OrderItem[]; totalEarnings: number }> = {};
    orderItems.forEach(item => {
      if (!map[item.orderId]) map[item.orderId] = { order: item.order, items: [], totalEarnings: 0 };
      map[item.orderId].items.push(item);
      map[item.orderId].totalEarnings += item.quantity * item.priceAtBuy;
    });
    return Object.values(map);
  }, [orderItems]);

  // Filter by tab + search
  const filtered = useMemo(() => {
    return groupedOrders.filter(g => {
      const matchTab = activeTab === "ALL" || g.order.status === activeTab;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        g.order.id.toLowerCase().includes(q) ||
        g.order.user.name.toLowerCase().includes(q) ||
        g.order.user.email.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [groupedOrders, activeTab, search]);

  // Tab counts
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: groupedOrders.length };
    groupedOrders.forEach(g => { c[g.order.status] = (c[g.order.status] || 0) + 1; });
    return c;
  }, [groupedOrders]);

  const openModal = (orderData: any) => {
    setSelectedOrder(orderData);
    setLogisticsForm({
      status: orderData.order.status,
      shippingProvider: orderData.order.shippingProvider || "Delhivery",
      trackingNumber: orderData.order.trackingNumber || ""
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    startTransition(async () => {
      const res = await updateSellerOrderLogisticsAction(selectedOrder.order.id, {
        status: logisticsForm.status,
        shippingProvider: logisticsForm.shippingProvider || null,
        trackingNumber: logisticsForm.trackingNumber || null
      });
      if (res.success) { toast.success(res.message); setSelectedOrder(null); router.refresh(); }
      else toast.error(res.message);
    });
  };

  const printShippingLabel = (orderData: any) => {
    const { order, items } = orderData;
    const addr = order.shippingAddress;
    const win = window.open("", "_blank");
    if (!win) { toast.error("Allow popups to print shipping labels."); return; }
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Shipping Label — #${order.id.slice(-8).toUpperCase()}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; background: #fff; color: #000; padding: 24px; }
        .label { width: 500px; margin: auto; border: 3px solid #000; border-radius: 8px; overflow: hidden; }
        .hdr { background: #000; color: #fff; text-align: center; padding: 14px; letter-spacing: 4px; font-size: 18px; font-weight: 900; }
        .body { padding: 20px; }
        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .section { border: 1px solid #ddd; border-radius: 6px; padding: 12px; }
        .section-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
        .barcode-area { text-align: center; background: #f9f9f9; border: 1px solid #ddd; border-radius: 6px; padding: 14px; margin-bottom: 16px; }
        .bars { font-size: 36px; letter-spacing: 3px; line-height: 1; }
        .trk { font-size: 11px; letter-spacing: 2px; margin-top: 6px; font-weight: 700; }
        .items-list { font-size: 11px; }
        .item-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #eee; }
        .footer { background: #f5f5f5; padding: 10px 20px; display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>
      <div class="label">
        <div class="hdr">⚡ SWCART PRIORITY MAIL</div>
        <div class="body">
          <div class="row2">
            <div class="section">
              <div class="section-label">📦 Ship From</div>
              <strong>Swcart Fulfillment</strong><br/>
              Warehouse Hub 1A<br/>
              India
            </div>
            <div class="section">
              <div class="section-label">📍 Ship To</div>
              <strong>${order.user.name}</strong><br/>
              ${addr ? `${addr.street}<br/>${addr.city}, ${addr.state} ${addr.postalCode}<br/>${addr.country}` : "Address not available"}<br/>
              📞 ${order.user.phone || "N/A"}
            </div>
          </div>
          <div class="barcode-area">
            <div class="bars">|||||||||||||||||||||</div>
            <div class="trk">TRK: ${order.trackingNumber || "PENDING ASSIGNMENT"}</div>
          </div>
          <div class="section" style="margin-bottom:16px">
            <div class="section-label">🛍 Items</div>
            <div class="items-list">
              ${items.map((i: any) => `<div class="item-row"><span>${i.variant.product.title} (×${i.quantity})</span><span>₹${(i.quantity * i.priceAtBuy).toLocaleString("en-IN")}</span></div>`).join("")}
            </div>
          </div>
        </div>
        <div class="footer">
          <span>ORDER: #${order.id.slice(-8).toUpperCase()}</span>
          <span>DATE: ${new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
          <span>CARRIER: ${order.shippingProvider || "STANDARD"}</span>
        </div>
      </div>
      <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 600); }</script>
    </body></html>`);
    win.document.close();
  };

  const printInvoice = (orderData: any) => {
    const { order, items, totalEarnings } = orderData;
    const addr = order.shippingAddress;
    const win = window.open("", "_blank");
    if (!win) { toast.error("Allow popups to print invoices."); return; }
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Invoice — #${order.id.slice(-8).toUpperCase()}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .brand { font-size: 24px; font-weight: 900; }
        .brand span { color: #e8472a; }
        .invoice-meta { text-align: right; font-size: 13px; color: #555; }
        .invoice-meta h2 { font-size: 28px; color: #e8472a; letter-spacing: 2px; }
        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
        .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #f5f5f5; padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #666; }
        td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
        .total-row { font-weight: 700; font-size: 15px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #aaa; }
        @media print { body { padding: 20px; } }
      </style>
    </head><body>
      <div class="header">
        <div><div class="brand">Sw<span>cart</span></div><div style="font-size:12px;color:#999;margin-top:4px">Online Marketplace</div></div>
        <div class="invoice-meta"><h2>INVOICE</h2><div>Order: #${order.id.slice(-8).toUpperCase()}</div><div>Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}</div></div>
      </div>
      <div class="row2">
        <div><div class="section-title">Bill To</div><strong>${order.user.name}</strong><br/>${order.user.email}<br/>${order.user.phone || ""}</div>
        <div><div class="section-title">Ship To</div>${addr ? `${addr.street}<br/>${addr.city}, ${addr.state} ${addr.postalCode}<br/>${addr.country}` : "—"}</div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
        <tbody>
          ${items.map((i: any, idx: number) => `<tr><td>${idx + 1}</td><td>${i.variant.product.title}${i.variant.size ? ` (${i.variant.size})` : ""}</td><td style="font-family:monospace;font-size:11px">${i.variant.sku}</td><td>${i.quantity}</td><td>₹${i.priceAtBuy.toLocaleString("en-IN")}</td><td>₹${(i.quantity * i.priceAtBuy).toLocaleString("en-IN")}</td></tr>`).join("")}
          <tr class="total-row"><td colspan="5" style="text-align:right;padding-right:14px">Subtotal</td><td>₹${totalEarnings.toLocaleString("en-IN")}</td></tr>
          <tr><td colspan="5" style="text-align:right;padding-right:14px;font-size:13px;color:#555">Tax (18% GST)</td><td style="font-size:13px;color:#555">₹${Math.round(totalEarnings * 0.18).toLocaleString("en-IN")}</td></tr>
          <tr class="total-row" style="font-size:16px"><td colspan="5" style="text-align:right;padding-right:14px">Grand Total</td><td style="color:#e8472a">₹${(totalEarnings + Math.round(totalEarnings * 0.18)).toLocaleString("en-IN")}</td></tr>
        </tbody>
      </table>
      <div class="footer">Thank you for shopping with Swcart · support@swcart.in · www.swcart.in</div>
      <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 600); }</script>
    </body></html>`);
    win.document.close();
  };

  const cfg = (status: string) => STATUS_CONFIG[status] || STATUS_CONFIG["PENDING"];

  const TABS = ["ALL", ...STATUS_OPTIONS];

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1 text-white" style={{ letterSpacing: "-1px" }}>Order Management</h2>
          <p className="text-muted mb-0 small">Track, update status, assign couriers, print shipping labels & invoices.</p>
        </div>
        <div className="d-flex gap-2">
          <div className="px-3 py-2 rounded-4 text-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="text-white fw-bold fs-5">{groupedOrders.length}</div>
            <div className="text-muted" style={{ fontSize: ".7rem" }}>Total Orders</div>
          </div>
          <div className="px-3 py-2 rounded-4 text-center" style={{ background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.2)" }}>
            <div className="fw-bold fs-5" style={{ color: "#34c759" }}>{counts["DELIVERED"] || 0}</div>
            <div style={{ fontSize: ".7rem", color: "rgba(52,199,89,0.7)" }}>Delivered</div>
          </div>
          <div className="px-3 py-2 rounded-4 text-center" style={{ background: "rgba(255,149,0,0.1)", border: "1px solid rgba(255,149,0,0.2)" }}>
            <div className="fw-bold fs-5" style={{ color: "#ff9500" }}>{(counts["PENDING"] || 0) + (counts["PROCESSING"] || 0)}</div>
            <div style={{ fontSize: ".7rem", color: "rgba(255,149,0,0.7)" }}>In Progress</div>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {TABS.map(tab => {
          const c = tab === "ALL" ? null : cfg(tab);
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="btn btn-sm rounded-pill fw-semibold"
              style={{
                fontSize: ".75rem",
                padding: "5px 14px",
                background: isActive ? (c?.bg || "rgba(255,255,255,0.15)") : "rgba(255,255,255,0.05)",
                color: isActive ? (c?.color || "#fff") : "rgba(255,255,255,0.5)",
                border: `1px solid ${isActive ? (c?.color || "rgba(255,255,255,0.3)") : "rgba(255,255,255,0.1)"}`,
              }}
            >
              {c && <i className={`bi ${c.icon} me-1`}></i>}
              {tab === "ALL" ? "All Orders" : c?.label}
              <span className="ms-1 opacity-75">({counts[tab] || 0})</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-3" style={{ maxWidth: 380 }}>
        <div className="position-relative">
          <i className="bi bi-search position-absolute" style={{ top: "50%", left: "12px", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontSize: ".85rem" }}></i>
          <input
            type="text"
            className="form-control rounded-pill bg-transparent border-secondary text-white"
            style={{ paddingLeft: "34px", fontSize: ".85rem" }}
            placeholder="Search by order ID, customer name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Orders */}
      {filtered.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-inbox" style={{ fontSize: "3rem", opacity: 0.3 }}></i>
          <p className="mt-3 mb-0">No orders found for this filter.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filtered.map(({ order, items, totalEarnings }) => {
            const c = cfg(order.status);
            const thumb = items[0]?.variant?.product?.images?.[0]?.startsWith("http")
              ? items[0].variant.product.images[0] : FALLBACK_IMG;
            return (
              <div key={order.id} className="rounded-4 p-3 p-md-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="d-flex align-items-start gap-3 flex-wrap">
                  {/* Thumb */}
                  <div className="rounded-3 overflow-hidden flex-shrink-0" style={{ width: 56, height: 56, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>

                  {/* Main info */}
                  <div className="flex-grow-1 min-width-0">
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      <span className="fw-bold text-white font-monospace" style={{ fontSize: ".9rem" }}>
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                      <span className="badge rounded-pill fw-semibold" style={{ fontSize: ".65rem", padding: "3px 10px", background: c.bg, color: c.color, border: `1px solid ${c.color}40` }}>
                        <i className={`bi ${c.icon} me-1`}></i>{c.label}
                      </span>
                      {order.trackingNumber && (
                        <span className="text-muted small font-monospace" style={{ fontSize: ".7rem" }}>
                          TRK: {order.trackingNumber}
                        </span>
                      )}
                    </div>
                    <div className="text-muted small mb-2" style={{ fontSize: ".75rem" }}>
                      <i className="bi bi-person me-1"></i>{order.user.name}
                      <span className="mx-2 opacity-30">·</span>
                      <i className="bi bi-calendar3 me-1"></i>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      {order.shippingProvider && (<><span className="mx-2 opacity-30">·</span><i className="bi bi-truck me-1"></i>{order.shippingProvider}</>)}
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                      {items.slice(0, 3).map(item => (
                        <span key={item.id} className="rounded-2 text-muted" style={{ fontSize: ".72rem", background: "rgba(255,255,255,0.05)", padding: "2px 8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                          {item.variant.product.title} ×{item.quantity}
                        </span>
                      ))}
                      {items.length > 3 && <span className="text-muted" style={{ fontSize: ".72rem" }}>+{items.length - 3} more</span>}
                    </div>
                  </div>

                  {/* Right: Earnings + Actions */}
                  <div className="d-flex flex-column align-items-end gap-2 flex-shrink-0">
                    <div className="text-white fw-bold" style={{ fontSize: "1.1rem" }}>
                      ₹{totalEarnings.toLocaleString("en-IN")}
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm rounded-pill fw-semibold" style={{ fontSize: ".75rem", background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", padding: "4px 14px" }}
                        onClick={() => printShippingLabel({ order, items, totalEarnings })}>
                        <i className="bi bi-printer me-1"></i>Label
                      </button>
                      <button className="btn btn-sm rounded-pill fw-semibold" style={{ fontSize: ".75rem", background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", padding: "4px 14px" }}
                        onClick={() => printInvoice({ order, items, totalEarnings })}>
                        <i className="bi bi-receipt me-1"></i>Invoice
                      </button>
                      <button className="btn btn-sm btn-danger rounded-pill fw-semibold" style={{ fontSize: ".75rem", padding: "4px 14px" }}
                        onClick={() => openModal({ order, items, totalEarnings })}>
                        <i className="bi bi-sliders me-1"></i>Manage
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Logistics Modal */}
      {selectedOrder && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 shadow-lg text-white" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="modal-header px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <span className="badge rounded-circle p-2" style={{ background: "rgba(232,71,42,0.15)", color: "var(--red)" }}>
                    <i className="bi bi-truck fs-6"></i>
                  </span>
                  Order #{selectedOrder.order.id.slice(-8).toUpperCase()}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedOrder(null)}></button>
              </div>

              <div className="modal-body p-4" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <div className="row g-4">
                  {/* Left: Info */}
                  <div className="col-md-6 d-flex flex-column gap-3">
                    {/* Customer */}
                    <div className="rounded-4 p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="text-danger fw-bold small text-uppercase mb-2" style={{ letterSpacing: "1px" }}>
                        <i className="bi bi-person me-1"></i>Customer
                      </div>
                      <div className="d-flex flex-column gap-1 small text-white">
                        <div><span className="text-muted me-2">Name:</span>{selectedOrder.order.user.name}</div>
                        <div><span className="text-muted me-2">Email:</span>{selectedOrder.order.user.email}</div>
                        <div><span className="text-muted me-2">Phone:</span>{selectedOrder.order.user.phone || "—"}</div>
                      </div>
                    </div>

                    {/* Address */}
                    {selectedOrder.order.shippingAddress && (
                      <div className="rounded-4 p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="text-danger fw-bold small text-uppercase mb-2" style={{ letterSpacing: "1px" }}>
                          <i className="bi bi-geo-alt me-1"></i>Shipping Address
                        </div>
                        <div className="small text-muted lh-lg">
                          {selectedOrder.order.shippingAddress.street}<br />
                          {selectedOrder.order.shippingAddress.city}, {selectedOrder.order.shippingAddress.state} — {selectedOrder.order.shippingAddress.postalCode}<br />
                          {selectedOrder.order.shippingAddress.country}
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <div className="rounded-4 p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="text-danger fw-bold small text-uppercase mb-2" style={{ letterSpacing: "1px" }}>
                        <i className="bi bi-bag me-1"></i>Items Ordered
                      </div>
                      <div className="d-flex flex-column gap-2">
                        {selectedOrder.items.map((item: any) => (
                          <div key={item.id} className="d-flex justify-content-between align-items-start small py-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <div>
                              <div className="text-white fw-semibold">{item.variant.product.title}</div>
                              <div className="text-muted" style={{ fontSize: ".7rem" }}>
                                SKU: {item.variant.sku}
                                {item.variant.size && ` · ${item.variant.size}`}
                                {item.variant.color && ` · ${item.variant.color}`}
                              </div>
                              <div className="text-muted" style={{ fontSize: ".7rem" }}>Qty: {item.quantity} × ₹{item.priceAtBuy.toLocaleString("en-IN")}</div>
                            </div>
                            <span className="text-white fw-bold">₹{(item.quantity * item.priceAtBuy).toLocaleString("en-IN")}</span>
                          </div>
                        ))}
                        <div className="d-flex justify-content-between text-white fw-bold pt-2">
                          <span>Total Earnings</span>
                          <span className="text-danger">₹{selectedOrder.totalEarnings.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Logistics form */}
                  <div className="col-md-6">
                    <form onSubmit={handleSave} className="rounded-4 p-4 d-flex flex-column gap-3 h-100" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="text-danger fw-bold small text-uppercase" style={{ letterSpacing: "1px" }}>
                        <i className="bi bi-sliders me-1"></i>Update Logistics
                      </div>

                      <div>
                        <label className="text-muted small text-uppercase fw-bold mb-1" style={{ fontSize: ".65rem", letterSpacing: ".5px" }}>Order Status</label>
                        <select className="form-select rounded-3 text-white" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}
                          value={logisticsForm.status} onChange={e => setLogisticsForm({ ...logisticsForm, status: e.target.value })}>
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="text-muted small text-uppercase fw-bold mb-1" style={{ fontSize: ".65rem", letterSpacing: ".5px" }}>Shipping Courier</label>
                        <select className="form-select rounded-3 text-white" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}
                          value={logisticsForm.shippingProvider} onChange={e => setLogisticsForm({ ...logisticsForm, shippingProvider: e.target.value })}>
                          {COURIER_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="text-muted small text-uppercase fw-bold mb-1" style={{ fontSize: ".65rem", letterSpacing: ".5px" }}>Tracking Number</label>
                        <input type="text" className="form-control rounded-3 text-white" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}
                          placeholder="e.g. DL9876543210IN" value={logisticsForm.trackingNumber}
                          onChange={e => setLogisticsForm({ ...logisticsForm, trackingNumber: e.target.value })} />
                        {logisticsForm.trackingNumber && (
                          <div className="text-muted mt-1" style={{ fontSize: ".7rem" }}>
                            Customer track link: /track-order?id={selectedOrder.order.id.slice(-8)}
                          </div>
                        )}
                      </div>

                      <button type="submit" className="btn btn-danger rounded-pill fw-bold py-2 w-100 mt-auto" disabled={isPending}>
                        {isPending ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : <><i className="bi bi-check-lg me-2"></i>Save Changes</>}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Print actions */}
                <div className="d-flex gap-2 mt-4 pt-3 flex-wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <button type="button" className="btn rounded-pill fw-semibold px-4" style={{ background: "rgba(255,255,255,0.07)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", fontSize: ".85rem" }}
                    onClick={() => printShippingLabel(selectedOrder)}>
                    <i className="bi bi-printer me-2"></i>Print Shipping Label
                  </button>
                  <button type="button" className="btn rounded-pill fw-semibold px-4" style={{ background: "rgba(255,255,255,0.07)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", fontSize: ".85rem" }}
                    onClick={() => printInvoice(selectedOrder)}>
                    <i className="bi bi-receipt me-2"></i>Print Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
