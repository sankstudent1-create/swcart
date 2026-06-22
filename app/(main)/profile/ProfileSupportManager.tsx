"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCustomerTicketAction, sendCustomerTicketMessageAction } from "@/app/actions/tickets";
import { toast } from "sonner";

interface Message {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  sender: {
    name: string;
  };
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  conversations: Array<{
    messages: Message[];
  }>;
}

interface ProfileSupportManagerProps {
  tickets: Ticket[];
}

export default function ProfileSupportManager({ tickets }: ProfileSupportManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Navigation / Modal States
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form States
  const [newSubject, setNewSubject] = useState("");
  const [newMessageBody, setNewMessageBody] = useState("");
  const [replyText, setReplyText] = useState("");

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessageBody.trim()) {
      toast.error("Subject and Message body are required");
      return;
    }

    startTransition(async () => {
      const res = await createCustomerTicketAction(newSubject, newMessageBody);
      if (res.success) {
        toast.success(res.message);
        setShowCreateModal(false);
        setNewSubject("");
        setNewMessageBody("");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;

    startTransition(async () => {
      const res = await sendCustomerTicketMessageAction(activeTicket.id, replyText);
      if (res.success) {
        setReplyText("");
        toast.success(res.message);
        // Refresh ticket details locally if possible
        setActiveTicket(null); // Simple reload: close detail view, trigger layout refresh
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-danger";
      case "IN_PROGRESS": return "bg-warning";
      case "RESOLVED": return "bg-success";
      default: return "bg-secondary";
    }
  };

  return (
    <div>
      {activeTicket ? (
        // Ticket Thread details view
        <div>
          <div className="d-flex align-items-center gap-2 mb-4">
            <button className="btn btn-sm btn-light rounded-circle p-2 border" onClick={() => setActiveTicket(null)}>
              <i className="bi bi-arrow-left"></i>
            </button>
            <div>
              <h4 className="fw-bold mb-0 text-dark">{activeTicket.subject}</h4>
              <span className={`badge rounded-pill mt-1 ${getStatusBadgeClass(activeTicket.status)}`}>
                {activeTicket.status}
              </span>
            </div>
          </div>

          {/* Conversation Feed */}
          <div className="d-flex flex-column gap-3 mb-4 p-3 bg-light bg-opacity-50 rounded-4 border border-light" style={{ maxHeight: "350px", overflowY: "auto" }}>
            {activeTicket.conversations[0]?.messages.map((m) => {
              const isMe = m.senderId !== "admin"; // Check logic if admin sender id matches
              return (
                <div key={m.id} className={`d-flex ${isMe ? "justify-content-end" : "justify-content-start"}`}>
                  <div className={`p-3 rounded-4 shadow-sm max-w-75 ${isMe ? "bg-danger text-white rounded-tr-none" : "bg-white text-dark rounded-tl-none border"}`} style={{ maxWidth: "75%" }}>
                    <div className="d-flex justify-content-between gap-3 mb-1" style={{ fontSize: "0.75rem" }}>
                      <span className="fw-bold">{isMe ? "You" : "Support Representative"}</span>
                      <small className="opacity-75">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                    <p className="small mb-0" style={{ whiteSpace: "pre-wrap" }}>{m.body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSendReply}>
            <div className="input-group shadow-sm rounded-4 overflow-hidden border">
              <textarea 
                className="form-control border-0 p-3 bg-white"
                placeholder="Type reply to customer service..."
                rows={2}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                required
                disabled={isPending}
              />
              <button 
                type="submit" 
                className="btn btn-danger text-white px-4 fw-bold d-flex align-items-center justify-content-center"
                disabled={isPending || !replyText.trim()}
              >
                {isPending ? <span className="spinner-border spinner-border-sm" role="status" /> : <i className="bi bi-send-fill"></i>}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Ticket listings
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <h3 className="fw-bold mb-0">Helpdesk Tickets</h3>
            <button 
              className="btn btn-danger btn-sm rounded-pill px-4 py-2 fw-bold hover-scale transition-all shadow-sm"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="bi bi-plus-lg me-1"></i> Open Ticket
            </button>
          </div>

          <div className="d-flex flex-column gap-3">
            {tickets.map((t) => {
              const lastMsg = t.conversations[0]?.messages[t.conversations[0].messages.length - 1]?.body || "No message.";
              return (
                <div 
                  key={t.id} 
                  className="p-4 border rounded-4 bg-light bg-opacity-25 hover-bg-light transition-all cursor-pointer shadow-sm"
                  onClick={() => setActiveTicket(t)}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className={`badge rounded-pill px-3 py-1 fw-bold ${getStatusBadgeClass(t.status)} bg-opacity-10 text-${getStatusBadgeClass(t.status).substring(3)}`}>
                      {t.status}
                    </span>
                    <small className="text-muted">{new Date(t.updatedAt).toLocaleDateString()}</small>
                  </div>
                  <h6 className="fw-bold text-dark mb-1">{t.subject}</h6>
                  <p className="text-muted small mb-0 text-truncate font-monospace border-start border-3 ps-2 mt-2">{lastMsg}</p>
                </div>
              );
            })}

            {tickets.length === 0 && (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-chat-square-dots fs-1 mb-2 d-block"></i>
                <h5 className="fw-bold">No active support tickets</h5>
                <p className="small mb-0">If you experience problems with your purchases, open a support ticket above.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom border-light px-4 py-3">
                <h5 className="modal-title fw-bold text-dark">Open Support Ticket</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateTicket}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label text-dark small fw-bold mb-1">Ticket Subject</label>
                    <input 
                      type="text" 
                      className="form-control rounded-3 border-light shadow-sm"
                      placeholder="e.g. Refund request for Order #1234"
                      value={newSubject}
                      onChange={e => setNewSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-dark small fw-bold mb-1">Detailed Message</label>
                    <textarea 
                      className="form-control rounded-3 border-light shadow-sm"
                      placeholder="Describe your issue or request in detail..."
                      rows={4}
                      value={newMessageBody}
                      onChange={e => setNewMessageBody(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer border-top border-light px-4 py-3 d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-light rounded-pill px-4 border" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-danger text-white rounded-pill px-4 fw-bold shadow-sm" disabled={isPending}>
                    {isPending ? "Submitting..." : "Submit Ticket"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hover-bg-light:hover { background-color: rgba(0,0,0,0.02) !important; }
        .cursor-pointer { cursor: pointer; }
      `}</style>
    </div>
  );
}
