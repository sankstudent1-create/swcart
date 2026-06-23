"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { requestRefundAction } from "@/app/actions/shop";

export default function RequestReturnBtn({ sellerOrderId, currentStatus }: { sellerOrderId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);

  if (currentStatus === "RETURN_REQUESTED") {
    return <span className="badge bg-warning text-dark px-3 py-2 rounded-pill font-jakarta shadow-sm border border-warning border-opacity-50"><i className="bi bi-arrow-return-left me-1"></i> Return Pending</span>;
  }
  
  if (currentStatus === "RETURN_APPROVED") {
    return <span className="badge bg-success px-3 py-2 rounded-pill font-jakarta shadow-sm border border-success border-opacity-50"><i className="bi bi-check-circle me-1"></i> Return Approved</span>;
  }
  
  if (currentStatus === "REFUNDED") {
    return <span className="badge bg-info text-dark px-3 py-2 rounded-pill font-jakarta shadow-sm border border-info border-opacity-50"><i className="bi bi-wallet2 me-1"></i> Refunded</span>;
  }

  if (currentStatus !== "DELIVERED") return null;

  const handleRequestReturn = async () => {
    const reason = window.prompt("Please provide a reason for the return (e.g., Defective, Wrong Item):");
    if (!reason) return;

    setLoading(true);
    const res = await requestRefundAction(sellerOrderId, reason);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  return (
    <button 
      onClick={handleRequestReturn} 
      disabled={loading}
      className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold font-jakarta shadow-sm"
    >
      <i className="bi bi-arrow-return-left me-1"></i> {loading ? "Processing..." : "Request Return"}
    </button>
  );
}
