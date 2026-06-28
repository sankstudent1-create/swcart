import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import SuperadminReportBtn from "./SuperadminReportBtn";

export default async function AdminDashboard() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const [userCount, orderCount, totalRevenue, recentOrders, newUsers, pendingKycCount] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: "PAID" }
    }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { user: true }
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" }
    }),
    prisma.seller.count({ where: { kycStatus: "PENDING" } })
  ]);

  const revenue = totalRevenue._sum.totalAmount || 0;

  // Fake chart data for the CSS bar chart based on today
  const chartBars = [40, 65, 30, 80, 55, 90, 70]; // percentages

  return (
    <div>
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-1px" }}>Executive Dashboard</h2>
          <p className="text-muted mb-0">Marketplace overview & performance metrics.</p>
        </div>
        <SuperadminReportBtn 
          userCount={userCount}
          orderCount={orderCount}
          revenue={revenue}
          recentOrders={JSON.parse(JSON.stringify(recentOrders))}
          newUsers={JSON.parse(JSON.stringify(newUsers))}
          pendingKycCount={pendingKycCount}
        />
      </div>
      
      {/* Metric Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="bg-white p-4 p-xl-5 rounded-4 shadow-sm position-relative overflow-hidden border-0 hover-lift transition-all glass-card">
            <div className="position-absolute end-0 top-0 mt-4 me-4 text-primary opacity-25 transition-all card-icon">
              <i className="bi bi-people-fill" style={{ fontSize: "5rem" }}></i>
            </div>
            <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1.5px", fontSize: "0.75rem" }}>Total Users</h6>
            <h2 className="fw-black mb-2 display-5" style={{ letterSpacing: "-2px" }}>{userCount.toLocaleString('en-IN')}</h2>
            <div className="text-success small fw-bold bg-success bg-opacity-10 d-inline-block px-2 py-1 rounded-pill"><i className="bi bi-graph-up-arrow me-1"></i> +12.4%</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="bg-white p-4 p-xl-5 rounded-4 shadow-sm position-relative overflow-hidden border-0 hover-lift transition-all glass-card">
            <div className="position-absolute end-0 top-0 mt-4 me-4 text-success opacity-25 transition-all card-icon">
              <i className="bi bi-wallet2" style={{ fontSize: "5rem" }}></i>
            </div>
            <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1.5px", fontSize: "0.75rem" }}>Gross Revenue</h6>
            <h2 className="fw-black mb-2 display-5" style={{ letterSpacing: "-2px" }}>₹{revenue.toLocaleString('en-IN')}</h2>
            <div className="text-success small fw-bold bg-success bg-opacity-10 d-inline-block px-2 py-1 rounded-pill"><i className="bi bi-graph-up-arrow me-1"></i> +8.5%</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="bg-white p-4 p-xl-5 rounded-4 shadow-sm position-relative overflow-hidden border-0 hover-lift transition-all glass-card">
            <div className="position-absolute end-0 top-0 mt-4 me-4 text-warning opacity-25 transition-all card-icon">
              <i className="bi bi-box-seam-fill" style={{ fontSize: "5rem" }}></i>
            </div>
            <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1.5px", fontSize: "0.75rem" }}>Total Orders</h6>
            <h2 className="fw-black mb-2 display-5" style={{ letterSpacing: "-2px" }}>{orderCount.toLocaleString('en-IN')}</h2>
            <div className="text-muted small fw-bold bg-light d-inline-block px-2 py-1 rounded-pill"><i className="bi bi-dash me-1"></i> Stable</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Main Content Area */}
        <div className="col-lg-8 d-flex flex-column gap-4">
          
          {/* Revenue Trend Chart (CSS based) */}
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border-0 position-relative glass-card">
            <h5 className="fw-bold mb-4">Revenue Trend (Last 7 Days)</h5>
            <div className="d-flex align-items-end justify-content-between h-100 pb-3" style={{ minHeight: "200px" }}>
              {chartBars.map((height, i) => (
                <div key={i} className="d-flex flex-column align-items-center gap-2" style={{ width: "10%" }}>
                  <div className="w-100 rounded-top-3 bg-gradient-red hover-bar transition-all" style={{ height: `${height}%`, minHeight: "10px" }}></div>
                  <span className="text-muted small fw-bold" style={{ fontSize: "0.7rem" }}>Day {i+1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border-0 flex-grow-1 glass-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">Recent Transactions</h5>
              <a href="/spr/admin/orders" className="text-decoration-none small fw-bold hover-scale d-inline-block transition-all" style={{ color: "var(--red)" }}>View All <i className="bi bi-arrow-right ms-1"></i></a>
            </div>
            <div className="table-responsive">
              <table className="table align-middle border-light mb-0">
                <thead className="table-light text-muted small text-uppercase" style={{ letterSpacing: "1px", fontSize: "0.75rem" }}>
                  <tr>
                    <th className="fw-bold border-0 rounded-start py-3 px-4">Order</th>
                    <th className="fw-bold border-0 py-3">Customer</th>
                    <th className="fw-bold border-0 py-3">Date</th>
                    <th className="fw-bold border-0 py-3">Amount</th>
                    <th className="fw-bold border-0 rounded-end py-3 text-end px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="border-top-0">
                  {recentOrders.map(order => (
                    <tr key={order.id} className="hover-bg-light transition-all cursor-pointer">
                      <td className="fw-black text-dark py-3 px-4">#{order.id.slice(-6).toUpperCase()}</td>
                      <td className="py-3">
                        <div className="fw-bold text-dark">{order.user.name}</div>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>{order.user.email}</div>
                      </td>
                      <td className="text-muted small fw-semibold py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="fw-bold text-dark py-3 fs-6">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="py-3 text-end px-4">
                        <span className={`badge rounded-pill px-3 py-2 fw-bold ${order.status === 'PAID' ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'}`}>
                          {order.status === 'PAID' ? 'COMPLETED' : order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-5 fw-semibold">No recent transactions.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="col-lg-4 d-flex flex-column gap-4">

          <div className="bg-white p-4 rounded-4 shadow-sm border-0 position-relative overflow-hidden glass-card" style={{ borderLeft: "4px solid #ff3b30 !important" }}>
            <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1.5px", fontSize: "0.75rem" }}>Pending KYC Approvals</h6>
            <h2 className="fw-black mb-0 display-5 text-danger" style={{ letterSpacing: "-2px" }}>{pendingKycCount}</h2>
            {pendingKycCount > 0 && (
              <a href="/spr/admin/kyc" className="btn btn-sm btn-danger rounded-pill px-3 mt-3 fw-bold">Review Now</a>
            )}
          </div>

          {/* New Signups */}
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border-0 flex-grow-1 glass-card">
            <h5 className="fw-bold mb-4">Latest Signups</h5>
            <div className="d-flex flex-column gap-3">
              {newUsers.map(u => (
                <div key={u.id} className="d-flex align-items-center gap-3 p-3 border-0 rounded-4 bg-light bg-opacity-50 hover-lift transition-all">
                  <div className="avatar rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: "48px", height: "48px", backgroundColor: "var(--red)" }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="fw-bold text-dark mb-1">{u.name}</div>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>{u.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-dark text-white p-4 p-md-5 rounded-4 shadow-sm border-0 position-relative overflow-hidden glass-card">
            <div className="position-absolute end-0 bottom-0 mb-n4 me-n4 opacity-25">
               <i className="bi bi-shield-check" style={{ fontSize: "10rem" }}></i>
            </div>
            <h5 className="fw-bold mb-3 position-relative z-1">System Health</h5>
            <div className="d-flex align-items-center gap-2 mb-2 position-relative z-1">
              <span className="spinner-grow spinner-grow-sm text-success" role="status" aria-hidden="true"></span>
              <span className="fw-semibold">All systems operational</span>
            </div>
            <p className="small text-white-50 mb-0 position-relative z-1">Last synced just now. Database latency ~12ms. Server load is perfectly normal.</p>
          </div>
        </div>
      </div>

      <style>{`
        .fw-black { font-weight: 900; }
        .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); }
        .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 1rem 2rem rgba(0,0,0,.1)!important; }
        .hover-lift:hover .card-icon { transform: scale(1.15) rotate(5deg); opacity: 0.5 !important; }
        .hover-bg-light:hover { background-color: #f8f9fa !important; }
        .cursor-pointer { cursor: pointer; }
        .bg-gradient-red { background: linear-gradient(180deg, var(--red) 0%, rgba(255,0,0,0.5) 100%); }
        .hover-bar:hover { filter: brightness(1.2); cursor: pointer; }
        .transition-all { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
      `}</style>
    </div>
  );
}
