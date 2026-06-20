"use client";
import { useState } from "react";
import { createRoleAction } from "@/app/actions/crm";
import { toast } from "sonner";

export default function CreateRoleForm() {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="position-relative">
      <button onClick={() => setOpen(!open)} className="btn text-white rounded-pill px-4 shadow-sm fw-bold hover-scale transition-all" style={{ backgroundColor: "var(--red)" }}>
        <i className="bi bi-shield-plus me-2"></i> {open ? 'Cancel' : 'Create Role'}
      </button>
      {open && (
        <form action={async (fd) => {
          const res = await createRoleAction(fd);
          if (res.success) { toast.success("Role created"); setOpen(false); }
          else toast.error(res.message);
        }} className="mt-2 bg-white p-3 rounded-4 shadow border position-absolute end-0 z-3" style={{ width: "300px" }}>
          <h6 className="fw-bold mb-3 text-dark">New Role</h6>
          <input name="name" className="form-control mb-2 rounded-pill bg-light border-0" placeholder="Role Name (e.g. EDITOR)" required />
          <input name="description" className="form-control mb-3 rounded-pill bg-light border-0" placeholder="Description" />
          <button type="submit" className="btn btn-dark w-100 rounded-pill fw-bold">Save Role</button>
        </form>
      )}
    </div>
  );
}
