"use client";

import React, { useTransition } from "react";
import { updateKycStatusAction } from "@/app/actions/admin-modules";
import { toast } from "sonner";

export default function KycManager({ sellers }: { sellers: any[] }) {
  const [isPending, startTransition] = useTransition();

  const handleStatusUpdate = (id: string, status: string) => {
    startTransition(async () => {
      const res = await updateKycStatusAction(id, status);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  if (sellers.length === 0) {
    return (
      <div className="bg-white p-5 rounded-4 shadow-sm border-0 text-center">
        <i className="bi bi-shield-check text-success mb-3" style={{ fontSize: "3rem" }}></i>
        <h5 className="fw-bold">All Caught Up!</h5>
        <p className="text-muted">There are no pending KYC applications to review.</p>
      </div>
    );
  }

  return (
    <div className="row g-4">
      {sellers.map((seller) => (
        <div key={seller.id} className="col-md-6">
          <div className="bg-white p-4 rounded-4 shadow-sm border-0 h-100 d-flex flex-column">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-1">{seller.companyName}</h5>
                <div className="text-muted small">{seller.user.name} ({seller.user.email})</div>
              </div>
              <span className="badge bg-warning bg-opacity-20 text-warning rounded-pill px-3">PENDING</span>
            </div>
            
            <div className="bg-light p-3 rounded-3 mb-4 flex-grow-1">
              <div className="row g-3">
                <div className="col-12">
                  <div className="text-muted small fw-bold text-uppercase mb-1" style={{ letterSpacing: "1px", fontSize: "0.7rem" }}>Tax / GST ID</div>
                  <div className="fw-semibold">{seller.gstNumber || seller.taxId || "Not Provided"}</div>
                </div>
                <div className="col-12">
                  <div className="text-muted small fw-bold text-uppercase mb-1" style={{ letterSpacing: "1px", fontSize: "0.7rem" }}>Documents</div>
                  <div className="d-flex gap-2 flex-wrap mt-1">
                    {seller.kycDocuments && seller.kycDocuments.length > 0 ? (
                      seller.kycDocuments.map((doc: string, idx: number) => (
                        <a key={idx} href={doc} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary rounded-pill" style={{ fontSize: "0.75rem" }}>
                          <i className="bi bi-file-earmark-text me-1"></i> Document {idx + 1}
                        </a>
                      ))
                    ) : (
                      <span className="text-danger small fw-semibold">No Documents Uploaded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex gap-2 mt-auto">
              <button 
                className="btn btn-danger w-50 fw-bold rounded-pill shadow-sm"
                onClick={() => handleStatusUpdate(seller.id, "REJECTED")}
                disabled={isPending}
              >
                <i className="bi bi-x-circle me-1"></i> Reject
              </button>
              <button 
                className="btn btn-success w-50 fw-bold rounded-pill shadow-sm"
                onClick={() => handleStatusUpdate(seller.id, "APPROVED")}
                disabled={isPending}
              >
                <i className="bi bi-check-circle me-1"></i> Approve
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
