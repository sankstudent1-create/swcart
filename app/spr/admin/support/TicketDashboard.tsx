"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addTicketMessageAction, updateTicketStatusAction } from "@/app/actions/support";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  sender: { name: string; email: string; avatar: string | null };
}
interface Ticket {
  id: string;
  userId: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: { name: string; email: string };
  conversations: Array<{ messages: Array<{ body: string; createdAt: string }> }>;
}
interface ActiveTicket extends Ticket {
  conversations: Array<{ messages: Message[] }>;
}
interface Payment { id: string; method: string; status: string; amount: number; createdAt: string; }
interface Refund  { id: string; amount: number; status: string; reason: string | null; createdAt: string; }
interface OrderItem { id: string; priceAtBuy: number; quantity: number; variant: { product: { title: string } } }
interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  trackingNumber: string | null;
  payments: Payment[];
  refunds: Refund[];
  sellerOrders: Array<{ items: OrderItem[] }>;
}
interface UserIntelligence {
  orders: Order[];
  allTickets: Array<{ id: string; subject: string; status: string; createdAt: string }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  OPEN:        { label: "Open",        color: "#ef4444", bg: "#fef2f2", dot: "#ef4444" },
  IN_PROGRESS: { label: "In Progress", color: "#f59e0b", bg: "#fffbeb", dot: "#f59e0b" },
  RESOLVED:    { label: "Resolved",    color: "#10b981", bg: "#ecfdf5", dot: "#10b981" },
  CLOSED:      { label: "Closed",      color: "#6b7280", bg: "#f3f4f6", dot: "#6b7280" },
};

const ORDER_STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  PENDING:    { color: "#f59e0b", bg: "#fffbeb" },
  PROCESSING: { color: "#3b82f6", bg: "#eff6ff" },
  SHIPPED:    { color: "#8b5cf6", bg: "#f5f3ff" },
  DELIVERED:  { color: "#10b981", bg: "#ecfdf5" },
  CANCELLED:  { color: "#ef4444", bg: "#fef2f2" },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.CLOSED;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.04em", background: m.bg, color: m.color, border: `1px solid ${m.color}30` }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.dot, display: "inline-block" }} />
      {m.label}
    </span>
  );
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue},50%,55%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.38, fontWeight: 700, flexShrink: 0 }}>
      {name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
    </div>
  );
}

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatCurrency(n: number) { return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

// ─── User Intelligence Sidebar ────────────────────────────────────────────────

function IntelligencePanel({ intel, user, ticketId }: { intel: UserIntelligence; user: { name: string; email: string }; ticketId: string }) {
  const [tab, setTab] = useState<"orders" | "tickets">("orders");

  const failedPayments = intel.orders.flatMap(o => o.payments.filter(p => p.status === "FAILED"));
  const pendingRefunds = intel.orders.flatMap(o => o.refunds.filter(r => r.status === "PENDING"));
  const lateOrders = intel.orders.filter(o => ["PENDING", "PROCESSING"].includes(o.status) && (Date.now() - new Date(o.createdAt).getTime()) > 5 * 86400 * 1000);
  const totalSpend = intel.orders.filter(o => o.status === "DELIVERED").reduce((a, b) => a + b.totalAmount, 0);

  return (
    <div style={{ width: 300, flexShrink: 0, borderLeft: "1.5px solid #e8e8ec", background: "#fafafa", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      {/* User Card */}
      <div style={{ padding: "18px 18px 14px", borderBottom: "1.5px solid #f0f0f0", background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Avatar name={user.name} size={40} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
            <div style={{ fontSize: "0.72rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
          </div>
        </div>

        {/* Key Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "Orders", value: intel.orders.length, icon: "bi-bag", color: "#3b82f6" },
            { label: "Total Spend", value: formatCurrency(totalSpend), icon: "bi-currency-rupee", color: "#10b981" },
            { label: "Tickets", value: intel.allTickets.length, icon: "bi-headset", color: "#8b5cf6" },
            { label: "Refunds", value: intel.orders.flatMap(o => o.refunds).length, icon: "bi-arrow-return-left", color: "#f59e0b" },
          ].map(m => (
            <div key={m.label} style={{ padding: "8px 10px", background: "#f8f9fb", borderRadius: 10, border: "1px solid #f0f0f0" }}>
              <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 600, marginBottom: 2 }}>
                <i className={`bi ${m.icon} me-1`} style={{ color: m.color }} />{m.label}
              </div>
              <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#111" }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {(failedPayments.length > 0 || pendingRefunds.length > 0 || lateOrders.length > 0) && (
        <div style={{ padding: "10px 14px", background: "#fffbeb", borderBottom: "1.5px solid #fef08a" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#92400e", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ color: "#f59e0b" }} /> Active Issues
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {failedPayments.length > 0 && (
              <div style={{ fontSize: "0.72rem", padding: "4px 8px", background: "#fef2f2", borderRadius: 6, color: "#ef4444", fontWeight: 600 }}>
                <i className="bi bi-x-circle-fill me-1" />{failedPayments.length} failed payment{failedPayments.length > 1 ? "s" : ""}
              </div>
            )}
            {pendingRefunds.length > 0 && (
              <div style={{ fontSize: "0.72rem", padding: "4px 8px", background: "#fffbeb", borderRadius: 6, color: "#f59e0b", fontWeight: 600 }}>
                <i className="bi bi-clock-fill me-1" />{pendingRefunds.length} pending refund{pendingRefunds.length > 1 ? "s" : ""}
              </div>
            )}
            {lateOrders.length > 0 && (
              <div style={{ fontSize: "0.72rem", padding: "4px 8px", background: "#fef2f2", borderRadius: 6, color: "#ef4444", fontWeight: 600 }}>
                <i className="bi bi-truck me-1" />{lateOrders.length} delayed order{lateOrders.length > 1 ? "s" : ""} (&gt;5 days)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1.5px solid #f0f0f0", background: "#fff" }}>
        {(["orders", "tickets"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "9px 0", border: "none", borderBottom: tab === t ? "2.5px solid #ef4444" : "2.5px solid transparent", background: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.75rem", color: tab === t ? "#ef4444" : "#6b7280", textTransform: "capitalize" }}>
            {t} ({t === "orders" ? intel.orders.length : intel.allTickets.length})
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
        {tab === "orders" && (
          intel.orders.length === 0 ? (
            <div style={{ textAlign: "center", color: "#9ca3af", padding: "30px 0", fontSize: "0.8rem" }}>No orders yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {intel.orders.map(o => {
                const items = o.sellerOrders.flatMap(s => s.items);
                const payStatus = o.payments[0]?.status ?? "N/A";
                const hasRefund = o.refunds.length > 0;
                const isLate = ["PENDING", "PROCESSING"].includes(o.status) && (Date.now() - new Date(o.createdAt).getTime()) > 5 * 86400 * 1000;
                const oColor = ORDER_STATUS_COLOR[o.status] ?? { color: "#6b7280", bg: "#f3f4f6" };
                return (
                  <div key={o.id} style={{ padding: "11px 12px", background: "#fff", borderRadius: 12, border: `1.5px solid ${isLate ? "#fca5a5" : "#f0f0f0"}`, boxShadow: isLate ? "0 0 0 2px #fef2f2" : "none" }}>
                    {/* Order header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontFamily: "monospace", fontSize: "0.7rem", fontWeight: 700, color: "#374151" }}>#{o.id.slice(-8).toUpperCase()}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.65rem", fontWeight: 700, background: oColor.bg, color: oColor.color }}>{o.status}</span>
                    </div>

                    {/* Items */}
                    <div style={{ fontSize: "0.75rem", color: "#374151", marginBottom: 6, lineHeight: 1.4 }}>
                      {items.slice(0, 2).map((it, i) => (
                        <div key={i} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <i className="bi bi-dot" />{it.quantity}× {it.variant.product.title}
                        </div>
                      ))}
                      {items.length > 2 && <div style={{ color: "#9ca3af" }}>+{items.length - 2} more items</div>}
                    </div>

                    {/* Meta row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: "0.8rem", color: "#111" }}>{formatCurrency(o.totalAmount)}</span>
                      <span style={{ fontSize: "0.65rem", color: "#9ca3af" }}>{timeAgo(o.createdAt)}</span>
                    </div>

                    {/* Flags */}
                    <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {isLate && (
                        <span style={{ fontSize: "0.62rem", padding: "2px 7px", borderRadius: 999, background: "#fef2f2", color: "#ef4444", fontWeight: 700 }}>
                          <i className="bi bi-clock me-1" />DELAYED
                        </span>
                      )}
                      {payStatus === "FAILED" && (
                        <span style={{ fontSize: "0.62rem", padding: "2px 7px", borderRadius: 999, background: "#fef2f2", color: "#ef4444", fontWeight: 700 }}>
                          <i className="bi bi-x-circle me-1" />PAY FAILED
                        </span>
                      )}
                      {payStatus === "SUCCESS" && (
                        <span style={{ fontSize: "0.62rem", padding: "2px 7px", borderRadius: 999, background: "#ecfdf5", color: "#10b981", fontWeight: 700 }}>
                          <i className="bi bi-check-circle me-1" />PAID
                        </span>
                      )}
                      {payStatus === "PENDING" && (
                        <span style={{ fontSize: "0.62rem", padding: "2px 7px", borderRadius: 999, background: "#fffbeb", color: "#f59e0b", fontWeight: 700 }}>
                          <i className="bi bi-hourglass me-1" />PAY PENDING
                        </span>
                      )}
                      {hasRefund && (
                        <span style={{ fontSize: "0.62rem", padding: "2px 7px", borderRadius: 999, background: "#eff6ff", color: "#3b82f6", fontWeight: 700 }}>
                          <i className="bi bi-arrow-return-left me-1" />REFUND: {o.refunds[0].status}
                        </span>
                      )}
                      {o.payments[0]?.method && (
                        <span style={{ fontSize: "0.62rem", padding: "2px 7px", borderRadius: 999, background: "#f3f4f6", color: "#6b7280", fontWeight: 600 }}>
                          {o.payments[0].method}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === "tickets" && (
          intel.allTickets.length === 0 ? (
            <div style={{ textAlign: "center", color: "#9ca3af", padding: "30px 0", fontSize: "0.8rem" }}>No other tickets</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {intel.allTickets.map(t => (
                <div key={t.id} style={{ padding: "9px 11px", background: "#fff", borderRadius: 10, border: "1.5px solid #f0f0f0" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.78rem", color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>{t.subject}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <StatusBadge status={t.status} />
                    <span style={{ fontSize: "0.65rem", color: "#9ca3af" }}>{timeAgo(t.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

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
    const matchSearch = !q || t.subject.toLowerCase().includes(q) || t.user.name.toLowerCase().includes(q) || t.user.email.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const counts = { ALL: tickets.length, OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 };
  tickets.forEach(t => { if (counts[t.status as keyof typeof counts] !== undefined) (counts as any)[t.status]++; });

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
        .tkt-status-select:focus { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
        .tkt-reply-area:focus { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
        .tkt-msg { animation: msgIn 0.2s ease; }
        @keyframes msgIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 99px; }
      `}</style>

      {/* ── LEFT: Ticket List ── */}
      <div style={{ width: 320, minWidth: 260, borderRight: "1.5px solid #e8e8ec", display: "flex", flexDirection: "column", background: "#fff", flexShrink: 0 }}>
        <div style={{ padding: "18px 18px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <h5 style={{ fontWeight: 800, margin: 0, fontSize: "0.95rem", color: "#111" }}>
                <i className="bi bi-headset" style={{ color: "#ef4444", marginRight: 7 }} />Support Helpdesk
              </h5>
              <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#9ca3af" }}>{tickets.length} total tickets</p>
            </div>
            {counts.OPEN > 0 && <span style={{ background: "#ef4444", color: "#fff", borderRadius: 999, padding: "2px 8px", fontSize: "0.68rem", fontWeight: 700 }}>{counts.OPEN} open</span>}
          </div>

          <div style={{ position: "relative", marginBottom: 10 }}>
            <i className="bi bi-search" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "0.8rem" }} />
            <input className="tkt-search" type="text" placeholder="Search by subject, user, email..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "8px 10px 8px 30px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: "0.78rem", outline: "none", boxSizing: "border-box", background: "#fafafa", transition: "border-color 0.15s" }} />
          </div>

          <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
            {(["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "3px 10px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 600, background: filter === f ? "#ef4444" : "#f3f4f6", color: filter === f ? "#fff" : "#6b7280", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                {f.replace("_", " ")} ({counts[f as keyof typeof counts]})
              </button>
            ))}
          </div>
        </div>

        <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "50px 20px", color: "#9ca3af" }}>
              <i className="bi bi-inbox" style={{ fontSize: "2rem", display: "block", marginBottom: 8 }} />
              <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>No matching tickets</span>
            </div>
          )}
          {filtered.map(t => {
            const isActive = activeTicket?.id === t.id;
            const lastMsg = t.conversations[0]?.messages[t.conversations[0].messages.length - 1]?.body ?? "No messages yet.";
            return (
              <div key={t.id} className={`tkt-row ${isActive ? "tkt-active" : ""}`} onClick={() => router.push(`/spr/admin/support?id=${t.id}`)} style={{ padding: "12px 16px", borderBottom: "1px solid #f4f4f6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <Avatar name={t.user.name} size={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</div>
                    <div style={{ fontSize: "0.67rem", color: "#9ca3af" }}>{t.user.name}</div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderLeft: "2px solid #e5e7eb", paddingLeft: 7, fontStyle: "italic" }}>{lastMsg}</p>
                <div style={{ marginTop: 5, fontSize: "0.65rem", color: "#9ca3af", display: "flex", gap: 10 }}>
                  <span>{timeAgo(t.updatedAt)}</span>
                  <span>#{t.id.slice(-8).toUpperCase()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CENTER: Conversation ── */}
      {activeTicket ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff", minWidth: 0 }}>
          {/* Thread Header */}
          <div style={{ padding: "14px 20px", borderBottom: "1.5px solid #f0f0f4" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <button onClick={() => router.push("/spr/admin/support")} style={{ background: "#f4f4f4", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="bi bi-arrow-left" style={{ fontSize: "0.85rem" }} />
                </button>
                <Avatar name={activeTicket.user.name} size={36} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeTicket.subject}</div>
                  <div style={{ fontSize: "0.7rem", color: "#6b7280" }}><strong>{activeTicket.user.name}</strong> · {activeTicket.user.email}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 600 }}>Status</span>
                <select className="tkt-status-select" value={activeTicket.status} onChange={e => handleStatusChange(e.target.value)} disabled={isPending}
                  style={{ padding: "5px 10px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600, outline: "none", background: "#fafafa", cursor: "pointer" }}>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>

            {/* Context bar */}
            <div style={{ marginTop: 10, padding: "8px 12px", background: "#f8f9fb", borderRadius: 10, border: "1px solid #f0f0f0", display: "flex", gap: 16, flexWrap: "wrap", fontSize: "0.72rem", color: "#374151" }}>
              <span><i className="bi bi-calendar3 me-1 text-muted" />Opened <strong>{new Date(activeTicket.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong></span>
              <span><i className="bi bi-arrow-repeat me-1 text-muted" />Updated <strong>{timeAgo(activeTicket.updatedAt)}</strong></span>
              <span><i className="bi bi-chat-dots me-1 text-muted" /><strong>{activeTicket.conversations[0]?.messages.length ?? 0}</strong> messages</span>
              <span><StatusBadge status={activeTicket.status} /></span>
            </div>
          </div>

          {/* Messages */}
          <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12, background: "#f8f9fb" }}>
            {(!activeTicket.conversations[0] || activeTicket.conversations[0].messages.length === 0) && (
              <div style={{ textAlign: "center", color: "#9ca3af", paddingTop: 50 }}>
                <i className="bi bi-chat-square-dots" style={{ fontSize: "2.5rem", display: "block", marginBottom: 8 }} />
                <span style={{ fontWeight: 600 }}>No messages in this ticket yet.</span>
              </div>
            )}
            {activeTicket.conversations[0]?.messages.map(m => {
              const isAdmin = m.senderId !== activeTicket.userId;
              return (
                <div key={m.id} className="tkt-msg" style={{ display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
                  {!isAdmin && <Avatar name={m.sender.name} size={28} />}
                  <div style={{ maxWidth: "68%", padding: "10px 14px", borderRadius: isAdmin ? "16px 4px 16px 16px" : "4px 16px 16px 16px", background: isAdmin ? "linear-gradient(135deg,#ef4444,#dc2626)" : "#fff", color: isAdmin ? "#fff" : "#1f2937", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                    <div style={{ fontSize: "0.67rem", fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>
                      {isAdmin ? "⚡ Support Team" : m.sender.name} · {timeAgo(m.createdAt)}
                    </div>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.body}</p>
                  </div>
                  {isAdmin && (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#ef4444,#dc2626)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.6rem", fontWeight: 700, flexShrink: 0 }}>ADM</div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply */}
          {activeTicket.status !== "CLOSED" ? (
            <form onSubmit={handleSendReply} style={{ padding: "12px 18px", borderTop: "1.5px solid #f0f0f4", background: "#fff" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <textarea className="tkt-reply-area" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: "0.875rem", outline: "none", resize: "none", boxSizing: "border-box", background: "#fafafa", transition: "all 0.15s", lineHeight: 1.6, minHeight: 58 }}
                    placeholder="Reply professionally — Ctrl+Enter to send" rows={2} value={replyText} onChange={e => setReplyText(e.target.value)} disabled={isPending}
                    onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSendReply(e as any); }} />
                  <span style={{ position: "absolute", bottom: 6, right: 10, fontSize: "0.62rem", color: "#9ca3af" }}>Ctrl+Enter</span>
                </div>
                <button type="submit" disabled={isPending || !replyText.trim()} style={{ background: replyText.trim() ? "linear-gradient(135deg,#ef4444,#dc2626)" : "#e5e7eb", border: "none", borderRadius: 10, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: replyText.trim() ? "#fff" : "#9ca3af", flexShrink: 0, cursor: replyText.trim() ? "pointer" : "not-allowed", transition: "all 0.15s" }}>
                  {isPending ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-send-fill" />}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ padding: "12px 18px", borderTop: "1.5px solid #f0f0f4", textAlign: "center", color: "#6b7280", fontSize: "0.8rem", background: "#fafafa" }}>
              <i className="bi bi-lock-fill me-1" /> Ticket closed — change status to re-open.
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fb", flexDirection: "column", textAlign: "center", padding: 40 }}>
          <div style={{ width: 70, height: 70, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <i className="bi bi-headset" style={{ fontSize: "2rem", color: "#ef4444" }} />
          </div>
          <h5 style={{ fontWeight: 800, color: "#374151", marginBottom: 6 }}>No Ticket Selected</h5>
          <p style={{ color: "#9ca3af", fontSize: "0.85rem", maxWidth: 260 }}>Select a ticket from the list to view the conversation and user intelligence.</p>
        </div>
      )}

      {/* ── RIGHT: User Intelligence Panel ── */}
      {activeTicket && userIntelligence && (
        <IntelligencePanel intel={userIntelligence} user={activeTicket.user} ticketId={activeTicket.id} />
      )}
    </div>
  );
}
