"use client";

import React, { useState, useTransition } from "react";
import { createOfferAction, deleteOfferAction, toggleOfferAction } from "@/app/actions/admin-modules";
import { toast } from "sonner";

export default function OfferManager({ offers }: { offers: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", bannerImage: "", validFrom: "", validUntil: "", isActive: true });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createOfferAction(form);
      if (res.success) { toast.success(res.message); setShowModal(false); }
      else toast.error(res.message);
    });
  };

  const handleToggle = (id: string, current: boolean) => {
    startTransition(async () => {
      const res = await toggleOfferAction(id, !current);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete offer?")) return;
    startTransition(async () => {
      const res = await deleteOfferAction(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0 text-dark">Promotional Offers</h2>
        <button className="btn btn-dark rounded-pill px-4 shadow-sm" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-lg me-2"></i> Create Offer
        </button>
      </div>

      <div className="bg-white p-4 rounded-4 shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted small text-uppercase">
              <tr>
                <th className="py-3">Offer Details</th>
                <th className="py-3">Banner</th>
                <th className="py-3">Validity</th>
                <th className="py-3">Status</th>
                <th className="py-3 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {offers.map(o => (
                <tr key={o.id}>
                  <td className="py-3">
                    <div className="fw-bold text-dark">{o.title}</div>
                    <div className="text-muted small">{o.description}</div>
                  </td>
                  <td className="py-3">
                    {o.bannerImage ? <img src={o.bannerImage} alt="" style={{ height: "40px", borderRadius: "4px" }} /> : "—"}
                  </td>
                  <td className="py-3 small text-muted">
                    {new Date(o.validFrom).toLocaleDateString()} to<br/>
                    {new Date(o.validUntil).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" checked={o.isActive} onChange={() => handleToggle(o.id, o.isActive)} disabled={isPending} />
                    </div>
                  </td>
                  <td className="py-3 text-end">
                    <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => handleDelete(o.id)} disabled={isPending}>Delete</button>
                  </td>
                </tr>
              ))}
              {offers.length === 0 && <tr><td colSpan={5} className="text-center py-5 text-muted">No offers active</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom-0 p-4 pb-0">
                <h5 className="modal-title fw-bold">Create Promo Offer</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Offer Title</label>
                    <input type="text" className="form-control" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                  </div>
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Description</label>
                    <input type="text" className="form-control" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Banner Image URL</label>
                    <input type="url" className="form-control" value={form.bannerImage} onChange={e => setForm({...form, bannerImage: e.target.value})} />
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label text-muted small fw-bold text-uppercase">Valid From</label>
                      <input type="date" className="form-control" value={form.validFrom} onChange={e => setForm({...form, validFrom: e.target.value})} required />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-muted small fw-bold text-uppercase">Valid Until</label>
                      <input type="date" className="form-control" value={form.validUntil} onChange={e => setForm({...form, validUntil: e.target.value})} required />
                    </div>
                  </div>
                  <div className="form-check form-switch mt-2">
                    <input className="form-check-input" type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} />
                    <label className="form-check-label text-muted small fw-bold" htmlFor="isActive">Active upon creation</label>
                  </div>
                </div>
                <div className="modal-footer border-top-0 p-4 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-dark rounded-pill px-4" disabled={isPending}>{isPending ? "Saving..." : "Save Offer"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
