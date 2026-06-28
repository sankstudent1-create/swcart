"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addTicketMessageAction, updateTicketStatusAction } from "@/app/actions/support";
import { toast } from "sonner";

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

interface TicketDashboardProps {
  tickets: Ticket[];
  activeTicket: ActiveTicket | null;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  OPEN:        { label: "Open",        color: "#ef4444", bg: "#fef2f2", dot: "#ef4444" },
  IN_PROGRESS: { label: "In Progress", color: "#f59e0b", bg: "#fffbeb", dot: "#f59e0b" },
  RESOLVED:    { label: "Resolved",    color: "#10b981", bg: "#ecfdf5", dot: "#10b981" },
  CLOSED:      { label: "Closed",      color: "#6b7280", bg: "#f3f4f6", dot: "#6b7280" },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.CLOSED;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 999,
      fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.04em",
      background: m.bg, color: m.color, border: `1px solid ${m.color}30`,
    }}>
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
      {initials}
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

export default function TicketDashboard({ tickets, activeTicket }: TicketDashboardProps) {
  const router = useRouter();
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTicket]);

  const filtered = tickets.filter(t => {
    const matchFilter = filter === "ALL" || t.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || t.subject.toLowerCase().includes(q) || t.user.name.toLowerCase().includes(q) || t.user.email.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const counts = {
    ALL: tickets.length,
    OPEN: tickets.filter(t => t.status === "OPEN").length,
    IN_PROGRESS: tickets.filter(t => t.status === "IN_PROGRESS").length,
    RESOLVED: tickets.filter(t => t.status === "RESOLVED").length,
    CLOSED: tickets.filter(t => t.status === "CLOSED").length,
  };

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

  const FILTER_TABS = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

  return (
    <div style={{ display: "flex", height: "calc(100vh - 140px)", minHeight: 560, fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f8f9fb", borderRadius: 20, overflow: "hidden", border: "1.5px solid #e8e8ec", boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}>
      <style>{`
        .tkt-row { transition: all 0.15s; cursor: pointer; }
        .tkt-row:hover { background: #f8f9fb !important; }
        .tkt-row.tkt-active { background: #fff8f8 !important; border-right: 3px solid #ef4444 !important; }
        .tkt-filter-pill { border: 1.5px solid transparent; transition: all 0.15s; cursor: pointer; white-space: nowrap; }
        .tkt-filter-pill.active { background: #ef4444; color: #fff !important; border-color: #ef4444; }
        .tkt-filter-pill:not(.active):hover { border-color: #e5e7eb; background: #f3f4f6; }
        .tkt-send-btn { transition: all 0.15s; }
        .tkt-send-btn:hover:not(:disabled) { transform: scale(1.05); }
        .tkt-msg { animation: msgIn 0.2s ease; }
        @keyframes msgIn { from { opacity:0; transform: translateY(5px); } to { opacity:1; transform: translateY(0); } }
        .tkt-search:focus { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
        .tkt-status-select:focus { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
        .tkt-reply-area:focus { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 99px; }
      `}</style>

      {/* ─── LEFT PANEL: Ticket List ─── */}
      <div style={{ width: activeTicket ? 340 : "100%", minWidth: activeTicket ? 300 : "auto", borderRight: "1.5px solid #e8e8ec", display: "flex", flexDirection: "column", background: "#fff", flexShrink: 0 }}>
        
        {/* Panel Header */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <h5 style={{ fontWeight: 800, margin: 0, fontSize: "1rem", color: "#111" }}>
                <i className="bi bi-headset" style={{ color: "#ef4444", marginRight: 8 }} />
                Support Helpdesk
              </h5>
              <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#9ca3af" }}>{tickets.length} tickets total</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {counts.OPEN > 0 && (
                <span style={{ background: "#ef4444", color: "#fff", borderRadius: 999, padding: "2px 8px", fontSize: "0.7rem", fontWeight: 700 }}>{counts.OPEN} open</span>
              )}
            </div>
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <i className="bi bi-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "0.85rem" }} />
            <input
              className="tkt-search"
              type="text"
              placeholder="Search tickets, user, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: "0.82rem", outline: "none", boxSizing: "border-box", background: "#fafafa", transition: "border-color 0.15s" }}
            />
          </div>

          {/* Filter pills */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12 }}>
            {FILTER_TABS.map(f => (
              <button
                key={f}
                className={`tkt-filter-pill ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
                style={{ padding: "4px 12px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 600, background: filter === f ? "#ef4444" : "#f3f4f6", color: filter === f ? "#fff" : "#6b7280", border: "none", cursor: "pointer" }}
              >
                {f.replace("_", " ")}
                <span style={{ marginLeft: 4, opacity: 0.8 }}>({counts[f as keyof typeof counts] ?? 0})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Ticket rows */}
        <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "50px 20px", color: "#9ca3af" }}>
              <i className="bi bi-inbox" style={{ fontSize: "2rem", display: "block", marginBottom: 8 }} />
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>No tickets match filters</span>
            </div>
          )}
          {filtered.map(t => {
            const isActive = activeTicket?.id === t.id;
            const lastMsg = t.conversations[0]?.messages[t.conversations[0].messages.length - 1]?.body ?? "No messages yet.";
            const msgCount = t.conversations[0]?.messages.length ?? 0;
            return (
              <div
                key={t.id}
                className={`tkt-row ${isActive ? "tkt-active" : ""}`}
                onClick={() => router.push(`/spr/admin/support?id=${t.id}`)}
                style={{ padding: "14px 20px", borderBottom: "1px solid #f4f4f6" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <Avatar name={t.user.name} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</div>
                    <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{t.user.name} · {t.user.email}</div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderLeft: "2.5px solid #e5e7eb", paddingLeft: 8, fontStyle: "italic" }}>{lastMsg}</p>
                <div style={{ marginTop: 6, display: "flex", gap: 12, fontSize: "0.68rem", color: "#9ca3af" }}>
                  <span><i className="bi bi-clock me-1" />{timeAgo(t.updatedAt)}</span>
                  <span><i className="bi bi-chat-dots me-1" />{msgCount}</span>
                  <span><i className="bi bi-hash" style={{ marginRight: 2 }} />{t.id.slice(-8).toUpperCase()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── RIGHT PANEL: Conversation ─── */}
      {activeTicket ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff", minWidth: 0 }}>
          
          {/* Thread Header */}
          <div style={{ padding: "16px 24px", borderBottom: "1.5px solid #f0f0f4", background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <button
                  onClick={() => router.push("/spr/admin/support")}
                  className="d-lg-none"
                  style={{ background: "#f4f4f4", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <i className="bi bi-arrow-left" />
                </button>
                <Avatar name={activeTicket.user.name} size={38} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeTicket.subject}</div>
                  <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: 1 }}>
                    <strong>{activeTicket.user.name}</strong> · {activeTicket.user.email} · <span style={{ color: "#9ca3af" }}>#{activeTicket.id.slice(-8).toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Status selector */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 600 }}>Status</span>
                <select
                  className="tkt-status-select"
                  value={activeTicket.status}
                  onChange={e => handleStatusChange(e.target.value)}
                  disabled={isPending}
                  style={{ padding: "6px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, outline: "none", background: "#fafafa", cursor: "pointer", transition: "border-color 0.15s" }}
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>

            {/* Customer info bar */}
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#fafafa", borderRadius: 10, border: "1px solid #f0f0f0", display: "flex", gap: 24, flexWrap: "wrap", fontSize: "0.75rem", color: "#374151" }}>
              <span><i className="bi bi-calendar3 me-1 text-muted" />Opened <strong>{new Date(activeTicket.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong></span>
              <span><i className="bi bi-arrow-repeat me-1 text-muted" />Updated <strong>{timeAgo(activeTicket.updatedAt)}</strong></span>
              <span><i className="bi bi-chat-dots me-1 text-muted" /><strong>{activeTicket.conversations[0]?.messages.length ?? 0}</strong> messages</span>
              <span><StatusBadge status={activeTicket.status} /></span>
            </div>
          </div>

          {/* Messages */}
          <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14, background: "#f8f9fb" }}>
            {(!activeTicket.conversations[0] || activeTicket.conversations[0].messages.length === 0) && (
              <div style={{ textAlign: "center", color: "#9ca3af", paddingTop: 60 }}>
                <i className="bi bi-chat-square-dots" style={{ fontSize: "2.5rem", display: "block", marginBottom: 10 }} />
                <span style={{ fontWeight: 600 }}>No messages yet in this ticket.</span>
              </div>
            )}
            {activeTicket.conversations[0]?.messages.map((m) => {
              const isAdmin = m.senderId !== activeTicket.userId;
              return (
                <div key={m.id} className="tkt-msg" style={{ display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start", gap: 10, alignItems: "flex-end" }}>
                  {!isAdmin && <Avatar name={m.sender.name} size={30} />}
                  <div style={{
                    maxWidth: "70%",
                    padding: "11px 15px",
                    borderRadius: isAdmin ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                    background: isAdmin ? "linear-gradient(135deg,#ef4444,#dc2626)" : "#fff",
                    color: isAdmin ? "#fff" : "#1f2937",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                    fontSize: "0.875rem",
                    lineHeight: 1.6,
                  }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: 700, marginBottom: 5, opacity: 0.75 }}>
                      {isAdmin ? "⚡ Support Team" : m.sender.name}
                      <span style={{ marginLeft: 8, fontWeight: 400 }}>{timeAgo(m.createdAt)}</span>
                    </div>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.body}</p>
                  </div>
                  {isAdmin && (
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#ef4444,#dc2626)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0 }}>
                      ADM
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Box */}
          {activeTicket.status !== "CLOSED" ? (
            <form onSubmit={handleSendReply} style={{ padding: "16px 24px", borderTop: "1.5px solid #f0f0f4", background: "#fff" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <textarea
                    className="tkt-reply-area"
                    style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e5e7eb", borderRadius: 12, fontSize: "0.875rem", outline: "none", resize: "none", boxSizing: "border-box", background: "#fafafa", transition: "border-color 0.15s, box-shadow 0.15s", lineHeight: 1.6, minHeight: 64 }}
                    placeholder="Type your reply here — be professional and helpful..."
                    rows={2}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    required
                    disabled={isPending}
                    onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSendReply(e as any); }}
                  />
                  <span style={{ position: "absolute", bottom: 8, right: 12, fontSize: "0.65rem", color: "#9ca3af" }}>Ctrl+Enter to send</span>
                </div>
                <button
                  type="submit"
                  className="tkt-send-btn"
                  disabled={isPending || !replyText.trim()}
                  style={{ background: replyText.trim() ? "linear-gradient(135deg,#ef4444,#dc2626)" : "#e5e7eb", border: "none", borderRadius: 12, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", color: replyText.trim() ? "#fff" : "#9ca3af", flexShrink: 0, cursor: replyText.trim() ? "pointer" : "not-allowed", transition: "all 0.15s" }}
                >
                  {isPending ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-send-fill" style={{ fontSize: "1rem" }} />}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ padding: "14px 24px", borderTop: "1.5px solid #f0f0f4", textAlign: "center", color: "#6b7280", fontSize: "0.82rem", background: "#fafafa" }}>
              <i className="bi bi-lock-fill me-1" /> This ticket is closed. Change the status to re-open it.
            </div>
          )}
        </div>
      ) : (
        /* Empty state */
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8f9fb", textAlign: "center", padding: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <i className="bi bi-headset" style={{ fontSize: "2rem", color: "#ef4444" }} />
          </div>
          <h5 style={{ fontWeight: 800, color: "#374151", marginBottom: 6 }}>No Ticket Selected</h5>
          <p style={{ color: "#9ca3af", fontSize: "0.85rem", maxWidth: 280 }}>Select a ticket from the list to view the customer conversation and respond.</p>
        </div>
      )}
    </div>
  );
}
