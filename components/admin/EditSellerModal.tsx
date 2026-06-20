"use client";
import { useState } from "react";
import { updateSellerIdentityAction } from "@/app/actions/crm";
import { toast } from "sonner";

export default function EditSellerModal({ seller }: { seller: any }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-outline-dark rounded-pill px-4 fw-semibold shadow-sm hover-scale transition-all">
        Edit Business Identity
      </button>

      {open && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1} style={{ zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-bold">Edit Seller Identity</h5>
                <button type="button" className="btn-close" onClick={() => setOpen(false)}></button>
              </div>
              <div className="modal-body p-4">
                <form action={async (fd) => {
                  const res = await updateSellerIdentityAction(fd);
                  if (res.success) { toast.success("Identity updated"); setOpen(false); }
                  else toast.error(res.message);
                }}>
                  <input type="hidden" name="id" value={seller.id} />
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold text-uppercase">Company Name</label>
                    <input name="companyName" className="form-control form-control-lg bg-light border-0 rounded-pill fs-6 fw-semibold" defaultValue={seller.companyName} required />
                  </div>
                  <div className="mb-4">
                    <label className="form-label text-muted small fw-bold text-uppercase">GST Number</label>
                    <input name="gstNumber" className="form-control form-control-lg bg-light border-0 rounded-pill fs-6 fw-semibold" defaultValue={seller.gstNumber || ""} />
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
