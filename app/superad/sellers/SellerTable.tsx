"use client";

import React, { useState } from "react";
import { executeMacroAction } from "../actions";
import { toast } from "sonner";

export default function SellerTable({ initialSellers }: { initialSellers: any[] }) {
  const [sellers, setSellers] = useState(initialSellers);
  const [processing, setProcessing] = useState<string | null>(null);

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to suspend this seller and unpublish all their products?")) return;
    setProcessing(id);
    const res = await executeMacroAction("ARCHIVE_SELLER", id);
    if (res.success) {
      toast.success(res.message);
      setSellers(sellers.map(s => s.id === id ? { ...s, kycStatus: "REJECTED", isVerified: false } : s));
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
            <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-black bg-opacity-25 py-3 ps-4" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Company</th>
            <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-black bg-opacity-25 py-3" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Owner</th>
            <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-black bg-opacity-25 py-3" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Stats</th>
            <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-black bg-opacity-25 py-3 pe-4 text-end" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sellers.map(s => (
            <tr key={s.id}>
              <td className="border-bottom border-secondary border-opacity-10 align-middle ps-4">
                <div className="fw-bold text-white fs-6">{s.companyName}</div>
                <div className="d-flex align-items-center gap-2 mt-1">
                  {s.kycStatus === "APPROVED" ? (
                    <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25" style={{ fontSize: "0.6rem" }}>VERIFIED</span>
                  ) : s.kycStatus === "PENDING" ? (
                    <span className="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-25" style={{ fontSize: "0.6rem" }}>PENDING KYC</span>
                  ) : (
                    <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25" style={{ fontSize: "0.6rem" }}>SUSPENDED</span>
                  )}
                </div>
              </td>
              <td className="border-bottom border-secondary border-opacity-10 align-middle">
                <div className="text-white small fw-semibold">{s.user.name}</div>
                <div className="text-muted small" style={{ fontSize: "0.75rem" }}>{s.user.email}</div>
              </td>
              <td className="border-bottom border-secondary border-opacity-10 align-middle">
                <div className="d-flex gap-3 text-muted small">
                  <div title="Total Products"><i className="bi bi-box-seam"></i> {s._count.products}</div>
                  <div title="Total Orders"><i className="bi bi-cart-check"></i> {s._count.sellerOrders}</div>
                </div>
              </td>
              <td className="border-bottom border-secondary border-opacity-10 align-middle pe-4 text-end">
                {s.kycStatus !== "REJECTED" && (
                  <button 
                    className="btn btn-sm btn-outline-warning rounded-pill fw-bold" 
                    style={{ fontSize: "0.7rem" }}
                    onClick={() => handleArchive(s.id)}
                    disabled={processing === s.id}
                  >
                    {processing === s.id ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-pause-circle-fill me-1"></i> Suspend & Prune</>}
                  </button>
                )}
              </td>
            </tr>
          ))}
          {sellers.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-5 text-muted">No sellers found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
