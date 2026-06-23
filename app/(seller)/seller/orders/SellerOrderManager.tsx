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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;800&family=Libre+Barcode+39&family=Inter:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8f9fa; display: flex; justify-content: center; padding: 2rem; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .label { width: 4in; min-height: 6in; background: #fff; color: #111; display: flex; flex-direction: column; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); border: 2px solid #e9ecef; overflow: hidden; }
        .hdr { padding: 16px; background: linear-gradient(135deg, #e63946 0%, #c1121f 100%); display: flex; justify-content: space-between; align-items: center; color: white; }
        .hdr .brand { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 26px; font-weight: 800; letter-spacing: -1px; }
        .hdr .type { font-weight: 800; font-size: 14px; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; }
        .from-to { display: flex; border-bottom: 2px solid #e9ecef; }
        .addr-box { padding: 16px; font-size: 13px; width: 50%; }
        .addr-box.from { border-right: 2px solid #e9ecef; background: #fafafa; }
        .addr-box.to { position: relative; }
        .addr-box.to::before { content: ""; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #e63946; }
        .box-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #adb5bd; margin-bottom: 6px; letter-spacing: 1px; }
        .box-title.red { color: #e63946; }
        .to-name { font-size: 16px; font-weight: 800; margin-bottom: 4px; text-transform: uppercase; color: #111; }
        .routing { border-bottom: 2px solid #e9ecef; padding: 16px; text-align: center; display: flex; align-items: center; justify-content: space-around; background: rgba(230,57,70,0.02); }
        .routing h1 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 42px; font-weight: 800; letter-spacing: 2px; color: #c1121f; }
        .routing .city { font-weight: 800; font-size: 20px; text-transform: uppercase; color: #495057; }
        .barcode-area { padding: 20px 16px; text-align: center; border-bottom: 2px solid #e9ecef; flex-grow: 1; }
        .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 72px; line-height: 1; margin-bottom: 12px; font-weight: 400; color: #111; }
        .trk { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 800; letter-spacing: 1.5px; }
        .carrier { font-size: 12px; color: #e63946; font-weight: 800; text-transform: uppercase; margin-top: 8px; background: rgba(230,57,70,0.1); display: inline-block; padding: 6px 16px; border-radius: 20px; letter-spacing: 1px; }
        .items { padding: 16px; font-size: 11px; }
        .item-line { display: flex; justify-content: space-between; border-bottom: 1px dashed #e9ecef; padding: 8px 0; font-weight: 500; color: #495057; }
        .footer { padding: 12px; text-align: center; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; font-weight: 800; background: #212529; color: #fff; text-transform: uppercase; letter-spacing: 2px; }
        @media print { body { background: #fff; padding: 0; } .label { border-radius: 0; box-shadow: none; border: 1px solid #000; } .addr-box.to::before { display: none; } }
      </style>
    </head><body>
      <div class="label">
        <div class="hdr">
          <div class="brand"><img src="https://tools.swinfosystems.online/icon-192.png" style="width:28px;height:28px;border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,0.2);margin-right:8px;vertical-align:middle;"/>Swcart.</div>
          <div class="type">Expedited</div>
        </div>
        <div class="from-to">
          <div class="addr-box from">
            <div class="box-title">Ship From</div>
            <strong>Swcart Fulfillment Center</strong><br/>
            Sector 62, Industrial Area<br/>
            New Delhi, India 110062
          </div>
          <div class="addr-box to">
            <div class="box-title red">Deliver To</div>
            <div class="to-name">${order.user.name}</div>
            <div style="color: #495057;">
              ${addr ? `${addr.street}<br/>${addr.city}, ${addr.state} ${addr.postalCode}<br/>${addr.country}` : "Address not available"}
            </div>
            <div style="margin-top: 8px; color: #111;"><strong>Ph:</strong> ${order.user.phone || "N/A"}</div>
          </div>
        </div>
        <div class="routing">
          <h1>${addr?.postalCode || "000000"}</h1>
          <div class="city">${addr?.city || "CITY"}</div>
        </div>
        <div class="barcode-area">
          <div class="box-title">Tracking Number</div>
          <div class="barcode">*${order.trackingNumber || order.id.slice(-8).toUpperCase()}*</div>
          <div class="trk">${order.trackingNumber || "PENDING ASSIGNMENT"}</div>
          <div class="carrier">${order.shippingProvider || "Internal Logistics"}</div>
        </div>
        <div class="items">
          <div class="box-title">Package Contents (${items.length} items)</div>
          ${items.map((i: any) => `<div class="item-line"><span>${i.variant.product.title.substring(0, 35)}...</span><strong style="color:#111">Qty: ${i.quantity}</strong></div>`).join("")}
          <div class="item-line" style="border:none;margin-top:6px;color:#111"><strong>Order Ref:</strong> #${order.id.slice(-8).toUpperCase()}</div>
        </div>
        <div class="footer">Handle With Care</div>
      </div>
      <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 1000); }</script>
    </body></html>`);
    win.document.close();
  };

  const printInvoice = (orderData: any) => {
    const { order, items, totalEarnings } = orderData;
    const addr = order.shippingAddress;
    const win = window.open("", "_blank");
    if (!win) { toast.error("Allow popups to print invoices."); return; }
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Tax Invoice — #${order.id.slice(-8).toUpperCase()}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800;900&family=Inter:wght@400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #e0e0e0; display: flex; justify-content: center; padding: 2rem; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: #111; }
        .invoice { width: 850px; max-width: 100%; background: #f8f9fa; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 50px rgba(0,0,0,0.1); border: 1px solid #fff; }
        .hdr { padding: 40px 48px 30px; background: linear-gradient(135deg, #1A1A24 0%, #2B2B3C 100%); color: white; display: flex; justify-content: space-between; align-items: flex-start; position: relative; overflow: hidden; }
        .hdr::after { content: ""; position: absolute; right: -50px; top: -50px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(230,57,70,0.2) 0%, transparent 70%); border-radius: 50%; pointer-events: none; }
        .brand { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 36px; font-weight: 900; color: #fff; letter-spacing: -1px; display: flex; align-items: center; gap: 8px; position: relative; z-index: 1; }
        .brand .dot { color: #e63946; }
        .hdr-info { text-align: right; position: relative; z-index: 1; }
        .hdr-info .title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 28px; font-weight: 800; color: #fff; text-transform: uppercase; letter-spacing: 2px; text-shadow: 0 2px 10px rgba(0,0,0,0.2); }
        .hdr-info .meta { font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 10px; }
        .accent-bar { height: 6px; background: linear-gradient(90deg, #e63946 0%, #ffb703 100%); }
        .body-sec { padding: 40px 48px; background: #fff; margin: 20px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
        .row-addr { display: flex; gap: 40px; margin-bottom: 40px; }
        .addr-box { flex: 1; background: #f8f9fa; padding: 20px; border-radius: 12px; border: 1px solid #e9ecef; }
        .addr-box .lbl { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; font-weight: 800; color: #e63946; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .addr-box strong { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; color: #111; display: block; margin-bottom: 6px; }
        .addr-box div { font-size: 13px; color: #495057; line-height: 1.6; }
        table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 32px; }
        th { background: rgba(230,57,70,0.05); padding: 14px 16px; text-align: left; font-size: 11px; font-weight: 800; color: #c1121f; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid rgba(230,57,70,0.1); }
        th:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
        th:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; }
        td { padding: 16px; font-size: 13px; color: #212529; border-bottom: 1px dashed #e9ecef; }
        .qty { text-align: center; }
        .right { text-align: right; }
        .totals-sec { display: flex; justify-content: space-between; align-items: flex-start; padding-top: 16px; }
        .notes { font-size: 11px; color: #6c757d; width: 45%; line-height: 1.6; background: #f8f9fa; padding: 16px; border-radius: 12px; border-left: 4px solid #e9ecef; }
        .tot-box { width: 45%; background: #fff; }
        .tot-row { display: flex; justify-content: space-between; padding: 8px 16px; font-size: 14px; color: #495057; }
        .tot-row.bold { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 800; color: #111; background: rgba(230,57,70,0.05); border-radius: 12px; padding: 16px; margin-top: 8px; border: 1px solid rgba(230,57,70,0.1); }
        .tot-row.bold span:last-child { color: #e63946; }
        .footer { padding: 24px 48px; text-align: center; font-size: 12px; color: #adb5bd; background: #1A1A24; color: rgba(255,255,255,0.6); }
        .footer strong { color: white; font-family: 'Plus Jakarta Sans', sans-serif; }
        @media print { body { padding: 0; background: #fff; } .invoice { border-radius: 0; box-shadow: none; border: none; margin: 0; } .body-sec { margin: 0; border-radius: 0; box-shadow: none; } .hdr { background: #111 !important; color: white !important; -webkit-print-color-adjust: exact; } .accent-bar { display: none; } }
      </style>
    </head><body>
      <div class="invoice">
        <div class="hdr">
          <div>
            <div class="brand"><img src="https://tools.swinfosystems.online/icon-192.png" style="width:36px;height:36px;border-radius:10px;box-shadow:0 4px 10px rgba(0,0,0,0.3);margin-right:8px;"/>Swcart<span class="dot">.</span></div>
            <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:6px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Marketplace Tax Invoice</div>
          </div>
          <div class="hdr-info">
            <div class="title">INVOICE</div>
            <div class="meta">
              <strong>Order Ref:</strong> #${order.id.slice(-8).toUpperCase()}<br/>
              <strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
            </div>
          </div>
        </div>
        <div class="accent-bar"></div>
        <div class="body-sec">
          <div class="row-addr">
            <div class="addr-box">
              <div class="lbl">Billed To</div>
              <strong>${order.user.name}</strong>
              <div>${order.user.email}</div>
              <div>${order.user.phone || "No phone provided"}</div>
            </div>
            <div class="addr-box">
              <div class="lbl">Shipped To</div>
              <strong>${order.user.name}</strong>
              <div>${addr ? `${addr.street}<br/>${addr.city}, ${addr.state} ${addr.postalCode}<br/>${addr.country}` : "Address not available"}</div>
            </div>
          </div>
          <table>
            <thead><tr><th>#</th><th>Description</th><th>SKU</th><th class="qty">Qty</th><th class="right">Unit Price</th><th class="right">Total</th></tr></thead>
            <tbody>
              ${items.map((i: any, idx: number) => `<tr>
                <td style="color:#adb5bd;font-weight:600">${idx + 1}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    ${i.variant.product.images?.[0] ? `<img src="${i.variant.product.images[0]}" style="width:40px;height:40px;object-fit:cover;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,0.05);"/>` : ''}
                    <div>
                      <strong style="color:#111;display:block;margin-bottom:4px;font-size:14px">${i.variant.product.title}</strong>
                      <span style="color:#6c757d;font-size:11px;background:#f8f9fa;padding:2px 8px;border-radius:10px;">${i.variant.size ? `Size: ${i.variant.size}` : ""} ${i.variant.color ? `Color: ${i.variant.color}` : ""}</span>
                    </div>
                  </div>
                </td>
                <td style="font-family:monospace;font-size:12px;color:#6c757d">${i.variant.sku}</td>
                <td class="qty"><span style="background:rgba(230,57,70,0.1);color:#e63946;font-weight:800;padding:4px 10px;border-radius:12px;">${i.quantity}</span></td>
                <td class="right fw-semibold text-secondary">₹${i.priceAtBuy.toLocaleString("en-IN")}</td>
                <td class="right"><strong style="color:#111;font-size:14px;">₹${(i.quantity * i.priceAtBuy).toLocaleString("en-IN")}</strong></td>
              </tr>`).join("")}
            </tbody>
          </table>
          <div class="totals-sec">
            <div class="notes">
              <strong style="color:#495057">Terms & Conditions</strong><br/>
              1. All claims must be made within 7 days of delivery.<br/>
              2. This is a computer generated invoice and does not require a physical signature.<br/>
              3. Returns are subject to seller approval.
            </div>
            <div class="tot-box">
              <div class="tot-row"><span>Subtotal</span><strong>₹${totalEarnings.toLocaleString("en-IN")}</strong></div>
              <div class="tot-row"><span>Tax (18% GST)</span><strong>₹${Math.round(totalEarnings * 0.18).toLocaleString("en-IN")}</strong></div>
              <div class="tot-row bold"><span>Total Payable</span><span>₹${(totalEarnings + Math.round(totalEarnings * 0.18)).toLocaleString("en-IN")}</span></div>
            </div>
          </div>
        </div>
        <div class="footer">
          <strong>Swcart Marketplace</strong> &bull; support@swcart.com &bull; www.swcart.com
        </div>
      </div>
      <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 1000); }</script>
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
