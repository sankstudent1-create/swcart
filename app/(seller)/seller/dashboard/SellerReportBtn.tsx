"use client";

import React, { useState } from "react";

export default function SellerReportBtn({ stats, sellerName }: { stats: any; sellerName: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        type="button" 
        className="btn rounded-pill px-4 fw-semibold btn-outline-light"
        onClick={() => setIsOpen(true)}
      >
        <i className="bi bi-file-earmark-bar-graph me-1"></i> Store Report
      </button>

      {isOpen && (
        <div className="modal d-block text-dark font-jakarta" style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header bg-dark text-white p-4">
                <div className="d-flex align-items-center gap-3">
                  <img src="https://tools.swinfosystems.online/icon-192.png" alt="Logo" style={{ width: 40 }} />
                  <div>
                    <h5 className="modal-title fw-bold text-white m-0">Store Performance & Activity Report</h5>
                    <div className="small text-white-50">Swcart Vendor Network Partner</div>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsOpen(false)}></button>
              </div>
              <div className="modal-body p-4 bg-light" id="printable-seller-report">
                {/* Brand Header */}
                <div className="d-flex justify-content-between align-items-center border-bottom pb-4 mb-4">
                  <div>
                    <h3 className="fw-black text-danger m-0">Sw<span className="text-dark">cart</span></h3>
                    <div className="text-muted small">Multi-Category Merchant Operations</div>
                  </div>
                  <div className="text-end text-muted small">
                    <div>Date: {new Date().toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div>Seller Portal Auth Session</div>
                  </div>
                </div>

                {/* Seller Stats */}
                <div className="card border-0 rounded-3 shadow-sm p-4 mb-4 bg-white">
                  <div className="text-muted small fw-bold text-uppercase mb-2"><i className="bi bi-shop me-1 text-danger"></i> Vendor Information</div>
                  <h5 className="fw-bold mb-1">{sellerName}</h5>
                  <hr className="my-3 opacity-10" />
                  
                  <div className="row text-center g-3 mt-1">
                    <div className="col-3">
                      <div className="fs-3 fw-bold text-dark">{stats.totalProducts}</div>
                      <div className="text-muted small">Total Products</div>
                    </div>
                    <div className="col-3">
                      <div className="fs-3 fw-bold text-primary">{stats.totalOrders}</div>
                      <div className="text-muted small">Total Orders</div>
                    </div>
                    <div className="col-3">
                      <div className="fs-3 fw-bold text-success">₹{stats.totalRevenue.toLocaleString("en-IN")}</div>
                      <div className="text-muted small">Gross Revenue</div>
                    </div>
                    <div className="col-3">
                      <div className="fs-3 fw-bold text-success">₹{stats.deliveredRevenue.toLocaleString("en-IN")}</div>
                      <div className="text-muted small">Delivered Revenue</div>
                    </div>
                  </div>
                </div>

                {/* Top Products */}
                <div className="bg-white p-4 rounded-3 border mb-4">
                  <h6 className="fw-bold mb-3 border-bottom pb-2 text-dark"><i className="bi bi-trophy me-1 text-warning"></i> Top Performing Catalog Items</h6>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle small">
                      <thead className="table-light">
                        <tr>
                          <th>Rank</th>
                          <th>Product Name</th>
                          <th className="text-center">Units Sold</th>
                          <th className="text-end">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.topProducts.map((p: any, i: number) => (
                          <tr key={i}>
                            <td className="fw-bold text-muted">#{i + 1}</td>
                            <td className="fw-bold text-dark">{p.title}</td>
                            <td className="text-center fw-bold">{p.qty}</td>
                            <td className="text-end fw-bold text-success">₹{p.revenue.toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                        {stats.topProducts.length === 0 && (
                          <tr><td colSpan={4} className="text-center py-3 text-muted">No sales metrics recorded yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Category Sales */}
                <div className="bg-white p-4 rounded-3 border mb-4">
                  <h6 className="fw-bold mb-3 border-bottom pb-2 text-dark"><i className="bi bi-tags me-1 text-primary"></i> Category Distribution</h6>
                  <div className="d-flex flex-column gap-2">
                    {stats.catRevList.map(([cat, rev]: any, i: number) => (
                      <div key={cat} className="d-flex justify-content-between py-1 border-bottom border-light">
                        <span className="fw-medium text-dark">{cat}</span>
                        <span className="fw-bold text-success">₹{rev.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Low Stock Alerts */}
                {stats.lowStockItems.length > 0 && (
                  <div className="alert alert-warning border-0 rounded-3 p-3">
                    <h6 className="fw-bold"><i className="bi bi-exclamation-triangle-fill me-2"></i>Inventory Stock Alert</h6>
                    <div className="small">
                      {stats.lowStockItems.slice(0, 3).map((item: any, i: number) => (
                        <div key={i} className="mb-1">&bull; <strong>{item.title}</strong> (SKU: {item.sku}) is running low: <strong>{item.stock} left</strong></div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footnote */}
                <div className="text-center text-muted small mt-4 pt-4 border-top">
                  Swcart Vendor Network &bull; Merchant Control Center &bull; Confidential
                </div>
              </div>
              <div className="modal-footer border-top-0 p-4 pt-0 bg-light d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setIsOpen(false)}>Close</button>
                <button 
                  type="button" 
                  className="btn btn-dark rounded-pill px-4 fw-bold shadow-sm"
                  onClick={() => {
                    const printContents = document.getElementById("printable-seller-report")?.innerHTML;
                    if (printContents) {
                      document.body.innerHTML = printContents;
                      window.print();
                      window.location.reload();
                    }
                  }}
                >
                  <i className="bi bi-printer me-2"></i> Print Report / Save PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
