"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addTicketMessageAction, updateTicketStatusAction } from "@/app/actions/support";
import {
  adminForceOrderStatusAction,
  adminApproveRefundAction,
  adminMarkPaymentSuccessAction,
  adminCancelOrderAction,
} from "@/app/actions/adminSupportActions";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Message { id: string; body: string; createdAt: string; senderId: string; sender: { name: string; email: string; avatar: string | null }; }
interface Ticket { id: string; userId: string; subject: string; status: string; createdAt: string; updatedAt: string; user: { name: string; email: string }; conversations: Array<{ messages: Array<{ body: string; createdAt: string }> }>; }
interface ActiveTicket extends Ticket { conversations: Array<{ messages: Message[] }>; }

interface DetectedIssue {
  severity: "critical" | "warning" | "info";
  type: string;
  detail: string;
  orderId?: string;
  paymentId?: string;
  refundId?: string;
}
interface TrackingEntry { id: string; status: string; location: string | null; timestamp: string; }
interface PaymentEntry { id: string; method: string; status: string; amount: number; createdAt: string; }
interface RefundEntry { id: string; amount: number; status: string; reason: string | null; createdAt: string; }
interface OrderSummary {
  id: string; status: string; totalAmount: number; createdAt: string; trackingNumber: string | null;
  payments: PaymentEntry[]; refunds: RefundEntry[]; trackingHistory: TrackingEntry[];
  warehouse: { name: string; location: string } | null;
  deliveryPerson: { name: string; phone: string | null; vehicle: { type: string; licensePlate: string } | null } | null;
  sellerOrders: Array<{ id: string; status: string; payoutStatus: string; seller: { companyName: string; isVerified: boolean }; items: Array<{ id: string; qty: number; price: number; title: string }> }>;
}
interface UserIntelligence {
  orders: OrderSummary[];
  allTickets: Array<{ id: string; subject: string; status: string; createdAt: string; updatedAt: string }>;
  user: { name: string; email: string; phone: string | null; createdAt: string; roles: any[]; customerProfile: any; sellerProfile: any } | null;
  reviews: Array<{ id: string; rating: number; comment: string; product: { title: string }; createdAt: string }>;
  walletBalance: number;
  detectedIssues: DetectedIssue[];
  stats: { totalOrders: number; totalSpend: number; failedPaymentsCount: number; pendingRefundsCount: number; delayedOrdersCount: number; accountAgeDays: number };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  OPEN:        { label: "Open",        color: "#ef4444", bg: "#fef2f2", dot: "#ef4444" },
  IN_PROGRESS: { label: "In Progress", color: "#f59e0b", bg: "#fffbeb", dot: "#f59e0b" },
  RESOLVED:    { label: "Resolved",    color: "#10b981", bg: "#ecfdf5", dot: "#10b981" },
  CLOSED:      { label: "Closed",      color: "#6b7280", bg: "#f3f4f6", dot: "#6b7280" },
};

const ORDER_COLOR: Record<string, { c: string; bg: string }> = {
  PENDING:    { c: "#f59e0b", bg: "#fffbeb" }, PROCESSING: { c: "#3b82f6", bg: "#eff6ff" },
  SHIPPED:    { c: "#8b5cf6", bg: "#f5f3ff" }, DELIVERED:  { c: "#10b981", bg: "#ecfdf5" },
  CANCELLED:  { c: "#ef4444", bg: "#fef2f2" },
};

const ISSUE_META: Record<string, { icon: string; color: string; bg: string }> = {
  critical: { icon: "bi-exclamation-octagon-fill", color: "#ef4444", bg: "#fef2f2" },
  warning:  { icon: "bi-exclamation-triangle-fill", color: "#f59e0b", bg: "#fffbeb" },
  info:     { icon: "bi-info-circle-fill",          color: "#3b82f6", bg: "#eff6ff" },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.CLOSED;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 700, background: m.bg, color: m.color, border: `1px solid ${m.color}30` }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: m.dot, flexShrink: 0 }} />{m.label}</span>;
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue},50%,55%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.38, fontWeight: 700, flexShrink: 0 }}>{name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}</div>;
}

function fmt(n: number) { return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`;
}

// ─── Issue Fix Buttons ────────────────────────────────────────────────────────

function IssueFixButton({ label, icon, color, onClick, isPending }: { label: string; icon: string; color: string; onClick: () => void; isPending: boolean }) {
  return (
    <button onClick={onClick} disabled={isPending} style={{ padding: "4px 10px", borderRadius: 8, border: `1.5px solid ${color}40`, background: `${color}12`, color, fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, transition: "all 0.15s", opacity: isPending ? 0.6 : 1 }}>
      {isPending ? <span className="spinner-border spinner-border-sm" style={{ width: 10, height: 10 }} /> : <i className={`bi ${icon}`} />}
      {label}
    </button>
  );
}

// ─── Intelligence Panel ───────────────────────────────────────────────────────

function IntelligencePanel({ intel, user, ticketId }: { intel: UserIntelligence; user: { name: string; email: string }; ticketId: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<"issues" | "orders" | "profile" | "history">("issues");
  const [pending, startT] = useTransition();

  const doAction = (fn: () => Promise<{ success: boolean; message: string }>) => {
    startT(async () => {
      const res = await fn();
      if (res.success) { toast.success(res.message); router.refresh(); }
      else toast.error(res.message);
    });
  };

  const { detectedIssues, orders, stats, allTickets, reviews, walletBalance } = intel;

  const tabDefs: { key: typeof tab; label: string; icon: string; badge?: number }[] = [
    { key: "issues",  label: "Issues",  icon: "bi-exclamation-triangle", badge: detectedIssues.filter(i => i.severity !== "info").length },
    { key: "orders",  label: "Orders",  icon: "bi-bag",                  badge: orders.length },
    { key: "profile", label: "Profile", icon: "bi-person" },
    { key: "history", label: "History", icon: "bi-clock-history",        badge: allTickets.length },
  ];

  return (
    <div style={{ width: 320, flexShrink: 0, borderLeft: "1.5px solid #e8e8ec", background: "#fafafa", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <style>{`.intel-tab-btn { transition: all 0.15s; } .intel-tab-btn:hover { background: #f3f4f6 !important; } .quick-fix:hover { opacity: 0.85; }`}</style>

      {/* User Header */}
      <div style={{ padding: "14px 14px 10px", borderBottom: "1.5px solid #f0f0f0", background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Avatar name={user.name} size={38} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
            <div style={{ fontSize: "0.7rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
            {intel.user?.phone && <div style={{ fontSize: "0.68rem", color: "#9ca3af" }}><i className="bi bi-telephone me-1" />{intel.user.phone}</div>}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {[
            { l: "Orders", v: stats.totalOrders, c: "#3b82f6", i: "bi-bag" },
            { l: "Spend", v: `₹${(stats.totalSpend / 100).toFixed(0)}`, c: "#10b981", i: "bi-currency-rupee" },
            { l: "Age", v: `${stats.accountAgeDays}d`, c: "#8b5cf6", i: "bi-calendar" },
            { l: "Issues", v: detectedIssues.filter(x => x.severity !== "info").length, c: "#ef4444", i: "bi-exclamation-triangle" },
            { l: "Tickets", v: allTickets.length, c: "#f59e0b", i: "bi-headset" },
            { l: "Wallet", v: `₹${(walletBalance ?? 0).toFixed(0)}`, c: "#6b7280", i: "bi-wallet" },
          ].map(m => (
            <div key={m.l} style={{ padding: "7px 8px", background: "#f8f9fb", borderRadius: 9, border: "1px solid #f0f0f0", textAlign: "center" }}>
              <div style={{ fontSize: "0.62rem", color: "#9ca3af", fontWeight: 600 }}><i className={`bi ${m.i} me-1`} style={{ color: m.c }} />{m.l}</div>
              <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#111" }}>{m.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1.5px solid #f0f0f0", background: "#fff", overflowX: "auto", scrollbarWidth: "none" }}>
        {tabDefs.map(t => (
          <button key={t.key} className="intel-tab-btn" onClick={() => setTab(t.key)} style={{ flex: "1 0 auto", padding: "8px 6px", border: "none", borderBottom: tab === t.key ? "2.5px solid #ef4444" : "2.5px solid transparent", background: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.68rem", color: tab === t.key ? "#ef4444" : "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, position: "relative" }}>
            <i className={`bi ${t.icon}`} />
            {t.label}
            {!!t.badge && <span style={{ background: tab === t.key ? "#ef4444" : "#6b7280", color: "#fff", borderRadius: 999, padding: "1px 5px", fontSize: "0.58rem", fontWeight: 800 }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>

        {/* ── ISSUES TAB ── */}
        {tab === "issues" && (
          detectedIssues.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
              <i className="bi bi-check-circle-fill" style={{ fontSize: "2rem", color: "#10b981", display: "block", marginBottom: 8 }} />
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#374151" }}>No issues detected</div>
              <div style={{ fontSize: "0.75rem", marginTop: 4 }}>User account looks healthy.</div>
            </div>
          ) : detectedIssues.map((issue, i) => {
            const m = ISSUE_META[issue.severity];
            return (
              <div key={i} style={{ padding: "10px 12px", borderRadius: 12, background: m.bg, border: `1.5px solid ${m.color}25` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 6 }}>
                  <i className={`bi ${m.icon}`} style={{ color: m.color, fontSize: "0.9rem", marginTop: 1, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "0.68rem", fontWeight: 800, color: m.color, letterSpacing: "0.04em", marginBottom: 2 }}>{issue.type.replace(/_/g, " ")}</div>
                    <div style={{ fontSize: "0.78rem", color: "#374151", lineHeight: 1.4 }}>{issue.detail}</div>
                  </div>
                </div>

                {/* Quick Fix Actions */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingLeft: 22 }}>
                  {issue.type === "PAYMENT_FAILED" && issue.paymentId && (
                    <IssueFixButton label="Mark Paid" icon="bi-check-circle" color="#10b981" isPending={pending}
                      onClick={() => doAction(() => adminMarkPaymentSuccessAction(issue.paymentId!))} />
                  )}
                  {issue.type === "REFUND_PENDING" && issue.refundId && issue.orderId && (
                    <IssueFixButton label="Approve Refund" icon="bi-arrow-return-left" color="#3b82f6" isPending={pending}
                      onClick={() => doAction(() => adminApproveRefundAction(issue.refundId!, issue.orderId!))} />
                  )}
                  {issue.type === "ORDER_DELAYED" && issue.orderId && (
                    <>
                      <IssueFixButton label="→ Processing" icon="bi-gear" color="#3b82f6" isPending={pending}
                        onClick={() => doAction(() => adminForceOrderStatusAction(issue.orderId!, "PROCESSING"))} />
                      <IssueFixButton label="Cancel" icon="bi-x-circle" color="#ef4444" isPending={pending}
                        onClick={() => doAction(() => adminCancelOrderAction(issue.orderId!))} />
                    </>
                  )}
                  {issue.type === "SHIPMENT_STUCK" && issue.orderId && (
                    <>
                      <IssueFixButton label="→ Delivered" icon="bi-check2-all" color="#10b981" isPending={pending}
                        onClick={() => doAction(() => adminForceOrderStatusAction(issue.orderId!, "DELIVERED"))} />
                      <IssueFixButton label="Investigate" icon="bi-search" color="#f59e0b" isPending={pending}
                        onClick={() => setTab("orders")} />
                    </>
                  )}
                  {issue.orderId && (
                    <a href={`/spr/admin/orders?id=${issue.orderId}`} target="_blank" rel="noreferrer" style={{ padding: "4px 10px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: "0.7rem", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <i className="bi bi-box-arrow-up-right" />View Order
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* ── ORDERS TAB ── */}
        {tab === "orders" && (
          orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: "0.82rem" }}>No orders found for this user.</div>
          ) : orders.map(o => {
            const oc = ORDER_COLOR[o.status] ?? { c: "#6b7280", bg: "#f3f4f6" };
            const allItems = o.sellerOrders.flatMap(s => s.items);
            const payStatus = o.payments[0]?.status ?? "N/A";
            const hasRefund = o.refunds.length > 0;
            const isLate = ["PENDING", "PROCESSING"].includes(o.status) && (Date.now() - new Date(o.createdAt).getTime()) > 3 * 86400000;
            return (
              <div key={o.id} style={{ padding: "12px 13px", background: "#fff", borderRadius: 12, border: `1.5px solid ${isLate ? "#fca5a5" : "#f0f0f0"}` }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                  <span style={{ fontFamily: "monospace", fontSize: "0.7rem", fontWeight: 800, color: "#374151" }}>#{o.id.slice(-8).toUpperCase()}</span>
                  <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.64rem", fontWeight: 700, background: oc.bg, color: oc.c }}>{o.status}</span>
                </div>

                {/* Items */}
                <div style={{ fontSize: "0.74rem", color: "#374151", marginBottom: 7, lineHeight: 1.45 }}>
                  {allItems.slice(0, 2).map((it, idx) => (
                    <div key={idx} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <i className="bi bi-dot" />{it.qty}× {it.title} — {fmt(it.price * it.qty)}
                    </div>
                  ))}
                  {allItems.length > 2 && <div style={{ color: "#9ca3af", fontSize: "0.68rem" }}>+{allItems.length - 2} more items</div>}
                </div>

                {/* Seller info */}
                {o.sellerOrders.map((so, si) => (
                  <div key={si} style={{ fontSize: "0.68rem", color: "#6b7280", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <i className="bi bi-shop" />
                    <span style={{ fontWeight: 600 }}>{so.seller.companyName}</span>
                    {!so.seller.isVerified && <span style={{ padding: "1px 6px", borderRadius: 999, background: "#fef2f2", color: "#ef4444", fontSize: "0.62rem", fontWeight: 700 }}>UNVERIFIED</span>}
                    <span style={{ marginLeft: "auto", color: so.payoutStatus === "PAID" ? "#10b981" : "#f59e0b", fontWeight: 600 }}>{so.payoutStatus}</span>
                  </div>
                ))}

                {/* Delivery info */}
                {o.deliveryPerson && (
                  <div style={{ fontSize: "0.68rem", color: "#6b7280", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <i className="bi bi-person-badge" />
                    <span style={{ fontWeight: 600 }}>{o.deliveryPerson.name}</span>
                    {o.deliveryPerson.phone && <span>· {o.deliveryPerson.phone}</span>}
                    {o.deliveryPerson.vehicle && <span>· {o.deliveryPerson.vehicle.type} {o.deliveryPerson.vehicle.licensePlate}</span>}
                  </div>
                )}
                {o.warehouse && (
                  <div style={{ fontSize: "0.68rem", color: "#6b7280", marginBottom: 4 }}>
                    <i className="bi bi-building me-1" />{o.warehouse.name} — {o.warehouse.location}
                  </div>
                )}

                {/* Tracking history */}
                {o.trackingHistory.length > 0 && (
                  <div style={{ margin: "6px 0", padding: "6px 8px", background: "#f8f9fb", borderRadius: 8, borderLeft: "3px solid #e5e7eb" }}>
                    {o.trackingHistory.map((t, ti) => (
                      <div key={ti} style={{ fontSize: "0.67rem", color: "#6b7280", marginBottom: ti < o.trackingHistory.length - 1 ? 2 : 0 }}>
                        <i className="bi bi-pin-map me-1" />{t.status}{t.location ? ` — ${t.location}` : ""} <span style={{ color: "#9ca3af" }}>({timeAgo(t.timestamp)})</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Amounts + payment */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: "0.82rem", color: "#111" }}>{fmt(o.totalAmount)}</span>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {isLate && <span style={{ padding: "2px 7px", borderRadius: 999, background: "#fef2f2", color: "#ef4444", fontSize: "0.62rem", fontWeight: 700 }}>DELAYED</span>}
                    <span style={{ padding: "2px 7px", borderRadius: 999, background: payStatus === "SUCCESS" ? "#ecfdf5" : payStatus === "FAILED" ? "#fef2f2" : "#fffbeb", color: payStatus === "SUCCESS" ? "#10b981" : payStatus === "FAILED" ? "#ef4444" : "#f59e0b", fontSize: "0.62rem", fontWeight: 700 }}>
                      {payStatus === "SUCCESS" ? "PAID" : payStatus === "FAILED" ? "PAY FAIL" : "PAY PENDING"}
                    </span>
                    {hasRefund && <span style={{ padding: "2px 7px", borderRadius: 999, background: "#eff6ff", color: "#3b82f6", fontSize: "0.62rem", fontWeight: 700 }}>REFUND: {o.refunds[0].status}</span>}
                    {o.payments[0]?.method && <span style={{ padding: "2px 7px", borderRadius: 999, background: "#f3f4f6", color: "#6b7280", fontSize: "0.62rem", fontWeight: 600 }}>{o.payments[0].method}</span>}
                  </div>
                </div>

                {/* Quick actions row */}
                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {o.status !== "DELIVERED" && o.status !== "CANCELLED" && (
                    <IssueFixButton label="→ Delivered" icon="bi-check2-all" color="#10b981" isPending={pending}
                      onClick={() => doAction(() => adminForceOrderStatusAction(o.id, "DELIVERED"))} />
                  )}
                  {!["CANCELLED", "DELIVERED"].includes(o.status) && (
                    <IssueFixButton label="Cancel" icon="bi-x-circle" color="#ef4444" isPending={pending}
                      onClick={() => doAction(() => adminCancelOrderAction(o.id))} />
                  )}
                  {o.payments.filter(p => p.status === "FAILED").map(p => (
                    <IssueFixButton key={p.id} label="Mark Paid" icon="bi-check-circle" color="#10b981" isPending={pending}
                      onClick={() => doAction(() => adminMarkPaymentSuccessAction(p.id))} />
                  ))}
                  {o.refunds.filter(r => r.status === "PENDING").map(r => (
                    <IssueFixButton key={r.id} label="Approve Refund" icon="bi-arrow-return-left" color="#3b82f6" isPending={pending}
                      onClick={() => doAction(() => adminApproveRefundAction(r.id, o.id))} />
                  ))}
                </div>
              </div>
            );
          })
        )}

        {/* ── PROFILE TAB ── */}
        {tab === "profile" && intel.user && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ padding: "12px 14px", background: "#fff", borderRadius: 12, border: "1.5px solid #f0f0f0" }}>
              <div style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 600, marginBottom: 8 }}>ACCOUNT INFO</div>
              {[
                { l: "Name", v: intel.user.name },
                { l: "Email", v: intel.user.email },
                { l: "Phone", v: intel.user.phone ?? "Not provided" },
                { l: "Member since", v: new Date(intel.user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
                { l: "Account age", v: `${stats.accountAgeDays} days` },
                { l: "Roles", v: intel.user.roles.map((r: any) => r.role?.name).join(", ") || "Customer" },
                { l: "Wallet Balance", v: fmt(walletBalance) },
              ].map(row => (
                <div key={row.l} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "5px 0", borderBottom: "1px solid #f8f9fb", fontSize: "0.76rem" }}>
                  <span style={{ color: "#6b7280", fontWeight: 600 }}>{row.l}</span>
                  <span style={{ color: "#111", fontWeight: 700, textAlign: "right", maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.v}</span>
                </div>
              ))}
            </div>

            {intel.user.sellerProfile && (
              <div style={{ padding: "12px 14px", background: "#fff", borderRadius: 12, border: "1.5px solid #f0f0f0" }}>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 600, marginBottom: 8 }}>SELLER PROFILE</div>
                {[
                  { l: "Store", v: intel.user.sellerProfile.companyName },
                  { l: "Verified", v: intel.user.sellerProfile.isVerified ? "✅ Yes" : "❌ No" },
                  { l: "KYC Status", v: intel.user.sellerProfile.kycStatus },
                ].map(row => (
                  <div key={row.l} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "5px 0", borderBottom: "1px solid #f8f9fb", fontSize: "0.76rem" }}>
                    <span style={{ color: "#6b7280", fontWeight: 600 }}>{row.l}</span>
                    <span style={{ color: "#111", fontWeight: 700 }}>{row.v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Default Address */}
            {intel.user.customerProfile?.addresses?.[0] && (
              <div style={{ padding: "12px 14px", background: "#fff", borderRadius: 12, border: "1.5px solid #f0f0f0" }}>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 600, marginBottom: 6 }}>DEFAULT ADDRESS</div>
                {(() => {
                  const a = intel.user.customerProfile.addresses[0];
                  return <div style={{ fontSize: "0.76rem", color: "#374151", lineHeight: 1.6 }}>{a.street}, {a.city}, {a.state} — {a.postalCode}</div>;
                })()}
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div style={{ padding: "12px 14px", background: "#fff", borderRadius: 12, border: "1.5px solid #f0f0f0" }}>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 600, marginBottom: 8 }}>RECENT REVIEWS</div>
                {reviews.slice(0, 3).map(r => (
                  <div key={r.id} style={{ padding: "6px 0", borderBottom: "1px solid #f8f9fb" }}>
                    <div style={{ fontSize: "0.73rem", fontWeight: 700, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.product.title}</div>
                    <div style={{ fontSize: "0.68rem", color: "#f59e0b" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                    {r.comment && <div style={{ fontSize: "0.7rem", color: "#6b7280", fontStyle: "italic", marginTop: 2 }}>"{r.comment}"</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === "history" && (
          allTickets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: "0.82rem" }}>No previous tickets.</div>
          ) : allTickets.map(t => (
            <div key={t.id} style={{ padding: "10px 12px", background: "#fff", borderRadius: 10, border: "1.5px solid #f0f0f0" }}>
              <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 5 }}>{t.subject}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <StatusBadge status={t.status} />
                <span style={{ fontSize: "0.65rem", color: "#9ca3af" }}>{timeAgo(t.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function TicketDashboard({ tickets, activeTicket, userIntelligence }: {
  tickets: Ticket[];
  activeTicket: ActiveTicket | null;
  userIntelligence: UserIntelligence | null;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeTicket]);

  const filtered = tickets.filter(t => {
    const matchFilter = filter === "ALL" || t.status === filter;
    const q = search.toLowerCase();
    return matchFilter && (!q || t.subject.toLowerCase().includes(q) || t.user.name.toLowerCase().includes(q) || t.user.email.toLowerCase().includes(q));
  });

  const counts = { ALL: tickets.length, OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 };
  tickets.forEach(t => { if ((counts as any)[t.status] !== undefined) (counts as any)[t.status]++; });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;
    startTransition(async () => {
      const res = await addTicketMessageAction(activeTicket.id, replyText);
      if (res.success) { setReplyText(""); toast.success(res.message); router.refresh(); }
      else toast.error(res.message);
    });
  };

  const handleStatusChange = (status: string) => {
    if (!activeTicket) return;
    startTransition(async () => {
      const res = await updateTicketStatusAction(activeTicket.id, status);
      if (res.success) { toast.success(res.message); router.refresh(); }
      else toast.error(res.message);
    });
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 140px)", minHeight: 560, fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f8f9fb", borderRadius: 20, overflow: "hidden", border: "1.5px solid #e8e8ec", boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}>
      <style>{`
        .tkt-row { transition: all 0.15s; cursor: pointer; }
        .tkt-row:hover { background: #f8f9fb !important; }
        .tkt-row.tkt-active { background: #fff8f8 !important; border-right: 3px solid #ef4444 !important; }
        .tkt-search:focus { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
        .tkt-reply-area:focus { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
        .tkt-status-select:focus { border-color: #ef4444 !important; }
        .tkt-msg { animation: msgIn 0.2s ease; }
        @keyframes msgIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 99px; }
      `}</style>

      {/* ── LEFT: Ticket List ── */}
      <div style={{ width: 300, minWidth: 240, borderRight: "1.5px solid #e8e8ec", display: "flex", flexDirection: "column", background: "#fff", flexShrink: 0 }}>
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <h5 style={{ fontWeight: 800, margin: 0, fontSize: "0.92rem", color: "#111" }}><i className="bi bi-headset" style={{ color: "#ef4444", marginRight: 6 }} />Helpdesk</h5>
              <p style={{ margin: "1px 0 0", fontSize: "0.7rem", color: "#9ca3af" }}>{tickets.length} total tickets</p>
            </div>
            {counts.OPEN > 0 && <span style={{ background: "#ef4444", color: "#fff", borderRadius: 999, padding: "2px 8px", fontSize: "0.68rem", fontWeight: 700 }}>{counts.OPEN} open</span>}
          </div>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <i className="bi bi-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "0.78rem" }} />
            <input className="tkt-search" type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "7px 10px 7px 28px", border: "1.5px solid #e5e7eb", borderRadius: 9, fontSize: "0.77rem", outline: "none", boxSizing: "border-box", background: "#fafafa", transition: "border-color 0.15s" }} />
          </div>
          <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
            {(["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "3px 9px", borderRadius: 999, fontSize: "0.66rem", fontWeight: 600, background: filter === f ? "#ef4444" : "#f3f4f6", color: filter === f ? "#fff" : "#6b7280", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                {f.replace("_", " ")} ({counts[f as keyof typeof counts]})
              </button>
            ))}
          </div>
        </div>

        <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: "50px 16px", color: "#9ca3af" }}><i className="bi bi-inbox" style={{ fontSize: "1.8rem", display: "block", marginBottom: 6 }} /><span style={{ fontSize: "0.8rem" }}>No matching tickets</span></div>}
          {filtered.map(t => {
            const isActive = activeTicket?.id === t.id;
            const lastMsg = t.conversations[0]?.messages[t.conversations[0].messages.length - 1]?.body ?? "No messages yet.";
            return (
              <div key={t.id} className={`tkt-row ${isActive ? "tkt-active" : ""}`} onClick={() => router.push(`/spr/admin/support?id=${t.id}`)} style={{ padding: "11px 14px", borderBottom: "1px solid #f4f4f6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Avatar name={t.user.name} size={24} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</div>
                    <div style={{ fontSize: "0.65rem", color: "#9ca3af" }}>{t.user.name}</div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <p style={{ margin: 0, fontSize: "0.7rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderLeft: "2px solid #e5e7eb", paddingLeft: 7, fontStyle: "italic" }}>{lastMsg}</p>
                <div style={{ marginTop: 4, fontSize: "0.63rem", color: "#9ca3af" }}>{timeAgo(t.updatedAt)} · #{t.id.slice(-8).toUpperCase()}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CENTER: Conversation ── */}
      {activeTicket ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff", minWidth: 0 }}>
          {/* Thread Header */}
          <div style={{ padding: "12px 18px", borderBottom: "1.5px solid #f0f0f4" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <button onClick={() => router.push("/spr/admin/support")} style={{ background: "#f4f4f4", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="bi bi-arrow-left" style={{ fontSize: "0.8rem" }} />
                </button>
                <Avatar name={activeTicket.user.name} size={32} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeTicket.subject}</div>
                  <div style={{ fontSize: "0.68rem", color: "#6b7280" }}><strong>{activeTicket.user.name}</strong> · {activeTicket.user.email}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: "0.7rem", color: "#6b7280", fontWeight: 600 }}>Status</span>
                <select className="tkt-status-select" value={activeTicket.status} onChange={e => handleStatusChange(e.target.value)} disabled={isPending}
                  style={{ padding: "4px 9px", border: "1.5px solid #e5e7eb", borderRadius: 7, fontSize: "0.76rem", fontWeight: 600, outline: "none", background: "#fafafa", cursor: "pointer" }}>
                  <option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 8, padding: "7px 10px", background: "#f8f9fb", borderRadius: 9, display: "flex", gap: 14, flexWrap: "wrap", fontSize: "0.7rem", color: "#374151" }}>
              <span><i className="bi bi-calendar3 me-1 text-muted" />Opened <strong>{new Date(activeTicket.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong></span>
              <span><i className="bi bi-chat-dots me-1 text-muted" /><strong>{activeTicket.conversations[0]?.messages.length ?? 0}</strong> messages</span>
              <span><i className="bi bi-arrow-repeat me-1 text-muted" />Updated <strong>{timeAgo(activeTicket.updatedAt)}</strong></span>
              {userIntelligence && userIntelligence.detectedIssues.filter(i => i.severity === "critical").length > 0 && (
                <span style={{ background: "#fef2f2", color: "#ef4444", padding: "1px 8px", borderRadius: 999, fontWeight: 700 }}>
                  <i className="bi bi-exclamation-octagon-fill me-1" />{userIntelligence.detectedIssues.filter(i => i.severity === "critical").length} critical issues
                </span>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12, background: "#f8f9fb" }}>
            {(!activeTicket.conversations[0] || activeTicket.conversations[0].messages.length === 0) && (
              <div style={{ textAlign: "center", color: "#9ca3af", paddingTop: 40 }}>
                <i className="bi bi-chat-square-dots" style={{ fontSize: "2rem", display: "block", marginBottom: 8 }} />
                <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>No messages in this ticket yet.</span>
              </div>
            )}
            {activeTicket.conversations[0]?.messages.map(m => {
              const isAdmin = m.senderId !== activeTicket.userId;
              return (
                <div key={m.id} className="tkt-msg" style={{ display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
                  {!isAdmin && <Avatar name={m.sender.name} size={26} />}
                  <div style={{ maxWidth: "68%", padding: "9px 13px", borderRadius: isAdmin ? "16px 4px 16px 16px" : "4px 16px 16px 16px", background: isAdmin ? "linear-gradient(135deg,#ef4444,#dc2626)" : "#fff", color: isAdmin ? "#fff" : "#1f2937", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, marginBottom: 3, opacity: 0.7 }}>{isAdmin ? "⚡ Support Team" : m.sender.name} · {timeAgo(m.createdAt)}</div>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.body}</p>
                  </div>
                  {isAdmin && <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#ef4444,#dc2626)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.58rem", fontWeight: 700, flexShrink: 0 }}>ADM</div>}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply */}
          {activeTicket.status !== "CLOSED" ? (
            <form onSubmit={handleSendReply} style={{ padding: "10px 16px", borderTop: "1.5px solid #f0f0f4", background: "#fff" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <textarea className="tkt-reply-area" rows={2} value={replyText} onChange={e => setReplyText(e.target.value)} disabled={isPending} onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSendReply(e as any); }}
                    placeholder="Reply professionally — Ctrl+Enter to send"
                    style={{ width: "100%", padding: "9px 11px", border: "1.5px solid #e5e7eb", borderRadius: 9, fontSize: "0.875rem", outline: "none", resize: "none", boxSizing: "border-box", background: "#fafafa", transition: "all 0.15s", lineHeight: 1.6, minHeight: 54 }} />
                  <span style={{ position: "absolute", bottom: 5, right: 9, fontSize: "0.6rem", color: "#9ca3af" }}>Ctrl+Enter</span>
                </div>
                <button type="submit" disabled={isPending || !replyText.trim()} style={{ background: replyText.trim() ? "linear-gradient(135deg,#ef4444,#dc2626)" : "#e5e7eb", border: "none", borderRadius: 9, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", color: replyText.trim() ? "#fff" : "#9ca3af", cursor: replyText.trim() ? "pointer" : "not-allowed", flexShrink: 0, transition: "all 0.15s" }}>
                  {isPending ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-send-fill" />}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ padding: "10px 16px", borderTop: "1.5px solid #f0f0f4", textAlign: "center", color: "#6b7280", fontSize: "0.78rem", background: "#fafafa" }}>
              <i className="bi bi-lock-fill me-1" /> Ticket closed — change status to re-open.
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fb", flexDirection: "column", textAlign: "center", padding: 40 }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <i className="bi bi-headset" style={{ fontSize: "1.8rem", color: "#ef4444" }} />
          </div>
          <h5 style={{ fontWeight: 800, color: "#374151", marginBottom: 6 }}>No Ticket Selected</h5>
          <p style={{ color: "#9ca3af", fontSize: "0.83rem", maxWidth: 240 }}>Click a ticket to open the conversation and view user intelligence.</p>
        </div>
      )}

      {/* ── RIGHT: Intelligence Panel ── */}
      {activeTicket && userIntelligence && (
        <IntelligencePanel intel={userIntelligence} user={activeTicket.user} ticketId={activeTicket.id} />
      )}
    </div>
  );
}
