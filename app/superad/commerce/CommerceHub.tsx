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
    <div className="rounded-4 overflow-hidden border border-secondary border-opacity-25 bg-dark bg-opacity-50">
      <div className="d-flex border-bottom border-secondary border-opacity-25 bg-black bg-opacity-25">
        <button 
          className={`btn btn-link text-decoration-none rounded-0 px-4 py-3 fw-bold ${activeTab === 'orders' ? 'text-white border-bottom border-danger border-3' : 'text-muted'}`}
          onClick={() => setActiveTab('orders')}
        >
          Global Orders
        </button>
        <button 
          className={`btn btn-link text-decoration-none rounded-0 px-4 py-3 fw-bold ${activeTab === 'products' ? 'text-white border-bottom border-danger border-3' : 'text-muted'}`}
          onClick={() => setActiveTab('products')}
        >
          Product Catalog
        </button>
      </div>

      <div className="p-0">
        {activeTab === 'orders' && (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0" style={{ background: "transparent" }}>
              <thead>
                <tr>
                  <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 py-3 ps-4" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Order / Customer</th>
                  <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 py-3" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Sellers Involved</th>
                  <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 py-3" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Value / Status</th>
                  <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 py-3 pe-4 text-end" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {initialOrders.map((o: any) => (
                  <tr key={o.id}>
                    <td className="border-bottom border-secondary border-opacity-10 align-middle ps-4">
                      <div className="fw-bold text-white small font-monospace">#{o.id.slice(-8).toUpperCase()}</div>
                      <div className="text-muted small mt-1">{o.user?.name}</div>
                    </td>
                    <td className="border-bottom border-secondary border-opacity-10 align-middle">
                      <div className="d-flex flex-wrap gap-1">
                        {o.sellerOrders.map((so: any) => (
                          <span key={so.id} className="badge bg-secondary bg-opacity-25 text-light border border-secondary border-opacity-25" style={{ fontSize: "0.6rem" }}>
                            {so.seller?.companyName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="border-bottom border-secondary border-opacity-10 align-middle">
                      <div className="fw-bold text-white fs-6">₹{o.totalAmount}</div>
                      <span className={`badge ${o.status === 'DELIVERED' ? 'bg-success text-success' : o.status === 'CANCELLED' ? 'bg-danger text-danger' : 'bg-warning text-warning'} bg-opacity-25 border border-${o.status === 'DELIVERED' ? 'success' : o.status === 'CANCELLED' ? 'danger' : 'warning'} border-opacity-25 mt-1`} style={{ fontSize: "0.6rem" }}>
                        {o.status}
                      </span>
                    </td>
                    <td className="border-bottom border-secondary border-opacity-10 align-middle pe-4 text-end">
                      {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && (
                        <button 
                          className="btn btn-sm btn-outline-success rounded-pill fw-bold" 
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
                  <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 py-3 ps-4" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Product</th>
                  <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 py-3" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Vendor</th>
                  <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 py-3" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Pricing</th>
                  <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 py-3 pe-4 text-end" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {initialProducts.map((p: any) => (
                  <tr key={p.id}>
                    <td className="border-bottom border-secondary border-opacity-10 align-middle ps-4">
                      <div className="d-flex align-items-center gap-3">
                        <img src={p.images?.[0] || 'https://via.placeholder.com/50'} alt="product" className="rounded-3 object-fit-cover" style={{ width: 40, height: 40 }} />
                        <div>
                          <div className="fw-bold text-white small text-truncate" style={{ maxWidth: 200 }}>{p.title}</div>
                          <div className="text-muted" style={{ fontSize: "0.7rem" }}>{p.category?.name} &bull; {p.productType}</div>
                        </div>
                      </div>
                    </td>
                    <td className="border-bottom border-secondary border-opacity-10 align-middle text-muted small">
                      {p.seller?.companyName}
                    </td>
                    <td className="border-bottom border-secondary border-opacity-10 align-middle">
                      <div className="fw-bold text-white">₹{p.basePrice}</div>
                      {!p.isPublished && <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25 mt-1" style={{ fontSize: "0.6rem" }}>UNPUBLISHED</span>}
                    </td>
                    <td className="border-bottom border-secondary border-opacity-10 align-middle pe-4 text-end">
                      <button className="btn btn-sm btn-outline-danger rounded-pill fw-bold" style={{ fontSize: "0.7rem" }}>
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
