"use client";
import { useState } from "react";
import { updateUserIdentityAction } from "@/app/actions/crm";
import { toast } from "sonner";

export default function EditUserModal({ user, allRoles }: { user: any, allRoles: any[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-outline-dark rounded-pill px-4 fw-semibold shadow-sm hover-scale transition-all">
        Edit Identity
      </button>

      {open && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1} style={{ zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-bold">Edit User Identity</h5>
                <button type="button" className="btn-close" onClick={() => setOpen(false)}></button>
              </div>
              <div className="modal-body p-4">
                <form action={async (fd) => {
                  const res = await updateUserIdentityAction(fd);
                  if (res.success) { toast.success("Identity updated"); setOpen(false); }
                  else toast.error(res.message);
                }}>
                  <input type="hidden" name="id" value={user.id} />
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold text-uppercase">Full Name</label>
                    <input name="name" className="form-control form-control-lg bg-light border-0 rounded-pill fs-6 fw-semibold" defaultValue={user.name} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold text-uppercase">Phone</label>
                    <input name="phone" className="form-control form-control-lg bg-light border-0 rounded-pill fs-6 fw-semibold" defaultValue={user.phone || ""} />
                  </div>
                  <div className="mb-4">
                    <label className="form-label text-muted small fw-bold text-uppercase">Toggle Role (Assign/Revoke)</label>
                    <select name="roleName" className="form-select form-select-lg bg-light border-0 rounded-pill fs-6 fw-semibold">
                      <option value="">No change</option>
                      {allRoles.map(r => (
                        <option key={r.id} value={r.name}>{r.name} (Current: {user.roles.some((ur:any) => ur.role.name === r.name) ? 'Assigned' : 'Not Assigned'})</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn text-white w-100 rounded-pill py-2 fw-bold shadow-sm" style={{ backgroundColor: "var(--red)" }}>Save Changes</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
