import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import SuperadminReportBtn from "./SuperadminReportBtn";
import Link from "next/link";

export default async function AdminDashboard() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  // ── Core metrics ──
  const [userCount, orderCount, totalRevenue, recentOrders, newUsers, pendingKycCount] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { totalAmount: true } }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { user: true }
    }),
    prisma.user.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
    prisma.seller.count({ where: { kycStatus: "PENDING" } })
  ]);

  const revenue = totalRevenue._sum.totalAmount || 0;

  // ── Real growth: today vs yesterday ──
  const [todayRevenue, yesterdayRevenue, todayUsers, yesterdayUsers, todayOrders, yesterdayOrders] = await Promise.all([
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: todayStart } } }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: yesterdayStart, lt: todayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } }),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } }),
  ]);

  const calcGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const revenueGrowth = calcGrowth(todayRevenue._sum.totalAmount || 0, yesterdayRevenue._sum.totalAmount || 0);
  const userGrowth = calcGrowth(todayUsers, yesterdayUsers);
  const orderGrowth = calcGrowth(todayOrders, yesterdayOrders);

  // ── Real 7-day revenue chart ──
  const last7DaysRevenue: { label: string; rev: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(todayStart);
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayRevAgg = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { createdAt: { gte: dayStart, lt: dayEnd } }
    });

    last7DaysRevenue.push({
      label: dayStart.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
      rev: dayRevAgg._sum.totalAmount || 0
    });
  }
  const maxWeeklyRev = Math.max(...last7DaysRevenue.map(d => d.rev), 1);

  // ── Orders by status ──
  const allOrders = await prisma.order.groupBy({
    by: ["status"],
    _count: { status: true }
  });
  const statusMap: Record<string, { count: number; color: string }> = {
    PENDING: { count: 0, color: "#ff9500" },
    PROCESSING: { count: 0, color: "#007aff" },
    SHIPPED: { count: 0, color: "#5856d6" },
    DELIVERED: { count: 0, color: "#34c759" },
    CANCELLED: { count: 0, color: "#ff3b30" },
    AT_HUB: { count: 0, color: "#af52de" },
    IN_TRANSIT_TO_HUB: { count: 0, color: "#00c7be" },
  };
  allOrders.forEach(o => {
    if (statusMap[o.status]) statusMap[o.status].count = o._count.status;
    else statusMap[o.status] = { count: o._count.status, color: "#999" };
  });
  const statusEntries = Object.entries(statusMap).filter(([, v]) => v.count > 0).sort((a, b) => b[1].count - a[1].count);


  // Get seller revenue manually
  const sellerRevenueMap: Record<string, { revenue: number; orderCount: number }> = {};
  const allSellerOrders = await prisma.sellerOrder.findMany({
    include: { items: true, seller: { include: { user: { select: { name: true } } } } }
  });
  allSellerOrders.forEach(so => {
    if (!sellerRevenueMap[so.sellerId]) sellerRevenueMap[so.sellerId] = { revenue: 0, orderCount: 0 };
    sellerRevenueMap[so.sellerId].orderCount++;
    so.items.forEach(item => {
      sellerRevenueMap[so.sellerId].revenue += item.priceAtBuy * item.quantity;
    });
  });

  const sellerInfoMap: Record<string, string> = {};
  const sellers = await prisma.seller.findMany({ select: { id: true, companyName: true } });
  sellers.forEach(s => { sellerInfoMap[s.id] = s.companyName; });

  const topSellerList = Object.entries(sellerRevenueMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([sellerId, data]) => ({
      name: sellerInfoMap[sellerId] || "Unknown",
      revenue: data.revenue,
      orders: data.orderCount
    }));

  const growthBadge = (growth: number) => {
    if (growth > 0) return { cls: "text-success bg-success bg-opacity-10", icon: "bi-graph-up-arrow", text: `+${growth}%` };
    if (growth < 0) return { cls: "text-danger bg-danger bg-opacity-10", icon: "bi-graph-down-arrow", text: `${growth}%` };
    return { cls: "text-muted bg-light", icon: "bi-dash", text: "Stable" };
  };

  const revBadge = growthBadge(revenueGrowth);
  const userBadge = growthBadge(userGrowth);
  const orderBadge = growthBadge(orderGrowth);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-1px" }}>Executive Dashboard</h2>
          <p className="text-muted mb-0">Live marketplace performance metrics — updated in real-time.</p>
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
            <div className={`small fw-bold ${userBadge.cls} d-inline-block px-2 py-1 rounded-pill`}>
              <i className={`bi ${userBadge.icon} me-1`}></i> {userBadge.text}
              <span className="text-muted ms-1 fw-normal" style={{ fontSize: "0.65rem" }}>vs yesterday</span>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="bg-white p-4 p-xl-5 rounded-4 shadow-sm position-relative overflow-hidden border-0 hover-lift transition-all glass-card">
            <div className="position-absolute end-0 top-0 mt-4 me-4 text-success opacity-25 transition-all card-icon">
              <i className="bi bi-wallet2" style={{ fontSize: "5rem" }}></i>
            </div>
            <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1.5px", fontSize: "0.75rem" }}>Gross Revenue</h6>
            <h2 className="fw-black mb-2 display-5" style={{ letterSpacing: "-2px" }}>₹{revenue.toLocaleString('en-IN')}</h2>
            <div className={`small fw-bold ${revBadge.cls} d-inline-block px-2 py-1 rounded-pill`}>
              <i className={`bi ${revBadge.icon} me-1`}></i> {revBadge.text}
              <span className="text-muted ms-1 fw-normal" style={{ fontSize: "0.65rem" }}>vs yesterday</span>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="bg-white p-4 p-xl-5 rounded-4 shadow-sm position-relative overflow-hidden border-0 hover-lift transition-all glass-card">
            <div className="position-absolute end-0 top-0 mt-4 me-4 text-warning opacity-25 transition-all card-icon">
              <i className="bi bi-box-seam-fill" style={{ fontSize: "5rem" }}></i>
            </div>
            <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1.5px", fontSize: "0.75rem" }}>Total Orders</h6>
            <h2 className="fw-black mb-2 display-5" style={{ letterSpacing: "-2px" }}>{orderCount.toLocaleString('en-IN')}</h2>
            <div className={`small fw-bold ${orderBadge.cls} d-inline-block px-2 py-1 rounded-pill`}>
              <i className={`bi ${orderBadge.icon} me-1`}></i> {orderBadge.text}
              <span className="text-muted ms-1 fw-normal" style={{ fontSize: "0.65rem" }}>vs yesterday</span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Main Content Area */}
        <div className="col-lg-8 d-flex flex-column gap-4">
          
          {/* Real Revenue Trend Chart */}
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border-0 position-relative glass-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">Revenue Trend (Last 7 Days)</h5>
              <span className="text-muted small fw-semibold">₹{(todayRevenue._sum.totalAmount || 0).toLocaleString("en-IN")} today</span>
            </div>
            <div className="d-flex align-items-end justify-content-between h-100 pb-3" style={{ minHeight: "220px" }}>
              {last7DaysRevenue.map((d, i) => (
                <div key={i} className="d-flex flex-column align-items-center gap-2" style={{ width: "12%" }}>
                  <div className="text-muted small fw-bold" style={{ fontSize: "0.68rem" }}>
                    {d.rev > 0 ? `₹${d.rev >= 1000 ? `${(d.rev / 1000).toFixed(1)}k` : d.rev}` : "—"}
                  </div>
                  <div
                    className="w-100 rounded-top-3 hover-bar transition-all"
                    style={{
                      height: `${Math.max(6, (d.rev / maxWeeklyRev) * 100)}%`,
                      background: d.rev > 0
                        ? "linear-gradient(180deg, var(--red) 0%, rgba(232,71,42,0.35) 100%)"
                        : "rgba(0,0,0,0.04)",
                      minHeight: 6,
                    }}
                  ></div>
                  <span className="text-muted small fw-semibold" style={{ fontSize: "0.68rem" }}>{d.label}</span>
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
                        <span className={`badge rounded-pill px-3 py-2 fw-bold ${
                          order.status === 'DELIVERED' ? 'bg-success bg-opacity-10 text-success' :
                          order.status === 'CANCELLED' ? 'bg-danger bg-opacity-10 text-danger' :
                          order.status === 'SHIPPED' ? 'bg-primary bg-opacity-10 text-primary' :
                          'bg-warning bg-opacity-10 text-warning'
                        }`}>
                          {order.status}
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

          {/* Orders by Status */}
          <div className="bg-white p-4 rounded-4 shadow-sm border-0 glass-card">
            <h6 className="fw-bold mb-3 text-dark"><i className="bi bi-pie-chart-fill me-2 text-danger"></i>Orders by Status</h6>
            {statusEntries.length === 0 ? (
              <div className="text-muted text-center py-3 small">No orders yet.</div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {statusEntries.map(([status, data]) => {
                  const pct = Math.round((data.count / orderCount) * 100);
                  return (
                    <div key={status}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small fw-bold" style={{ color: data.color }}>{status.replace(/_/g, " ")}</span>
                        <span className="text-muted small fw-semibold">{data.count} ({pct}%)</span>
                      </div>
                      <div className="rounded-pill" style={{ height: 7, background: "#f0f0f0" }}>
                        <div className="rounded-pill transition-all" style={{ height: "100%", width: `${pct}%`, background: data.color }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Sellers Leaderboard */}
          <div className="bg-white p-4 rounded-4 shadow-sm border-0 glass-card">
            <h6 className="fw-bold mb-3 text-dark"><i className="bi bi-trophy-fill me-2 text-warning"></i>Top Sellers</h6>
            {topSellerList.length === 0 ? (
              <div className="text-muted text-center py-3 small">No seller data yet.</div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {topSellerList.map((s, i) => (
                  <div key={i} className="d-flex align-items-center gap-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0 shadow-sm" style={{
                      width: 36, height: 36,
                      background: i === 0 ? "linear-gradient(135deg, #FFD700, #FFA500)" : i === 1 ? "linear-gradient(135deg, #C0C0C0, #A0A0A0)" : i === 2 ? "linear-gradient(135deg, #CD7F32, #A0522D)" : "#f0f0f0",
                      color: i < 3 ? "#fff" : "#666",
                      fontSize: "0.8rem"
                    }}>
                      #{i + 1}
                    </div>
                    <div className="flex-grow-1 min-width-0">
                      <div className="fw-bold text-dark text-truncate" style={{ fontSize: "0.85rem" }}>{s.name}</div>
                      <div className="text-muted" style={{ fontSize: "0.7rem" }}>{s.orders} orders</div>
                    </div>
                    <div className="fw-bold text-dark flex-shrink-0" style={{ fontSize: "0.85rem" }}>₹{s.revenue.toLocaleString("en-IN")}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Latest Signups */}
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
            <p className="small text-white-50 mb-0 position-relative z-1">PostgreSQL via Supabase. Next.js 16 App Router. Prisma ORM.</p>
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
        .hover-bar:hover { filter: brightness(1.2); cursor: pointer; }
        .transition-all { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
      `}
      </style>
    </div>
  );
}
