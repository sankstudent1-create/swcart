"use client";

import React, { useState, useTransition } from "react";
import { updatePayoutStatusAction } from "@/app/actions/admin-modules";
import { toast } from "sonner";

export default function PayoutManager({ sellers, totalOwed, commissionRate }: { sellers: any[], totalOwed: number, commissionRate: number }) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("unpaid");

  const handlePayout = (sellerId: string, orderIds: string[]) => {
    if (!confirm(`Mark ${orderIds.length} orders as Paid for this seller?`)) return;
    
    startTransition(async () => {
      let successCount = 0;
      for (const orderId of orderIds) {
        const res = await updatePayoutStatusAction(orderId);
        if (res.success) successCount++;
      }
      
      if (successCount === orderIds.length) {
        toast.success(`Payout marked successfully for ${successCount} orders.`);
      } else {
        toast.warning(`Payout partially completed. ${successCount}/${orderIds.length} orders updated.`);
      }
    });
  };

  return (
    <div>
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="bg-white p-4 rounded-4 shadow-sm border-0 glass-card d-flex align-items-center justify-content-between h-100">
            <div>
              <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1px", fontSize: "0.75rem" }}>Total Outstanding Payouts</h6>
              <h2 className="fw-black mb-0 display-5 text-dark" style={{ letterSpacing: "-1px" }}>₹{totalOwed.toLocaleString("en-IN")}</h2>
            </div>
            <div className="text-danger opacity-25">
              <i className="bi bi-cash-stack" style={{ fontSize: "4rem" }}></i>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="bg-white p-4 rounded-4 shadow-sm border-0 glass-card d-flex align-items-center justify-content-between h-100">
            <div>
              <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1px", fontSize: "0.75rem" }}>Platform Commission Rate</h6>
              <h2 className="fw-black mb-0 display-5 text-success" style={{ letterSpacing: "-1px" }}>{commissionRate}%</h2>
              <div className="text-muted small fw-semibold mt-1">Configurable in Global Settings</div>
            </div>
            <div className="text-success opacity-25">
              <i className="bi bi-pie-chart-fill" style={{ fontSize: "4rem" }}></i>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-4 shadow-sm border-0">
        {sellers.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-check-circle-fill text-success mb-3" style={{ fontSize: "3rem" }}></i>
            <h5 className="fw-bold">No Outstanding Payouts</h5>
            <p className="text-muted">All sellers have been paid for their delivered orders.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="table-light text-muted small text-uppercase">
                <tr>
                  <th className="fw-bold border-0 py-3 rounded-start">Merchant</th>
                  <th className="fw-bold border-0 py-3">Unpaid Orders</th>
                  <th className="fw-bold border-0 py-3">Gross Sales</th>
                  <th className="fw-bold border-0 py-3">Platform Cut</th>
                  <th className="fw-bold border-0 py-3">Net Earnings (Owed)</th>
                  <th className="fw-bold border-0 py-3 rounded-end text-end">Action</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {sellers.map((s) => (
                  <tr key={s.id} className="hover-bg-light transition-all">
                    <td className="py-4">
                      <div className="fw-bold text-dark">{s.companyName}</div>
                      <div className="text-muted small">{s.user.email}</div>
                    </td>
                    <td className="py-4">
                      <span className="badge bg-light text-dark border rounded-pill px-3">{s.unpaidOrdersCount}</span>
                    </td>
                    <td className="py-4 fw-semibold text-muted">₹{s.totalSales.toLocaleString("en-IN")}</td>
                    <td className="py-4 fw-semibold text-danger">- ₹{s.platformCut.toLocaleString("en-IN")}</td>
                    <td className="py-4 fw-bold text-success fs-5">₹{s.sellerEarnings.toLocaleString("en-IN")}</td>
                    <td className="py-4 text-end">
                      <button 
                        className="btn btn-dark rounded-pill fw-bold px-4 shadow-sm"
                        onClick={() => handlePayout(s.id, s.orderIds)}
                        disabled={isPending}
                      >
                        {isPending ? "Processing..." : "Mark as Paid"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
