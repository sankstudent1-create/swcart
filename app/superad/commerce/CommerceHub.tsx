"use client";

import React, { useState } from "react";
import { executeMacroAction } from "../actions";
import { toast } from "sonner";

export default function CommerceHub({ initialOrders, initialProducts }: any) {
  const [activeTab, setActiveTab] = useState("orders");
  const [processing, setProcessing] = useState<string | null>(null);

  const handleForceDeliver = async (id: string) => {
    if (!confirm("Force this global order to DELIVERED and trigger payouts?")) return;
    setProcessing(id);
    const res = await executeMacroAction("FORCE_DELIVER", id);
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
    setProcessing(null);
  };

  return (
    <div className="rounded-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(10px)" }}>
      <div className="d-flex border-bottom border-secondary border-opacity-25 bg-black bg-opacity-25 position-relative">
        <button 
          className={`btn btn-link text-decoration-none rounded-0 px-4 py-3 fw-bold ${activeTab === 'orders' ? 'text-white border-bottom border-danger border-3' : 'text-muted'}`}
          onClick={() => setActiveTab('orders')}
          style={{ transition: "all 0.3s" }}
        >
          <i className="bi bi-globe me-2"></i>Global Orders
        </button>
        <button 
          className={`btn btn-link text-decoration-none rounded-0 px-4 py-3 fw-bold ${activeTab === 'products' ? 'text-white border-bottom border-danger border-3' : 'text-muted'}`}
          onClick={() => setActiveTab('products')}
          style={{ transition: "all 0.3s" }}
        >
          <i className="bi bi-box-seam me-2"></i>Product Catalog
        </button>
      </div>

      {/* Advanced Filters Toolbar (Mock) */}
      <div className="p-3 border-bottom border-secondary border-opacity-10 d-flex justify-content-between align-items-center bg-dark bg-opacity-50">
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-dark border border-secondary border-opacity-50 text-white rounded-pill px-3 fw-bold d-flex align-items-center gap-2" style={{ fontSize: "0.75rem" }}>
            <i className="bi bi-funnel-fill"></i> Filter by Status
          </button>
          <button className="btn btn-sm btn-outline-secondary text-muted rounded-pill px-3 fw-bold" style={{ fontSize: "0.75rem" }}>High Value (>{'₹10k'})</button>
        </div>
        <button className="btn btn-sm btn-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-3 fw-bold" style={{ fontSize: "0.75rem" }}>
          <i className="bi bi-arrow-counterclockwise me-1"></i> Auto-Refund Cancelled
        </button>
      </div>

      <div className="p-0">
        {activeTab === 'orders' && (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0" style={{ background: "transparent" }}>
              <thead>
                <tr>
                  <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-black bg-opacity-10 py-3 ps-4" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Order / Customer</th>
                  <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-black bg-opacity-10 py-3" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Sellers Involved</th>
                  <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-black bg-opacity-10 py-3" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Value / Status</th>
                  <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-black bg-opacity-10 py-3 pe-4 text-end" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {initialOrders.map((o: any) => (
                  <tr key={o.id} className="hover-bg-dark" style={{ transition: "background 0.2s" }}>
                    <td className="border-bottom border-secondary border-opacity-10 align-middle ps-4">
                      <div className="fw-bold text-white fs-6 font-monospace">#{o.id.slice(-8).toUpperCase()}</div>
                      <div className="text-muted small mt-1"><i className="bi bi-person me-1"></i>{o.user?.name}</div>
                    </td>
                    <td className="border-bottom border-secondary border-opacity-10 align-middle">
                      <div className="d-flex flex-wrap gap-1">
                        {o.sellerOrders.map((so: any) => (
                          <span key={so.id} className="badge bg-dark text-light border border-secondary border-opacity-50" style={{ fontSize: "0.65rem" }}>
                            {so.seller?.companyName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="border-bottom border-secondary border-opacity-10 align-middle">
                      <div className="fw-bolder text-white fs-5 lh-1 text-success">₹{o.totalAmount}</div>
                      <span className={`badge ${o.status === 'DELIVERED' ? 'bg-success text-success' : o.status === 'CANCELLED' ? 'bg-danger text-danger' : 'bg-warning text-warning'} bg-opacity-10 border border-${o.status === 'DELIVERED' ? 'success' : o.status === 'CANCELLED' ? 'danger' : 'warning'} border-opacity-25 mt-2`} style={{ fontSize: "0.6rem" }}>
                        {o.status}
                      </span>
                    </td>
                    <td className="border-bottom border-secondary border-opacity-10 align-middle pe-4 text-end">
                      {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && (
                        <button 
                          className="btn btn-sm btn-outline-success rounded-pill fw-bold shadow-sm" 
                          style={{ fontSize: "0.7rem" }}
                          onClick={() => handleForceDeliver(o.id)}
                          disabled={processing === o.id}
                        >
                          {processing === o.id ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-check-circle-fill me-1"></i> Force Deliver</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0" style={{ background: "transparent" }}>
              <thead>
                <tr>
                  <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-black bg-opacity-10 py-3 ps-4" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Product</th>
                  <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-black bg-opacity-10 py-3" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Vendor</th>
                  <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-black bg-opacity-10 py-3" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Pricing</th>
                  <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-black bg-opacity-10 py-3 pe-4 text-end" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {initialProducts.map((p: any) => (
                  <tr key={p.id} className="hover-bg-dark" style={{ transition: "background 0.2s" }}>
                    <td className="border-bottom border-secondary border-opacity-10 align-middle ps-4">
                      <div className="d-flex align-items-center gap-3">
                        <img src={p.images?.[0] || 'https://via.placeholder.com/50'} alt="product" className="rounded-3 object-fit-cover shadow-sm" style={{ width: 48, height: 48 }} />
                        <div>
                          <div className="fw-bold text-white fs-6 text-truncate" style={{ maxWidth: 250 }}>{p.title}</div>
                          <div className="text-muted" style={{ fontSize: "0.7rem" }}><i className="bi bi-tag-fill me-1"></i>{p.category?.name} &bull; {p.productType}</div>
                        </div>
                      </div>
                    </td>
                    <td className="border-bottom border-secondary border-opacity-10 align-middle text-muted small fw-semibold">
                      {p.seller?.companyName}
                    </td>
                    <td className="border-bottom border-secondary border-opacity-10 align-middle">
                      <div className="fw-bolder text-white fs-5 lh-1">₹{p.basePrice}</div>
                      {!p.isPublished && <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 mt-2" style={{ fontSize: "0.6rem" }}>UNPUBLISHED</span>}
                    </td>
                    <td className="border-bottom border-secondary border-opacity-10 align-middle pe-4 text-end">
                      <button className="btn btn-sm btn-outline-danger rounded-pill fw-bold shadow-sm" style={{ fontSize: "0.7rem" }}>
                        <i className="bi bi-slash-circle me-1"></i> Takedown
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
