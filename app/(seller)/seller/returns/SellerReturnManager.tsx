"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { processReturnAction } from "@/app/actions/seller";

export default function SellerReturnManager({ returnRequests }: { returnRequests: any[] }) {
  const [loading, setLoading] = useState(false);

  const handleProcess = async (id: string, action: "APPROVE" | "REJECT") => {
    let reason = "";
    if (action === "REJECT") {
      const res = window.prompt("Reason for rejection:");
      if (!res) return;
      reason = res;
    } else {
      if (!window.confirm("Approve this return? This will trigger a refund.")) return;
    }

    setLoading(true);
    const res = await processReturnAction(id, action, reason);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  if (returnRequests.length === 0) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-box-seam text-muted" style={{ fontSize: "3rem" }}></i>
        <h5 className="font-jakarta text-muted mt-3">No return requests at the moment.</h5>
      </div>
    );
  }

  return (
    <div className="row g-4">
      {returnRequests.map((req: any) => {
        const refund = req.order.refunds?.find((r: any) => r.status === "PENDING" || r.status === "APPROVED");
        const amount = req.items.reduce((acc: number, item: any) => acc + (item.priceAtBuy * item.quantity), 0);
        
        return (
          <div className="col-12" key={req.id}>
            <div className="card border-0 shadow-sm rounded-4 font-jakarta">
              <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted small fw-bold text-uppercase">Return Request</div>
                  <div className="fw-bolder fs-5 text-dark">Order #{req.orderId.slice(-8).toUpperCase()}</div>
                </div>
                <div>
                  {req.status === "RETURN_REQUESTED" ? (
                    <span className="badge bg-warning text-dark px-3 py-2 rounded-pill border border-warning border-opacity-50">Pending Review</span>
                  ) : (
                    <span className="badge bg-success px-3 py-2 rounded-pill border border-success border-opacity-50">Approved</span>
                  )}
                </div>
              </div>
              <div className="card-body p-4">
                <div className="row">
                  <div className="col-md-6 border-end">
                    <h6 className="text-muted fw-bold mb-3">Customer Details</h6>
                    <p className="mb-1"><i className="bi bi-person me-2"></i>{req.order.user.name}</p>
                    <p className="mb-1"><i className="bi bi-envelope me-2"></i>{req.order.user.email}</p>
                    <p className="mb-0"><i className="bi bi-geo-alt me-2"></i>{req.order.shippingAddress.city}, {req.order.shippingAddress.state}</p>
                    
                    <h6 className="text-muted fw-bold mt-4 mb-2">Customer Reason</h6>
                    <div className="bg-light p-3 rounded-3 border">
                      "{refund?.reason || "No specific reason provided."}"
                    </div>
                  </div>
                  <div className="col-md-6 ps-md-4">
                    <h6 className="text-muted fw-bold mb-3">Return Items</h6>
                    <div className="d-flex flex-column gap-3 mb-4">
                      {req.items.map((item: any) => (
                        <div key={item.id} className="d-flex gap-3 align-items-center">
                          {item.variant.product.images?.[0] ? (
                            <img src={item.variant.product.images[0]} style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }} />
                          ) : (
                            <div className="bg-light rounded d-flex justify-content-center align-items-center" style={{ width: 50, height: 50 }}><i className="bi bi-image text-muted"></i></div>
                          )}
                          <div>
                            <div className="fw-bold">{item.variant.product.title}</div>
                            <div className="text-muted small">Qty: {item.quantity} | ₹{item.priceAtBuy}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center bg-danger bg-opacity-10 p-3 rounded-3 text-danger fw-bolder">
                      <span>Refund Amount</span>
                      <span>₹{amount.toLocaleString('en-IN')}</span>
                    </div>

                    {req.status === "RETURN_REQUESTED" && (
                      <div className="d-flex gap-2 mt-4">
                        <button disabled={loading} onClick={() => handleProcess(req.id, "APPROVE")} className="btn btn-success flex-grow-1 fw-bold rounded-pill shadow-sm"><i className="bi bi-check-circle me-1"></i> Approve Return</button>
                        <button disabled={loading} onClick={() => handleProcess(req.id, "REJECT")} className="btn btn-outline-danger flex-grow-1 fw-bold rounded-pill shadow-sm"><i className="bi bi-x-circle me-1"></i> Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
