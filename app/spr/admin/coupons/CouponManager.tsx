"use client";

import React, { useState, useTransition } from "react";
import { createCouponAction, deleteCouponAction } from "@/app/actions/admin-modules";
import { toast } from "sonner";

export default function CouponManager({ coupons }: { coupons: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: "", discountType: "PERCENTAGE", discountVal: 0, minSpend: "", maxDiscount: "", validUntil: "", usageLimit: "" });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createCouponAction(form);
      if (res.success) { toast.success(res.message); setShowModal(false); }
      else toast.error(res.message);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete coupon?")) return;
    startTransition(async () => {
      const res = await deleteCouponAction(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0 text-dark">Coupons</h2>
        <button className="btn btn-dark rounded-pill px-4 shadow-sm" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-lg me-2"></i> Create Coupon
        </button>
      </div>

      <div className="bg-white p-4 rounded-4 shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted small text-uppercase">
              <tr>
                <th className="py-3">Code</th>
                <th className="py-3">Discount</th>
                <th className="py-3">Limits</th>
                <th className="py-3">Valid Until</th>
                <th className="py-3">Used</th>
                <th className="py-3 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id}>
                  <td className="py-3 fw-bold font-monospace text-danger">{c.code}</td>
                  <td className="py-3 fw-semibold">
                    {c.discountType === "PERCENTAGE" ? `${c.discountVal}% OFF` : `₹${c.discountVal} OFF`}
                  </td>
                  <td className="py-3 small text-muted">
                    Min Spend: ₹{c.minSpend || 0}<br/>
                    {c.maxDiscount && `Max Discount: ₹${c.maxDiscount}`}
                  </td>
                  <td className="py-3 text-muted small">{new Date(c.validUntil).toLocaleDateString()}</td>
                  <td className="py-3 text-muted small">{c.usedCount} / {c.usageLimit || "∞"}</td>
                  <td className="py-3 text-end">
                    <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => handleDelete(c.id)} disabled={isPending}>Delete</button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && <tr><td colSpan={6} className="text-center py-5 text-muted">No coupons found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom-0 p-4 pb-0">
                <h5 className="modal-title fw-bold">Create Coupon</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Code</label>
                    <input type="text" className="form-control" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required />
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label text-muted small fw-bold text-uppercase">Type</label>
                      <select className="form-select" value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})}>
                        <option value="PERCENTAGE">Percentage</option>
                        <option value="FIXED">Fixed Amount</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label text-muted small fw-bold text-uppercase">Value</label>
                      <input type="number" className="form-control" value={form.discountVal} onChange={e => setForm({...form, discountVal: Number(e.target.value)})} required />
                    </div>
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label text-muted small fw-bold text-uppercase">Min Spend (₹)</label>
                      <input type="number" className="form-control" value={form.minSpend} onChange={e => setForm({...form, minSpend: e.target.value})} />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-muted small fw-bold text-uppercase">Max Discount (₹)</label>
                      <input type="number" className="form-control" value={form.maxDiscount} onChange={e => setForm({...form, maxDiscount: e.target.value})} />
                    </div>
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label text-muted small fw-bold text-uppercase">Valid Until</label>
                      <input type="date" className="form-control" value={form.validUntil} onChange={e => setForm({...form, validUntil: e.target.value})} required />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-muted small fw-bold text-uppercase">Usage Limit</label>
                      <input type="number" className="form-control" value={form.usageLimit} onChange={e => setForm({...form, usageLimit: e.target.value})} placeholder="Infinite if empty" />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top-0 p-4 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-dark rounded-pill px-4" disabled={isPending}>{isPending ? "Saving..." : "Save Coupon"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
