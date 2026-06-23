"use client";

import React, { useState, useTransition } from "react";
import { assignRoleAction, removeRoleAction } from "@/app/actions/admin-modules";
import { toast } from "sonner";

export default function RoleManager({ users, allRoles }: { users: any[], allRoles: string[] }) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("SUPER_ADMIN");

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) { toast.error("Select a user"); return; }
    startTransition(async () => {
      const res = await assignRoleAction(selectedUser, selectedRole);
      if (res.success) { toast.success(res.message); setShowModal(false); }
      else toast.error(res.message);
    });
  };

  const handleRemove = (userId: string, roleId: string) => {
    if (!confirm("Remove this role?")) return;
    startTransition(async () => {
      const res = await removeRoleAction(userId, roleId);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0 text-dark">Access Roles</h2>
        <button className="btn btn-dark rounded-pill px-4 shadow-sm" onClick={() => setShowModal(true)}>
          <i className="bi bi-shield-lock me-2"></i> Assign Role
        </button>
      </div>

      <div className="bg-white p-4 rounded-4 shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted small text-uppercase">
              <tr>
                <th className="py-3">User</th>
                <th className="py-3">Email</th>
                <th className="py-3">Assigned Roles</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="py-3 fw-bold text-dark">{u.name}</td>
                  <td className="py-3 text-muted small">{u.email}</td>
                  <td className="py-3">
                    <div className="d-flex gap-2 flex-wrap">
                      {u.roles.map((ur: any) => (
                        <span key={ur.roleId} className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-2 d-flex align-items-center gap-2">
                          {ur.role.name}
                          <i className="bi bi-x-circle-fill text-danger ms-1" style={{ cursor: "pointer" }} onClick={() => handleRemove(u.id, ur.roleId)}></i>
                        </span>
                      ))}
                      {u.roles.length === 0 && <span className="text-muted small">None</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={3} className="text-center py-5 text-muted">No users found with roles</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom-0 p-4 pb-0">
                <h5 className="modal-title fw-bold">Assign User Role</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleAssign}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Select User</label>
                    <select className="form-select" value={selectedUser} onChange={e => setSelectedUser(e.target.value)} required>
                      <option value="">-- Choose User --</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Select Role</label>
                    <select className="form-select" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                      {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top-0 p-4 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-dark rounded-pill px-4" disabled={isPending}>{isPending ? "Assigning..." : "Assign Role"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
