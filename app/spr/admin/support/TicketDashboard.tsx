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
  sender: {
    name: string;
    email: string;
    avatar: string | null;
  };
}

interface Ticket {
  id: string;
  userId: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    email: string;
  };
  conversations: Array<{
    messages: Array<{
      body: string;
      createdAt: string;
    }>;
  }>;
}

interface ActiveTicket extends Ticket {
  conversations: Array<{
    messages: Message[];
  }>;
}

interface TicketDashboardProps {
  tickets: Ticket[];
  activeTicket: ActiveTicket | null;
}

export default function TicketDashboard({ tickets, activeTicket }: TicketDashboardProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [replyText, setReplyText] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTicket]);

  const filteredTickets = tickets.filter(t => {
    const matchesFilter = filter === "ALL" || t.status === filter;
    const matchesSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || 
                          t.user.name.toLowerCase().includes(search.toLowerCase()) ||
                          t.user.email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSelectTicket = (id: string) => {
    router.push(`/spr/admin/support?id=${id}`);
  };

  const handleBackToList = () => {
    router.push("/spr/admin/support");
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;

    startTransition(async () => {
      const res = await addTicketMessageAction(activeTicket.id, replyText);
      if (res.success) {
        setReplyText("");
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleStatusChange = (status: string) => {
    if (!activeTicket) return;
    startTransition(async () => {
      const res = await updateTicketStatusAction(activeTicket.id, status);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-30";
      case "IN_PROGRESS": return "bg-warning bg-opacity-10 text-warning border border-warning border-opacity-30";
      case "RESOLVED": return "bg-success bg-opacity-10 text-success border border-success border-opacity-30";
      default: return "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-30";
    }
  };

  return (
    <div className="row g-4 h-100" style={{ minHeight: "75vh" }}>
      {/* List Column */}
      <div className={`col-lg-5 ${activeTicket ? "d-none d-lg-block" : "col-12"}`}>
        <div className="bg-white rounded-4 shadow-sm border border-light p-4 h-100 d-flex flex-column">
          <div className="mb-4">
            <h4 className="fw-bold text-dark mb-3"><i className="bi bi-headset me-2 text-danger"></i> Support Helpdesk</h4>
            <div className="position-relative mb-3">
              <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
              <input 
                type="text" 
                className="form-control rounded-pill ps-5 border-light bg-light bg-opacity-50"
                placeholder="Search tickets, names, email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            {/* Filter Pills */}
            <div className="d-flex gap-2 flex-wrap">
              {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map(status => (
                <button
                  key={status}
                  className={`btn btn-sm rounded-pill px-3 fw-bold ${filter === status ? "btn-dark text-white" : "btn-light border text-muted"}`}
                  onClick={() => setFilter(status)}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable list */}
          <div className="flex-grow-1 overflow-y-auto pe-1" style={{ maxHeight: "55vh" }}>
            <div className="d-flex flex-column gap-3">
              {filteredTickets.map(t => {
                const isActive = activeTicket?.id === t.id;
                const lastMsg = t.conversations[0]?.messages[0]?.body || "No messages yet.";
                return (
                  <div 
                    key={t.id} 
                    className={`p-3 rounded-4 border transition-all cursor-pointer ${isActive ? "border-danger bg-danger bg-opacity-5 shadow-sm" : "border-light hover-bg-light"}`}
                    onClick={() => handleSelectTicket(t.id)}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className={`badge rounded-pill px-2 py-1 fw-bold ${getStatusBadgeClass(t.status)}`} style={{ fontSize: "0.68rem" }}>
                        {t.status}
                      </span>
                      <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                        {new Date(t.updatedAt).toLocaleDateString()}
                      </small>
                    </div>
                    <h6 className="fw-bold text-dark mb-1 text-truncate">{t.subject}</h6>
                    <div className="text-muted small mb-2 d-flex align-items-center gap-1">
                      <i className="bi bi-person-circle"></i> {t.user.name}
                    </div>
                    <p className="text-muted small mb-0 text-truncate font-monospace bg-light bg-opacity-70 p-2 rounded-3 border-start border-3 border-secondary">
                      {lastMsg}
                    </p>
                  </div>
                );
              })}

              {filteredTickets.length === 0 && (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-chat-square-text fs-2 opacity-50 mb-2 d-block"></i>
                  <span className="fw-semibold">No tickets match your filters.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Detail Column */}
      <div className={`col-lg-7 ${!activeTicket ? "d-none d-lg-block" : "col-12"}`}>
        {activeTicket ? (
          <div className="bg-white rounded-4 shadow-sm border border-light p-4 h-100 d-flex flex-column">
            {/* Thread Header */}
            <div className="border-bottom border-light pb-3 mb-3">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <button className="btn btn-sm btn-light rounded-circle p-2 d-lg-none" onClick={handleBackToList}>
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  <div>
                    <h5 className="fw-bold text-dark mb-1">{activeTicket.subject}</h5>
                    <div className="text-muted small">
                      Ticket ID: <span className="font-monospace text-dark fw-bold">#{activeTicket.id.slice(-8).toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className="small text-muted fw-semibold">Status:</span>
                  <select
                    className="form-select form-select-sm rounded-pill px-3 fw-bold border-light bg-light"
                    value={activeTicket.status}
                    onChange={e => handleStatusChange(e.target.value)}
                    disabled={isPending}
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-3 bg-light p-3 rounded-4 border-light d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <span className="text-muted small">Created by: </span>
                  <strong className="text-dark small">{activeTicket.user.name}</strong> 
                  <span className="text-muted small"> ({activeTicket.user.email})</span>
                </div>
                <div className="text-muted small">
                  Opened: <strong>{new Date(activeTicket.createdAt).toLocaleDateString()}</strong>
                </div>
              </div>
            </div>

            {/* Messages Thread list */}
            <div className="flex-grow-1 overflow-y-auto px-2 mb-4 d-flex flex-column gap-3" style={{ maxHeight: "40vh", minHeight: "30vh" }}>
              {activeTicket.conversations[0]?.messages.map((m) => {
                const isAdminMessage = m.senderId !== activeTicket.userId;
                return (
                  <div 
                    key={m.id} 
                    className={`d-flex ${isAdminMessage ? "justify-content-end" : "justify-content-start"}`}
                  >
                    <div 
                      className={`p-3 rounded-4 shadow-sm max-w-75 border ${
                        isAdminMessage 
                          ? "bg-danger bg-opacity-10 text-dark border-danger border-opacity-25 rounded-tr-none" 
                          : "bg-light text-dark border-light rounded-tl-none"
                      }`}
                      style={{ maxWidth: "75%" }}
                    >
                      <div className="d-flex justify-content-between gap-3 mb-1">
                        <span className="fw-bold small text-dark">
                          {isAdminMessage ? "Superadmin Support" : m.sender.name}
                        </span>
                        <small className="text-muted" style={{ fontSize: "0.68rem" }}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </small>
                      </div>
                      <p className="small mb-0 text-break" style={{ whiteSpace: "pre-wrap" }}>{m.body}</p>
                    </div>
                  </div>
                );
              })}
              {(!activeTicket.conversations[0] || activeTicket.conversations[0].messages.length === 0) && (
                <div className="text-center py-5 text-muted">No messages in this ticket.</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input Box */}
            <form onSubmit={handleSendReply} className="border-top border-light pt-3">
              <div className="input-group">
                <textarea 
                  className="form-control rounded-start-4 border-light bg-light bg-opacity-50 p-3"
                  placeholder="Type support reply or solution details..."
                  rows={2}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  required
                  disabled={isPending}
                />
                <button 
                  type="submit" 
                  className="btn btn-danger text-white rounded-end-4 px-4 fw-bold shadow-sm d-flex align-items-center justify-content-center"
                  disabled={isPending || !replyText.trim()}
                >
                  {isPending ? (
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                  ) : (
                    <>
                      <i className="bi bi-send-fill fs-5"></i>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-4 shadow-sm border border-light p-5 h-100 d-flex flex-column align-items-center justify-content-center text-center">
            <div className="bg-light p-4 rounded-circle mb-3">
              <i className="bi bi-headset fs-1 text-danger"></i>
            </div>
            <h5 className="fw-bold text-dark">No Ticket Selected</h5>
            <p className="text-muted small max-w-350">Select a support ticket from the list to view the customer chat history and resolve queries.</p>
          </div>
        )}
      </div>

      <style>{`
        .hover-bg-light:hover { background-color: rgba(0,0,0,0.02) !important; }
        .cursor-pointer { cursor: pointer; }
        .max-w-75 { max-width: 75%; }
        .max-w-350 { max-width: 350px; }
        .rounded-tr-none { border-top-right-radius: 0 !important; }
        .rounded-tl-none { border-top-left-radius: 0 !important; }
      `}</style>
    </div>
  );
}
