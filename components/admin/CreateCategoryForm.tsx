"use client";
import { useState } from "react";
import { createCategoryAction } from "@/app/actions/crm";
import { toast } from "sonner";

export default function CreateCategoryForm() {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="position-relative">
      <button onClick={() => setOpen(!open)} className="btn text-white rounded-pill px-4 shadow-sm fw-bold hover-scale transition-all" style={{ backgroundColor: "var(--red)" }}>
        <i className="bi bi-plus-lg me-2"></i> {open ? 'Cancel' : 'New Category'}
      </button>
      {open && (
        <form action={async (fd) => {
          const res = await createCategoryAction(fd);
          if (res.success) { toast.success("Category created"); setOpen(false); }
          else toast.error(res.message);
        }} className="mt-2 bg-white p-3 rounded-4 shadow border position-absolute end-0 z-3" style={{ width: "300px" }}>
          <h6 className="fw-bold mb-3 text-dark">New Category</h6>
          <input name="name" className="form-control mb-2 rounded-pill bg-light border-0" placeholder="Category Name" required />
          <input name="image" className="form-control mb-3 rounded-pill bg-light border-0" placeholder="Image URL (Optional)" />
          <button type="submit" className="btn btn-dark w-100 rounded-pill fw-bold">Save Category</button>
        </form>
      )}
    </div>
  );
}
