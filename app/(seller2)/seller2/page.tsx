import { prisma } from "@/lib/db";
import React from "react";

export default async function Seller2Dashboard() {
  // Mock authentication: just grab the first seller for demonstration
  const seller = await prisma.seller.findFirst({
    include: {
      user: true,
      _count: {
        select: { products: true, sellerOrders: true }
      }
    }
  });

  if (!seller) {
    return <div className="s2-card text-center p-5 text-muted">No seller profile found. Please run seed scripts.</div>;
  }

  // Calculate some dummy or real revenue
  const recentOrders = await prisma.sellerOrder.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      order: { select: { totalAmount: true } }
    }
  });

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="s2-page-title mb-1">Welcome back, {seller.companyName}</h1>
          <p className="text-muted s2-font">Here's what's happening with your store today.</p>
        </div>
        <div className="s2-card py-2 px-4 shadow-sm border-0 bg-white">
          <div className="d-flex align-items-center gap-3">
            <div className="text-end">
              <div className="text-muted small fw-bold text-uppercase tracking-wider">Wallet Balance</div>
              <div className="fs-4 fw-bolder text-success">₹ 12,450.00</div>
            </div>
            <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{width: 48, height: 48}}>
              <i className="bi bi-wallet2 fs-4"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="s2-grid-4">
        <div className="s2-card">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <div className="text-muted fw-semibold small mb-1">Total Revenue</div>
              <div className="fs-3 fw-bolder text-dark">₹ 45,231</div>
            </div>
            <div className="bg-primary bg-opacity-10 text-primary rounded p-2"><i className="bi bi-graph-up-arrow"></i></div>
          </div>
          <div className="text-success small fw-bold"><i className="bi bi-arrow-up"></i> 12.5% from last month</div>
        </div>
        
        <div className="s2-card">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <div className="text-muted fw-semibold small mb-1">Total Orders</div>
              <div className="fs-3 fw-bolder text-dark">{seller._count.sellerOrders}</div>
            </div>
            <div className="bg-warning bg-opacity-10 text-warning rounded p-2"><i className="bi bi-box-seam"></i></div>
          </div>
          <div className="text-danger small fw-bold"><i className="bi bi-arrow-down"></i> 2.1% from last month</div>
        </div>

        <div className="s2-card">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <div className="text-muted fw-semibold small mb-1">Active Products</div>
              <div className="fs-3 fw-bolder text-dark">{seller._count.products}</div>
            </div>
            <div className="bg-info bg-opacity-10 text-info rounded p-2"><i className="bi bi-tags"></i></div>
          </div>
          <div className="text-muted small">Updated 2 hrs ago</div>
        </div>

        <div className="s2-card">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <div className="text-muted fw-semibold small mb-1">Pending Returns</div>
              <div className="fs-3 fw-bolder text-dark">3</div>
            </div>
            <div className="bg-danger bg-opacity-10 text-danger rounded p-2"><i className="bi bi-arrow-return-left"></i></div>
          </div>
          <div className="text-warning small fw-bold">Requires Attention</div>
        </div>
      </div>

      <div className="row g-4">
        {/* Recent Orders List */}
        <div className="col-lg-8">
          <div className="s2-card h-100 p-0 overflow-hidden">
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="fw-bolder m-0">Recent Orders</h5>
              <button className="btn btn-sm btn-light fw-bold text-primary">View All</button>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted small text-uppercase">
                  <tr>
                    <th className="ps-4">Order ID</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length > 0 ? (
                    recentOrders.map(so => (
                      <tr key={so.id}>
                        <td className="ps-4 fw-bold text-dark">#{so.id.slice(-6).toUpperCase()}</td>
                        <td className="text-muted">{new Date(so.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge rounded-pill bg-opacity-25 border px-2 py-1 ${
                            so.status === 'PENDING' ? 'bg-warning text-warning border-warning' :
                            so.status === 'DELIVERED' ? 'bg-success text-success border-success' :
                            'bg-primary text-primary border-primary'
                          }`}>
                            {so.status}
                          </span>
                        </td>
                        <td className="text-end pe-4 fw-bolder">₹ {so.order.totalAmount}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="text-center py-4 text-muted">No recent orders found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Actions & Store Health */}
        <div className="col-lg-4">
          <div className="s2-card mb-4 bg-dark text-white border-0 position-relative overflow-hidden">
            <div className="position-absolute top-0 end-0 bg-primary bg-opacity-25 rounded-circle" style={{width: 150, height: 150, transform: "translate(30%, -30%)", filter: "blur(30px)"}}></div>
            <h5 className="fw-bolder mb-3 position-relative z-1">Store Health</h5>
            <div className="d-flex align-items-end gap-3 position-relative z-1 mb-2">
              <div className="display-4 fw-bolder text-success">98%</div>
              <div className="text-light opacity-75 mb-2">Excellent</div>
            </div>
            <p className="small opacity-75 position-relative z-1 mb-0">Your store is performing perfectly. Keep up the good work!</p>
          </div>
        </div>
      </div>
    </>
  );
}
