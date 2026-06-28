"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createCustomerTicketAction, sendCustomerTicketMessageAction } from "@/app/actions/tickets";
import { toast } from "sonner";

interface Message {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  sender: { name: string };
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  conversations: Array<{ messages: Message[] }>;
}

interface ProfileSupportManagerProps {
  tickets: Ticket[];
  userId: string;
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
      fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.04em",
      background: m.bg, color: m.color,
      border: `1px solid ${m.color}30`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.dot, display: "inline-block" }} />
      {m.label}
    </span>
  );
}

export default function ProfileSupportManager({ tickets, userId }: ProfileSupportManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTicket]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newBody.trim()) return toast.error("Subject and message are required");
    startTransition(async () => {
      const res = await createCustomerTicketAction(newSubject, newBody);
      if (res.success) {
        toast.success(res.message);
        setShowCreate(false); setNewSubject(""); setNewBody("");
        router.refresh();
      } else toast.error(res.message);
    });
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;
    startTransition(async () => {
      const res = await sendCustomerTicketMessageAction(activeTicket.id, replyText);
      if (res.success) {
        setReplyText("");
        toast.success(res.message);
        setActiveTicket(null);
        router.refresh();
      } else toast.error(res.message);
    });
  };

  const timeAgo = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        .sup-ticket-card { transition: all 0.18s ease; cursor: pointer; border: 1.5px solid #f0f0f0 !important; }
        .sup-ticket-card:hover { border-color: #ef4444 !important; box-shadow: 0 4px 20px rgba(239,68,68,0.08) !important; transform: translateY(-1px); }
        .sup-ticket-card.active { border-color: #ef4444 !important; background: #fff8f8 !important; }
        .sup-msg-bubble { animation: msgFadeIn 0.2s ease; }
        @keyframes msgFadeIn { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }
        .sup-send-btn { transition: all 0.15s; }
        .sup-send-btn:hover:not(:disabled) { transform: scale(1.04); }
        .sup-create-btn { background: linear-gradient(135deg,#ef4444,#dc2626); border: none; transition: all 0.15s; }
        .sup-create-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(239,68,68,0.3); }
        .sup-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); z-index: 9999; display:flex; align-items:center; justify-content:center; padding: 16px; }
        .sup-modal { background: #fff; border-radius: 20px; width: 100%; max-width: 520px; box-shadow: 0 24px 64px rgba(0,0,0,0.18); overflow: hidden; }
        .sup-input { border: 1.5px solid #e5e7eb !important; border-radius: 10px !important; padding: 10px 14px !important; font-size: 0.9rem !important; transition: border-color 0.15s !important; outline: none !important; background: #fafafa !important; }
        .sup-input:focus { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; background: #fff !important; }
        .sup-textarea { resize: vertical; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; } 
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 99px; }
      `}</style>

      {activeTicket ? (
        /* ── Thread View ── */
        <div style={{ display: "flex", flexDirection: "column", background: "#fff", borderRadius: 20, border: "1.5px solid #f0f0f0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "18px 24px", borderBottom: "1.5px solid #f4f4f4", display: "flex", alignItems: "center", gap: 12, background: "#fff" }}>
            <button
              onClick={() => setActiveTicket(null)}
              style={{ background: "#f4f4f4", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
            >
              <i className="bi bi-arrow-left" style={{ fontSize: "1rem" }} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeTicket.subject}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <StatusBadge status={activeTicket.status} />
                <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>#{activeTicket.id.slice(-8).toUpperCase()}</span>
                <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>• Opened {timeAgo(activeTicket.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="scrollbar-thin" style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", maxHeight: 360, minHeight: 200, background: "#fafafa" }}>
            {activeTicket.conversations[0]?.messages.length === 0 && (
              <div style={{ textAlign: "center", color: "#9ca3af", paddingTop: 40 }}>
                <i className="bi bi-chat-dots" style={{ fontSize: "2rem", display: "block", marginBottom: 8 }} />
                No messages yet.
              </div>
            )}
            {activeTicket.conversations[0]?.messages.map((m) => {
              const isMe = m.senderId !== "admin";
              return (
                <div key={m.id} className="sup-msg-bubble" style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                  {!isMe && (
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#ef4444,#dc2626)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0, marginRight: 8, marginTop: 2 }}>
                      SP
                    </div>
                  )}
                  <div style={{
                    maxWidth: "72%",
                    padding: "10px 14px",
                    borderRadius: isMe ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                    background: isMe ? "linear-gradient(135deg,#ef4444,#dc2626)" : "#fff",
                    color: isMe ? "#fff" : "#1f2937",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                    fontSize: "0.875rem",
                    lineHeight: 1.6,
                  }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, marginBottom: 4, opacity: 0.75 }}>
                      {isMe ? "You" : "Support"}
                      <span style={{ marginLeft: 8, fontWeight: 400 }}>{timeAgo(m.createdAt)}</span>
                    </div>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{m.body}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply box */}
          {activeTicket.status !== "CLOSED" && activeTicket.status !== "RESOLVED" ? (
            <form onSubmit={handleReply} style={{ padding: "16px 20px", borderTop: "1.5px solid #f0f0f0", display: "flex", gap: 10, alignItems: "flex-end", background: "#fff" }}>
              <textarea
                className="sup-input sup-textarea"
                style={{ flex: 1, minHeight: 60 }}
                placeholder="Type your message..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                disabled={isPending}
                rows={2}
              />
              <button
                type="submit"
                className="sup-send-btn"
                disabled={isPending || !replyText.trim()}
                style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: 12, width: 46, height: 46, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0, cursor: "pointer", opacity: replyText.trim() ? 1 : 0.5 }}
              >
                {isPending ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-send-fill" />}
              </button>
            </form>
          ) : (
            <div style={{ padding: "14px 20px", borderTop: "1.5px solid #f0f0f0", textAlign: "center", color: "#6b7280", fontSize: "0.82rem", background: "#fafafa" }}>
              <i className="bi bi-lock-fill me-1" /> This ticket is {activeTicket.status.toLowerCase()} and no longer accepts replies.
            </div>
          )}
        </div>
      ) : (
        /* ── Ticket List View ── */
        <div>
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
            <div>
              <h4 style={{ fontWeight: 800, margin: 0, color: "#111", fontSize: "1.2rem" }}>My Support Tickets</h4>
              <p style={{ margin: "2px 0 0", color: "#6b7280", fontSize: "0.82rem" }}>{tickets.length} total • {tickets.filter(t => t.status === "OPEN").length} open</p>
            </div>
            <button className="sup-create-btn" onClick={() => setShowCreate(true)} style={{ padding: "9px 20px", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 6 }}>
              <i className="bi bi-plus-lg" /> New Ticket
            </button>
          </div>

          {/* Ticket list */}
          {tickets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "#fafafa", borderRadius: 16, border: "1.5px dashed #e5e7eb" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <i className="bi bi-headset" style={{ fontSize: "1.8rem", color: "#ef4444" }} />
              </div>
              <h6 style={{ fontWeight: 700, color: "#374151", marginBottom: 6 }}>No support tickets yet</h6>
              <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0 0 20px" }}>Having an issue? We're here to help.</p>
              <button className="sup-create-btn" onClick={() => setShowCreate(true)} style={{ padding: "8px 20px", borderRadius: 10, color: "#fff", fontWeight: 600, fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <i className="bi bi-plus-lg" /> Open a Ticket
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tickets.map(t => {
                const allMsgs = t.conversations[0]?.messages ?? [];
                const lastMsg = allMsgs[allMsgs.length - 1]?.body ?? "No messages yet.";
                const unread = t.status === "IN_PROGRESS" || t.status === "OPEN";
                return (
                  <div key={t.id} className="sup-ticket-card" onClick={() => setActiveTicket(t)} style={{ padding: "16px 18px", borderRadius: 14, background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        {unread && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", flexShrink: 0, boxShadow: "0 0 0 2px #fecaca" }} />}
                        <h6 style={{ fontWeight: 700, margin: 0, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.9rem" }}>{t.subject}</h6>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <StatusBadge status={t.status} />
                      </div>
                    </div>
                    <p style={{ margin: 0, color: "#6b7280", fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderLeft: "3px solid #e5e7eb", paddingLeft: 10 }}>{lastMsg}</p>
                    <div style={{ marginTop: 8, fontSize: "0.72rem", color: "#9ca3af", display: "flex", gap: 12 }}>
                      <span><i className="bi bi-clock me-1" />{timeAgo(t.updatedAt)}</span>
                      <span><i className="bi bi-hash me-1" />{t.id.slice(-8).toUpperCase()}</span>
                      <span><i className="bi bi-chat-dots me-1" />{allMsgs.length} messages</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Create Ticket Modal ── */}
      {showCreate && (
        <div className="sup-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="sup-modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "22px 24px 16px", borderBottom: "1.5px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h5 style={{ fontWeight: 800, margin: 0, fontSize: "1.05rem" }}>Open a Support Ticket</h5>
                <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#6b7280" }}>Describe your issue and we'll respond within 24 hours.</p>
              </div>
              <button onClick={() => setShowCreate(false)} style={{ background: "#f4f4f4", border: "none", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="bi bi-x-lg" style={{ fontSize: "0.85rem" }} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontWeight: 600, fontSize: "0.82rem", color: "#374151", display: "block", marginBottom: 6 }}>Subject <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    className="sup-input"
                    style={{ width: "100%", boxSizing: "border-box" }}
                    type="text"
                    placeholder="e.g. Refund request for Order #1234"
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: "0.82rem", color: "#374151", display: "block", marginBottom: 6 }}>Detailed Message <span style={{ color: "#ef4444" }}>*</span></label>
                  <textarea
                    className="sup-input sup-textarea"
                    style={{ width: "100%", boxSizing: "border-box" }}
                    placeholder="Describe your issue in detail. Include any relevant order IDs, dates, or steps to reproduce the problem..."
                    rows={5}
                    value={newBody}
                    onChange={e => setNewBody(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div style={{ padding: "14px 24px 20px", borderTop: "1.5px solid #f0f0f0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "9px 20px", borderRadius: 10, background: "#f4f4f4", border: "none", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="sup-create-btn" style={{ padding: "9px 22px", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 6, opacity: isPending ? 0.7 : 1 }}>
                  {isPending ? <><span className="spinner-border spinner-border-sm" /> Submitting...</> : <><i className="bi bi-send" /> Submit Ticket</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
