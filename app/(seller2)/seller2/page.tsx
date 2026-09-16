import { prisma } from "@/lib/db";
import React from "react";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/Seller2/MotionWrapper";

export default async function Seller2Dashboard() {
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

  const recentOrders = await prisma.sellerOrder.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { order: { select: { totalAmount: true } } }
  });

  // Mock chart data
  const chartData = [35, 45, 30, 65, 85, 55, 90, 75, 100, 80];

  return (
    <StaggerContainer>
      <StaggerItem className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="s2-page-title mb-1 s2-gradient-text">Welcome back, {seller.companyName}</h1>
          <p className="text-muted s2-font">Here's what's happening with your store today.</p>
        </div>
        <div className="s2-card-bento py-2 px-4 shadow-sm border-0 bg-white">
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
      </StaggerItem>

      <div className="s2-bento-grid">
        
        {/* Main Revenue Chart (Span 3) */}
        <StaggerItem className="s2-card-bento s2-bento-col-3 d-flex flex-column justify-content-between">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <div className="text-muted fw-semibold small mb-1">Total Revenue (Last 30 Days)</div>
              <div className="fs-1 fw-bolder text-dark">₹ 145,231</div>
              <div className="text-success small fw-bold"><i className="bi bi-arrow-up"></i> 24.5% vs last period</div>
            </div>
            <div className="bg-primary bg-opacity-10 text-primary rounded p-2"><i className="bi bi-graph-up-arrow fs-4"></i></div>
          </div>
          
          {/* Animated CSS Chart */}
          <div className="s2-chart-container w-100 mt-3 border-bottom border-light">
            {chartData.map((val, idx) => (
              <div key={idx} className="s2-chart-bar" style={{ height: `${val}%` }} data-value={`₹${val}k`}></div>
            ))}
          </div>
        </StaggerItem>

        {/* Quick Stats (Span 1, stacked vertically) */}
        <StaggerItem className="s2-bento-col-1 d-flex flex-column gap-4">
          <div className="s2-card-bento h-100 bg-dark text-white border-0 position-relative overflow-hidden">
            <div className="position-absolute top-0 end-0 bg-primary bg-opacity-50 rounded-circle" style={{width: 150, height: 150, transform: "translate(30%, -30%)", filter: "blur(30px)"}}></div>
            <h5 className="fw-bolder mb-1 position-relative z-1">Store Health</h5>
            <div className="display-4 fw-bolder text-success position-relative z-1">98%</div>
            <div className="text-light opacity-75 small position-relative z-1">Excellent Performance</div>
          </div>
          
          <div className="s2-card-bento h-100 bg-primary text-white border-0">
            <h5 className="fw-bolder mb-1 text-white text-opacity-75">Active Products</h5>
            <div className="display-4 fw-bolder">{seller._count.products}</div>
          </div>
        </StaggerItem>

        {/* Recent Orders (Span 3) */}
        <StaggerItem className="s2-card-bento s2-bento-col-3 p-0">
          <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
            <h5 className="fw-bolder m-0">Live Order Stream</h5>
            <button className="btn btn-sm btn-light fw-bold text-primary">View All</button>
          </div>
          <div className="table-responsive">
            <table className="table table-borderless align-middle mb-0">
              <thead className="text-muted small text-uppercase bg-light bg-opacity-50">
                <tr>
                  <th className="ps-4 py-3 rounded-start">Order ID</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">Status</th>
                  <th className="text-end pe-4 py-3 rounded-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map(so => (
                    <tr key={so.id} className="s2-table-row border-bottom border-light">
                      <td className="ps-4 py-3 fw-bold text-dark">#{so.id.slice(-6).toUpperCase()}</td>
                      <td className="py-3 text-muted">{new Date(so.createdAt).toLocaleDateString()}</td>
                      <td className="py-3">
                        <span className={`badge rounded-pill bg-opacity-10 px-3 py-2 ${
                          so.status === 'PENDING' ? 'bg-warning text-warning border border-warning border-opacity-25' :
                          so.status === 'DELIVERED' ? 'bg-success text-success border border-success border-opacity-25' :
                          'bg-primary text-primary border border-primary border-opacity-25'
                        }`}>
                          {so.status}
                        </span>
                      </td>
                      <td className="text-end pe-4 py-3 fw-bolder">₹ {so.order.totalAmount}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="text-center py-4 text-muted">No recent orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </StaggerItem>

        {/* Action Center (Span 1) */}
        <StaggerItem className="s2-card-bento s2-bento-col-1">
          <h5 className="fw-bolder border-bottom pb-3 mb-3">Action Center</h5>
          <div className="d-flex flex-column gap-3">
            <div className="p-3 bg-danger bg-opacity-10 text-danger rounded d-flex justify-content-between align-items-center fw-bold cursor-pointer transition-all hover-scale">
              <span>Pending Returns</span>
              <span className="badge bg-danger rounded-pill">3</span>
            </div>
            <div className="p-3 bg-warning bg-opacity-10 text-warning rounded d-flex justify-content-between align-items-center fw-bold cursor-pointer transition-all hover-scale">
              <span>Orders to Ship</span>
              <span className="badge bg-warning rounded-pill">12</span>
            </div>
            <div className="p-3 bg-info bg-opacity-10 text-info rounded d-flex justify-content-between align-items-center fw-bold cursor-pointer transition-all hover-scale">
              <span>Support Tickets</span>
              <span className="badge bg-info rounded-pill">5</span>
            </div>
          </div>
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
}
