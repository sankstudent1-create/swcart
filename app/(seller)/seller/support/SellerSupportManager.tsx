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

const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  OPEN:        { label: "Open",        color: "#ef4444", bg: "#fef2f2", dot: "#ef4444" },
  IN_PROGRESS: { label: "In Progress", color: "#f59e0b", bg: "#fffbeb", dot: "#f59e0b" },
  RESOLVED:    { label: "Resolved",    color: "#10b981", bg: "#ecfdf5", dot: "#10b981" },
  CLOSED:      { label: "Closed",      color: "#6b7280", bg: "#f3f4f6", dot: "#6b7280" },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.CLOSED;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.04em", background: m.bg, color: m.color, border: `1px solid ${m.color}30` }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.dot, display: "inline-block" }} />
      {m.label}
    </span>
  );
}

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function SellerSupportManager({ tickets, userId, sellerName }: { tickets: Ticket[]; userId: string; sellerName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeTicket]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newBody.trim()) return toast.error("Subject and message required.");
    startTransition(async () => {
      const res = await createCustomerTicketAction(newSubject, newBody);
      if (res.success) { toast.success(res.message); setShowCreate(false); setNewSubject(""); setNewBody(""); router.refresh(); }
      else toast.error(res.message);
    });
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;
    startTransition(async () => {
      const res = await sendCustomerTicketMessageAction(activeTicket.id, replyText);
      if (res.success) { setReplyText(""); toast.success(res.message); setActiveTicket(null); router.refresh(); }
      else toast.error(res.message);
    });
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        .sel-tkt-card { transition: all 0.18s ease; cursor: pointer; }
        .sel-tkt-card:hover { border-color: #ef4444 !important; box-shadow: 0 4px 20px rgba(239,68,68,0.1) !important; transform: translateY(-1px); }
        .sel-create-btn { background: linear-gradient(135deg,#ef4444,#dc2626); border: none; transition: all 0.15s; }
        .sel-create-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(239,68,68,0.3); }
        .sel-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); z-index: 9999; display:flex; align-items:center; justify-content:center; padding: 16px; }
        .sel-modal { background: #1a1a1a; border-radius: 20px; width: 100%; max-width: 520px; box-shadow: 0 24px 64px rgba(0,0,0,0.5); overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
        .sel-input { border: 1.5px solid rgba(255,255,255,0.15) !important; border-radius: 10px !important; padding: 10px 14px !important; font-size: 0.9rem !important; transition: border-color 0.15s !important; outline: none !important; background: rgba(255,255,255,0.05) !important; color: #fff !important; }
        .sel-input:focus { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.15) !important; }
        .sel-input::placeholder { color: rgba(255,255,255,0.35) !important; }
        .sel-msg-bubble { animation: selMsgIn 0.2s ease; }
        @keyframes selMsgIn { from { opacity:0; transform: translateY(5px); } to { opacity:1; transform:translateY(0); } }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 99px; }
      `}</style>

      {activeTicket ? (
        /* Thread View */
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.02)" }}>
            <button onClick={() => setActiveTicket(null)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", flexShrink: 0 }}>
              <i className="bi bi-arrow-left" />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeTicket.subject}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <StatusBadge status={activeTicket.status} />
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>#{activeTicket.id.slice(-8).toUpperCase()}</span>
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>• {timeAgo(activeTicket.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="scrollbar-thin" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", maxHeight: 380, minHeight: 200, background: "rgba(0,0,0,0.15)" }}>
            {activeTicket.conversations[0]?.messages.length === 0 && (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", paddingTop: 40 }}>
                <i className="bi bi-chat-dots" style={{ fontSize: "2rem", display: "block", marginBottom: 8 }} />
                No messages yet. We'll get back to you shortly.
              </div>
            )}
            {activeTicket.conversations[0]?.messages.map(m => {
              const isMe = m.senderId !== "admin";
              return (
                <div key={m.id} className="sel-msg-bubble" style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "72%", padding: "10px 14px",
                    borderRadius: isMe ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                    background: isMe ? "linear-gradient(135deg,#ef4444,#dc2626)" : "rgba(255,255,255,0.08)",
                    color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    fontSize: "0.875rem", lineHeight: 1.6,
                    border: isMe ? "none" : "1px solid rgba(255,255,255,0.1)"
                  }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, marginBottom: 4, opacity: 0.65 }}>
                      {isMe ? sellerName : "Support Team"} · {timeAgo(m.createdAt)}
                    </div>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{m.body}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply */}
          {["CLOSED", "RESOLVED"].includes(activeTicket.status) ? (
            <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.82rem" }}>
              <i className="bi bi-lock-fill me-1" /> Ticket {activeTicket.status.toLowerCase()} — no further replies accepted.
            </div>
          ) : (
            <form onSubmit={handleReply} style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea className="sel-input" style={{ flex: 1, minHeight: 60, resize: "none" }} placeholder="Type your reply..." rows={2} value={replyText} onChange={e => setReplyText(e.target.value)} disabled={isPending} />
              <button type="submit" disabled={isPending || !replyText.trim()} style={{ background: replyText.trim() ? "linear-gradient(135deg,#ef4444,#dc2626)" : "rgba(255,255,255,0.1)", border: "none", borderRadius: 12, width: 46, height: 46, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: replyText.trim() ? "pointer" : "not-allowed", flexShrink: 0 }}>
                {isPending ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-send-fill" />}
              </button>
            </form>
          )}
        </div>
      ) : (
        /* List View */
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
            <div>
              <h4 style={{ fontWeight: 800, margin: 0, fontSize: "1.2rem", color: "#fff" }}>Seller Support Tickets</h4>
              <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
                {tickets.length} total · {tickets.filter(t => t.status === "OPEN").length} open
              </p>
            </div>
            <button className="sel-create-btn" onClick={() => setShowCreate(true)} style={{ padding: "9px 18px", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}>
              <i className="bi bi-plus-lg" /> Raise Ticket
            </button>
          </div>

          {tickets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1.5px dashed rgba(255,255,255,0.1)" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <i className="bi bi-headset" style={{ fontSize: "1.8rem", color: "#ef4444" }} />
              </div>
              <h6 style={{ fontWeight: 700, color: "#fff", marginBottom: 6 }}>No support tickets yet</h6>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", margin: "0 0 20px" }}>Seller issues, payout questions? Raise a ticket below.</p>
              <button className="sel-create-btn" onClick={() => setShowCreate(true)} style={{ padding: "8px 20px", borderRadius: 10, color: "#fff", fontWeight: 600, fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <i className="bi bi-plus-lg" /> Raise Ticket
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tickets.map(t => {
                const allMsgs = t.conversations[0]?.messages ?? [];
                const lastMsg = allMsgs[allMsgs.length - 1]?.body ?? "No messages yet.";
                return (
                  <div key={t.id} className="sel-tkt-card" onClick={() => setActiveTicket(t)} style={{ padding: "16px 18px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                      <h6 style={{ fontWeight: 700, margin: 0, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.9rem" }}>{t.subject}</h6>
                      <StatusBadge status={t.status} />
                    </div>
                    <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderLeft: "3px solid rgba(255,255,255,0.1)", paddingLeft: 10, fontStyle: "italic" }}>{lastMsg}</p>
                    <div style={{ marginTop: 8, fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", display: "flex", gap: 14 }}>
                      <span><i className="bi bi-clock me-1" />{timeAgo(t.updatedAt)}</span>
                      <span><i className="bi bi-chat-dots me-1" />{allMsgs.length} msgs</span>
                      <span><i className="bi bi-hash" />{t.id.slice(-8).toUpperCase()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="sel-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="sel-modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h5 style={{ fontWeight: 800, margin: 0, fontSize: "1.05rem", color: "#fff" }}>Raise a Seller Support Ticket</h5>
                <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>Payout issues, policy questions, or technical issues — we're here.</p>
              </div>
              <button onClick={() => setShowCreate(false)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                <i className="bi bi-x-lg" style={{ fontSize: "0.85rem" }} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontWeight: 600, fontSize: "0.82rem", color: "rgba(255,255,255,0.7)", display: "block", marginBottom: 6 }}>Subject <span style={{ color: "#ef4444" }}>*</span></label>
                  <input className="sel-input" style={{ width: "100%", boxSizing: "border-box" }} type="text" placeholder="e.g. Payout not received for Order #..." value={newSubject} onChange={e => setNewSubject(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: "0.82rem", color: "rgba(255,255,255,0.7)", display: "block", marginBottom: 6 }}>Detailed Description <span style={{ color: "#ef4444" }}>*</span></label>
                  <textarea className="sel-input" style={{ width: "100%", boxSizing: "border-box", resize: "vertical" }} placeholder="Describe your issue. Include order IDs, dates, or any error messages..." rows={5} value={newBody} onChange={e => setNewBody(e.target.value)} required />
                </div>
              </div>
              <div style={{ padding: "14px 24px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "9px 20px", borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", color: "#fff" }}>
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="sel-create-btn" style={{ padding: "9px 22px", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 6, opacity: isPending ? 0.7 : 1 }}>
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
