"use client";

import React, { useTransition } from "react";
import { verifySellerAction } from "@/app/actions/admin-modules";
import { toast } from "sonner";

export default function SellerManager({ sellers, analytics }: { sellers: any[], analytics: any }) {
  const [isPending, startTransition] = useTransition();

  const handleVerify = (id: string, isVerified: boolean) => {
    startTransition(async () => {
      const res = await verifySellerAction(id, isVerified);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0 text-dark">Sellers ERP</h2>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="bg-white p-4 rounded-4 shadow-sm border-0 d-flex flex-column gap-2" style={{ borderLeft: "4px solid #007aff !important" }}>
            <div className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: "1px" }}>Total Merchants</div>
            <div className="fs-3 fw-bold text-dark">{analytics.totalSellers}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-4 rounded-4 shadow-sm border-0 d-flex flex-column gap-2" style={{ borderLeft: "4px solid #34c759 !important" }}>
            <div className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: "1px" }}>Active Verified</div>
            <div className="fs-3 fw-bold text-success">{analytics.activeSellers}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-4 rounded-4 shadow-sm border-0 d-flex flex-column gap-2" style={{ borderLeft: "4px solid #ff9500 !important" }}>
            <div className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: "1px" }}>Total Global Products</div>
            <div className="fs-3 fw-bold text-warning">{analytics.totalProducts}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-4 rounded-4 shadow-sm border-0 d-flex flex-column gap-2" style={{ borderLeft: "4px solid #ff3b30 !important" }}>
            <div className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: "1px" }}>Total Merchant Revenue</div>
            <div className="fs-3 fw-bold text-danger">₹{analytics.totalRevenue.toLocaleString("en-IN")}</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-4 shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted small text-uppercase">
              <tr>
                <th className="py-3">Company</th>
                <th className="py-3">Owner Details</th>
                <th className="py-3">GST Number</th>
                <th className="py-3">Status</th>
                <th className="py-3 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map(s => (
                <tr key={s.id}>
                  <td className="py-3 fw-bold text-dark">{s.companyName}</td>
                  <td className="py-3">
                    <div className="fw-semibold text-dark">{s.user.name}</div>
                    <div className="text-muted small">{s.user.email}</div>
                  </td>
                  <td className="py-3 font-monospace text-muted small">{s.gstNumber || "N/A"}</td>
                  <td className="py-3">
                    {s.isVerified ? (
                      <span className="badge bg-success bg-opacity-20 text-success rounded-pill px-3">Verified</span>
                    ) : (
                      <span className="badge bg-warning bg-opacity-20 text-warning rounded-pill px-3">Unverified</span>
                    )}
                  </td>
                  <td className="py-3 text-end">
                    {s.isVerified ? (
                      <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => handleVerify(s.id, false)} disabled={isPending}>Revoke</button>
                    ) : (
                      <button className="btn btn-sm btn-success rounded-pill px-3" onClick={() => handleVerify(s.id, true)} disabled={isPending}>Verify</button>
                    )}
                  </td>
                </tr>
              ))}
              {sellers.length === 0 && <tr><td colSpan={5} className="text-center py-5 text-muted">No sellers registered</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
