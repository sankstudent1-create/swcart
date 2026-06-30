"use client";

import React, { useState } from "react";
import { executeMacroAction } from "../actions";
import { toast } from "sonner";

export default function UserTable({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [processing, setProcessing] = useState<string | null>(null);

  const handleWipe = async (id: string) => {
    if (!confirm("Are you sure you want to completely wipe this user and all associated data?")) return;
    setProcessing(id);
    const res = await executeMacroAction("WIPE_USER", id);
    if (res.success) {
      toast.success(res.message);
      setUsers(users.filter(u => u.id !== id));
    } else {
      toast.error(res.message);
    }
    setProcessing(null);
  };

  return (
    <div className="rounded-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(10px)" }}>
      {/* Toolbar */}
      <div className="p-3 border-bottom border-secondary border-opacity-25 d-flex justify-content-between align-items-center bg-black bg-opacity-25">
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-dark border border-secondary border-opacity-50 text-white rounded-pill px-3 fw-bold" style={{ fontSize: "0.75rem" }}>All Users</button>
          <button className="btn btn-sm btn-outline-secondary text-muted rounded-pill px-3 fw-bold" style={{ fontSize: "0.75rem" }}>Sellers Only</button>
          <button className="btn btn-sm btn-outline-secondary text-muted rounded-pill px-3 fw-bold" style={{ fontSize: "0.75rem" }}>Delivery Agents</button>
        </div>
        <div className="input-group" style={{ width: "250px" }}>
          <span className="input-group-text bg-dark border-secondary border-opacity-50 text-muted"><i className="bi bi-search"></i></span>
          <input type="text" className="form-control bg-dark border-secondary border-opacity-50 text-white form-control-sm" placeholder="Search identities..." />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-dark table-hover mb-0" style={{ background: "transparent" }}>
          <thead>
            <tr>
              <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-black bg-opacity-10 py-3 ps-4" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>User Identity</th>
              <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-black bg-opacity-10 py-3" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Platform Roles</th>
              <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-black bg-opacity-10 py-3" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Onboarded</th>
              <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-black bg-opacity-10 py-3 pe-4 text-end" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Security Controls</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ transition: "background 0.2s" }} className="hover-bg-dark">
                <td className="border-bottom border-secondary border-opacity-10 align-middle ps-4">
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-circle bg-gradient-primary d-flex align-items-center justify-content-center text-white fw-bold shadow-sm" style={{ width: 42, height: 42, background: "linear-gradient(135deg, var(--bs-primary), #6610f2)" }}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="fw-bold text-white fs-6 mb-1">{u.name}</div>
                      <div className="text-muted font-monospace" style={{ fontSize: "0.7rem" }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="border-bottom border-secondary border-opacity-10 align-middle">
                  <div className="d-flex gap-2 flex-wrap">
                    {u.roles.map((r: any) => (
                      <span key={r.role.id} className="badge bg-dark text-light border border-secondary border-opacity-50 px-2 py-1">
                        {r.role.name}
                      </span>
                    ))}
                    {u.sellerProfile && (
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                        <i className="bi bi-shop me-1"></i> SELLER
                      </span>
                    )}
                    {u.deliveryProfile && (
                      <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2 py-1">
                        <i className="bi bi-truck me-1"></i> DELIVERY
                      </span>
                    )}
                    {u.roles.length === 0 && !u.sellerProfile && !u.deliveryProfile && (
                      <span className="text-muted small fst-italic">Customer</span>
                    )}
                  </div>
                </td>
                <td className="border-bottom border-secondary border-opacity-10 align-middle text-muted small fw-semibold">
                  {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="border-bottom border-secondary border-opacity-10 align-middle pe-4 text-end">
                  <div className="d-flex gap-2 justify-content-end">
                    <button 
                      className="btn btn-sm btn-dark border border-secondary border-opacity-50 text-info rounded-pill fw-bold" 
                      style={{ fontSize: "0.7rem" }}
                      onClick={() => toast.info("Impersonation initiated. Opening new session...")}
                    >
                      <i className="bi bi-incognito me-1"></i> Impersonate
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-danger rounded-pill fw-bold" 
                      style={{ fontSize: "0.7rem" }}
                      onClick={() => handleWipe(u.id)}
                      disabled={processing === u.id}
                    >
                      {processing === u.id ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-person-x-fill me-1"></i> Wipe</>}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-5 text-muted">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
