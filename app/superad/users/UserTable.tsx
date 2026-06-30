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
    <div className="table-responsive">
      <table className="table table-dark table-hover mb-0" style={{ background: "transparent" }}>
        <thead>
          <tr>
            <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-black bg-opacity-25 py-3 ps-4" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>User</th>
            <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-black bg-opacity-25 py-3" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Identities</th>
            <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-black bg-opacity-25 py-3" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Joined</th>
            <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-black bg-opacity-25 py-3 pe-4 text-end" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Macros</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td className="border-bottom border-secondary border-opacity-10 align-middle ps-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle bg-secondary bg-opacity-25 d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 40, height: 40 }}>
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div className="fw-bold text-white fs-6">{u.name}</div>
                    <div className="text-muted small" style={{ fontSize: "0.75rem" }}>{u.email}</div>
                  </div>
                </div>
              </td>
              <td className="border-bottom border-secondary border-opacity-10 align-middle">
                <div className="d-flex gap-2 flex-wrap">
                  {u.roles.map((r: any) => (
                    <span key={r.role.id} className="badge bg-secondary bg-opacity-25 text-light border border-secondary border-opacity-25">
                      {r.role.name}
                    </span>
                  ))}
                  {u.sellerProfile && (
                    <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25">
                      <i className="bi bi-shop me-1"></i> SELLER
                    </span>
                  )}
                  {u.deliveryProfile && (
                    <span className="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-25">
                      <i className="bi bi-truck me-1"></i> DELIVERY
                    </span>
                  )}
                </div>
              </td>
              <td className="border-bottom border-secondary border-opacity-10 align-middle text-muted small">
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
              <td className="border-bottom border-secondary border-opacity-10 align-middle pe-4 text-end">
                <button 
                  className="btn btn-sm btn-outline-danger rounded-pill fw-bold" 
                  style={{ fontSize: "0.7rem" }}
                  onClick={() => handleWipe(u.id)}
                  disabled={processing === u.id}
                >
                  {processing === u.id ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-person-x-fill me-1"></i> Wipe</>}
                </button>
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
  );
}
