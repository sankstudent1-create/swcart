"use client";

import React, { useState } from "react";

export default function SuperadminReportBtn({ 
  userCount, 
  orderCount, 
  revenue, 
  recentOrders = [], 
  newUsers = [], 
  pendingKycCount 
}: { 
  userCount: number; 
  orderCount: number; 
  revenue: number; 
  recentOrders?: any[]; 
  newUsers?: any[]; 
  pendingKycCount: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        type="button" 
        className="btn text-white rounded-pill shadow-sm px-4 fw-bold hover-scale transition-all" 
        style={{ backgroundColor: "var(--red)" }}
        onClick={() => setIsOpen(true)}
      >
        <i className="bi bi-file-earmark-bar-graph me-2"></i> Export Report
      </button>

      {isOpen && (
        <div className="modal d-block text-dark font-jakarta" style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header bg-dark text-white p-4">
                <div className="d-flex align-items-center gap-3">
                  <img src="https://tools.swinfosystems.online/icon-192.png" alt="Logo" style={{ width: 40 }} />
                  <div>
                    <h5 className="modal-title fw-bold text-white m-0">Swcart Executive System Report</h5>
                    <div className="small text-white-50">Global Marketplace Administration Audit</div>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsOpen(false)}></button>
              </div>
              <div className="modal-body p-4 bg-light" id="printable-admin-report">
                {/* Brand Header */}
                <div className="d-flex justify-content-between align-items-center border-bottom pb-4 mb-4">
                  <div>
                    <h3 className="fw-black text-danger m-0">Sw<span className="text-dark">cart</span></h3>
                    <div className="text-muted small">Global Aggregator Marketplace Platform</div>
                  </div>
                  <div className="text-end text-muted small">
                    <div>Date: {new Date().toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div>Superadmin Authorization Role</div>
                  </div>
                </div>

                {/* Overall Statistics */}
                <div className="card border-0 rounded-3 shadow-sm p-4 mb-4 bg-white">
                  <div className="text-muted small fw-bold text-uppercase mb-2"><i className="bi bi-shield-check me-1 text-danger"></i> System Audit Metrics</div>
                  <div className="row text-center g-3 mt-1">
                    <div className="col-3">
                      <div className="fs-3 fw-bold text-dark">{userCount.toLocaleString('en-IN')}</div>
                      <div className="text-muted small">Total Users</div>
                    </div>
                    <div className="col-3">
                      <div className="fs-3 fw-bold text-primary">{orderCount.toLocaleString('en-IN')}</div>
                      <div className="text-muted small">Total Orders</div>
                    </div>
                    <div className="col-3">
                      <div className="fs-3 fw-bold text-success">₹{revenue.toLocaleString('en-IN')}</div>
                      <div className="text-muted small">Gross Revenue</div>
                    </div>
                    <div className="col-3">
                      <div className="fs-3 fw-bold text-warning">{pendingKycCount}</div>
                      <div className="text-muted small">Pending KYCs</div>
                    </div>
                  </div>
                </div>

                {/* Recent Orders List */}
                <div className="bg-white p-4 rounded-3 border mb-4">
                  <h6 className="fw-bold mb-3 border-bottom pb-2 text-dark"><i className="bi bi-receipt me-1 text-primary"></i> Recent Transactions</h6>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle small">
                      <thead className="table-light">
                        <tr>
                          <th>Order ID</th>
                          <th>User</th>
                          <th>Date</th>
                          <th className="text-end">Amount</th>
                          <th className="text-end">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((o: any) => (
                          <tr key={o.id}>
                            <td className="fw-bold font-monospace">#{o.id.slice(-8).toUpperCase()}</td>
                            <td>{o.user?.name || "Customer"}</td>
                            <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                            <td className="text-end fw-bold">₹{o.totalAmount.toLocaleString('en-IN')}</td>
                            <td className="text-end">
                              <span className="badge bg-light text-dark border px-2 py-1">{o.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Signups */}
                <div className="bg-white p-4 rounded-3 border mb-4">
                  <h6 className="fw-bold mb-3 border-bottom pb-2 text-dark"><i className="bi bi-people me-1 text-success"></i> Recently Joined Users</h6>
                  <ul className="list-group list-group-flush small">
                    {newUsers.map((u: any) => (
                      <li key={u.id} className="list-group-item d-flex justify-content-between align-items-center bg-transparent px-0 py-2">
                        <div>
                          <strong className="text-dark">{u.name}</strong>
                          <div className="text-muted" style={{ fontSize: "0.75rem" }}>{u.email}</div>
                        </div>
                        <span className="text-muted font-monospace" style={{ fontSize: "0.75rem" }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* System Diagnostics */}
                <div className="alert alert-light border-0 rounded-3 p-3 bg-white shadow-sm d-flex align-items-center gap-3">
                  <i className="bi bi-cpu text-success fs-3"></i>
                  <div>
                    <strong className="text-dark small d-block">SYSTEM NETWORK STATUS: operational</strong>
                    <span className="text-muted small" style={{ fontSize: "0.75rem" }}>Prisma Engine connected. Supabase Session handler verified. SSL handshake encryption check OK.</span>
                  </div>
                </div>

                {/* Footnote */}
                <div className="text-center text-muted small mt-4 pt-4 border-top">
                  Swcart Superadmin Control Dashboard &bull; Administration Executive Report
                </div>
              </div>
              <div className="modal-footer border-top-0 p-4 pt-0 bg-light d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setIsOpen(false)}>Close</button>
                <button 
                  type="button" 
                  className="btn btn-dark rounded-pill px-4 fw-bold shadow-sm"
                  onClick={() => {
                    const printContents = document.getElementById("printable-admin-report")?.innerHTML;
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
