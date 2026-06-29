import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import SellerReportBtn from "./SellerReportBtn";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=80&q=60";

function statusColor(s: string) {
  const map: Record<string, string> = {
    PENDING: "#ff9500", PROCESSING: "#007aff",
    SHIPPED: "#5856d6", DELIVERED: "#34c759",
    CANCELLED: "#ff3b30", RETURNED: "#af52de",
  };
  return map[s] || "#999";
}

const getSellerStats = unstable_cache(
  async (sellerId: string) => {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);

    // Products with variants + inventory
    const products = await prisma.product.findMany({
      where: { sellerId },
      include: { category: true, variants: { include: { inventory: true } } }
    });

    // Fetch SellerOrders for this seller
    const sellerOrders = await prisma.sellerOrder.findMany({
      where: { sellerId },
      include: {
        order: { include: { user: { select: { id: true, name: true, email: true } } } },
        items: {
          include: { variant: { include: { product: { select: { title: true, images: true, categoryId: true } } } } }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const totalProducts = products.length;
    const publishedProducts = products.filter(p => p.isPublished).length;
    const totalOrders = sellerOrders.length;
    
    let totalRevenue = 0;
    let deliveredRevenue = 0;
    const lowStockItems: { title: string; sku: string; stock: number }[] = [];
    const statusCounts: Record<string, number> = {};
    const productRevMap: Record<string, { title: string; image: string; revenue: number; qty: number }> = {};
    const catRevMap: Record<string, number> = {};
    const last7: Record<string, number> = {};
    const last30: Record<string, number> = {};
    const monthly: Record<string, number> = {};
    
    // Build 7-day keys
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      last7[d.toDateString()] = 0;
    }

    // Build 30-day keys
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      last30[d.toDateString()] = 0;
    }

    // Build 6-month keys
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      monthly[key] = 0;
    }

    // Low stock
    products.forEach(p => p.variants.forEach(v => {
      const stock = v.inventory.reduce((a, inv) => a + inv.quantity, 0);
      if (stock < 10) lowStockItems.push({ title: p.title, sku: v.sku, stock });
    }));
    lowStockItems.sort((a, b) => a.stock - b.stock);

    // Customer tracking for repeat buyer analysis
    const customerOrderMap: Record<string, { name: string; email: string; orderCount: number; totalSpent: number }> = {};

    // This week and last week revenue for growth calc
    const thisWeekStart = new Date(todayStart);
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay()); // Start of this week (Sunday)
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    let thisWeekRev = 0;
    let lastWeekRev = 0;
    let deliveredCount = 0;

    sellerOrders.forEach(so => {
      statusCounts[so.status] = (statusCounts[so.status] || 0) + 1;
      if (so.status === "DELIVERED") deliveredCount++;
      const orderDate = new Date(so.createdAt);
      const orderDateStr = orderDate.toDateString();

      // Monthly key
      const monthKey = orderDate.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

      // Track customer
      const customerId = so.order.user.id;
      if (!customerOrderMap[customerId]) {
        customerOrderMap[customerId] = { name: so.order.user.name, email: so.order.user.email, orderCount: 0, totalSpent: 0 };
      }
      customerOrderMap[customerId].orderCount++;

      so.items.forEach(i => {
        const rev = i.quantity * i.priceAtBuy;
        totalRevenue += rev;
        if (so.status === "DELIVERED") deliveredRevenue += rev;

        if (orderDateStr in last7) last7[orderDateStr] += rev;
        if (orderDateStr in last30) last30[orderDateStr] += rev;
        if (monthKey in monthly) monthly[monthKey] += rev;

        // Week-over-week
        if (orderDate >= thisWeekStart) thisWeekRev += rev;
        else if (orderDate >= lastWeekStart && orderDate < thisWeekStart) lastWeekRev += rev;

        customerOrderMap[customerId].totalSpent += rev;

        const pid = i.variant.productId || i.id;
        const key = i.variant.product?.title || pid;
        if (!productRevMap[key]) {
          const img = i.variant.product?.images?.[0]?.startsWith("http")
            ? i.variant.product.images[0] : FALLBACK_IMG;
          productRevMap[key] = { title: key, image: img, revenue: 0, qty: 0 };
        }
        productRevMap[key].revenue += rev;
        productRevMap[key].qty += i.quantity;

        const cat = products.find(p => p.variants.some(v => v.id === i.variantId))?.category?.name || "Other";
        catRevMap[cat] = (catRevMap[cat] || 0) + rev;
      });
    });

    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const conversionRate = totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 0;
    
    const repeatCustomers = Object.values(customerOrderMap).filter(c => c.orderCount > 1);
    const topBuyers = Object.values(customerOrderMap)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5);
    
    const weekGrowth = lastWeekRev === 0
      ? (thisWeekRev > 0 ? 100 : 0)
      : Math.round(((thisWeekRev - lastWeekRev) / lastWeekRev) * 100);

    const topProducts = Object.values(productRevMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const catRevList = Object.entries(catRevMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
      
    const weeklyData = Object.entries(last7).map(([date, rev]) => ({
      label: new Date(date).toLocaleDateString("en-IN", { weekday: "short" }),
      rev
    }));

    const monthlyData = Object.entries(monthly).map(([label, rev]) => ({ label, rev }));

    // For recent items
    const recentItems: any[] = [];
    sellerOrders.slice(0, 8).forEach(so => {
      so.items.forEach(i => {
        recentItems.push({ ...i, order: so.order, sellerOrderStatus: so.status, createdAt: so.createdAt });
      });
    });

    return {
      totalProducts, publishedProducts, totalOrders, totalRevenue, avgOrderValue, deliveredRevenue,
      lowStockItems, statusCounts, topProducts, catRevList, weeklyData, recentItems: recentItems.slice(0, 8),
      // NEW analytics
      conversionRate,
      repeatCustomerCount: repeatCustomers.length,
      totalCustomers: Object.keys(customerOrderMap).length,
      weekGrowth,
      thisWeekRev,
      lastWeekRev,
      monthlyData,
      topBuyers,
      deliveredCount,
    };
  },
  ["seller-dashboard-stats-v3"],
  { tags: ["seller-dashboard"], revalidate: 3600 }
);

export default async function SellerDashboard() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) redirect("/sell");

  const stats = await getSellerStats(seller.id);

  const maxWeekly = Math.max(...stats.weeklyData.map(d => d.rev), 1);
  const maxCatRev = stats.catRevList[0]?.[1] || 1;
  const maxMonthly = Math.max(...stats.monthlyData.map(d => d.rev), 1);

  const growthBadge = (growth: number) => {
    if (growth > 0) return { cls: "text-success", bg: "#34c75918", icon: "bi-graph-up-arrow", text: `+${growth}%` };
    if (growth < 0) return { cls: "text-danger", bg: "#ff3b3018", icon: "bi-graph-down-arrow", text: `${growth}%` };
    return { cls: "text-muted", bg: "rgba(255,255,255,0.06)", icon: "bi-dash", text: "—" };
  };
  const wg = growthBadge(stats.weekGrowth);

  return (
    <div style={{ color: "#fff" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-5 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1" style={{ letterSpacing: "-1px", fontSize: "1.75rem" }}>
            <i className="bi bi-grid-1x2-fill me-3 text-danger"></i>Vendor Dashboard
          </h2>
          <p className="text-muted mb-0 small">Welcome back, <strong className="text-white">{seller.companyName}</strong> — here&apos;s your store at a glance.</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <SellerReportBtn stats={stats} sellerName={seller.companyName} />
          <Link href="/seller/products" className="btn btn-danger rounded-pill px-4 fw-bold shadow-sm">
            <i className="bi bi-plus-lg me-1"></i>Add Product
          </Link>
          <Link href="/seller/orders" className="btn rounded-pill px-4 fw-semibold glass-panel text-white">
            <i className="bi bi-truck me-1"></i>Orders
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`, sub: `₹${stats.deliveredRevenue.toLocaleString("en-IN")} confirmed`, icon: "bi-cash-stack", color: "#34c759" },
          { label: "Total Orders", value: stats.totalOrders, sub: `${stats.deliveredCount} delivered`, icon: "bi-cart-check", color: "#007aff" },
          { label: "Avg. Order Value", value: `₹${stats.avgOrderValue.toLocaleString("en-IN")}`, sub: "Per transaction", icon: "bi-bag-check", color: "#ff9500" },
          { label: "Products", value: stats.totalProducts, sub: `${stats.publishedProducts} published`, icon: "bi-box-seam", color: "#5856d6" },
        ].map((card, i) => (
          <div key={i} className="col-6 col-lg-3">
            <div className="rounded-4 p-4 h-100 position-relative overflow-hidden glass-panel">
              <div className="position-absolute" style={{ bottom: -12, right: -8, fontSize: "5rem", opacity: 0.06, color: card.color }}>
                <i className={`bi ${card.icon}`}></i>
              </div>
              <div className="rounded-3 d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 40, height: 40, background: `${card.color}18`, color: card.color, fontSize: "1.1rem" }}>
                <i className={`bi ${card.icon}`}></i>
              </div>
              <div className="text-muted small text-uppercase fw-bold mb-1" style={{ letterSpacing: "1px", fontSize: ".65rem" }}>{card.label}</div>
              <div className="fw-bold text-white" style={{ fontSize: "1.6rem", lineHeight: 1.1 }}>{card.value}</div>
              <div className="text-muted mt-1" style={{ fontSize: ".72rem" }}>{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* NEW: Performance KPI Row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="rounded-4 p-3 p-lg-4 glass-panel h-100">
            <div className="d-flex align-items-center gap-2 mb-2">
              <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "1.2rem" }}></i>
              <span className="text-muted small text-uppercase fw-bold" style={{ fontSize: ".6rem", letterSpacing: "1px" }}>Conversion Rate</span>
            </div>
            <div className="fw-bold text-white" style={{ fontSize: "1.8rem", lineHeight: 1 }}>{stats.conversionRate}%</div>
            <div className="text-muted mt-1" style={{ fontSize: ".68rem" }}>Orders delivered / total</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="rounded-4 p-3 p-lg-4 glass-panel h-100">
            <div className="d-flex align-items-center gap-2 mb-2">
              <i className="bi bi-arrow-repeat text-primary" style={{ fontSize: "1.2rem" }}></i>
              <span className="text-muted small text-uppercase fw-bold" style={{ fontSize: ".6rem", letterSpacing: "1px" }}>Repeat Customers</span>
            </div>
            <div className="fw-bold text-white" style={{ fontSize: "1.8rem", lineHeight: 1 }}>{stats.repeatCustomerCount}</div>
            <div className="text-muted mt-1" style={{ fontSize: ".68rem" }}>of {stats.totalCustomers} total customers</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="rounded-4 p-3 p-lg-4 glass-panel h-100">
            <div className="d-flex align-items-center gap-2 mb-2">
              <i className={`bi ${wg.icon}`} style={{ fontSize: "1.2rem", color: stats.weekGrowth >= 0 ? "#34c759" : "#ff3b30" }}></i>
              <span className="text-muted small text-uppercase fw-bold" style={{ fontSize: ".6rem", letterSpacing: "1px" }}>Week Growth</span>
            </div>
            <div className="fw-bold" style={{ fontSize: "1.8rem", lineHeight: 1, color: stats.weekGrowth >= 0 ? "#34c759" : "#ff3b30" }}>{wg.text}</div>
            <div className="text-muted mt-1" style={{ fontSize: ".68rem" }}>₹{stats.thisWeekRev.toLocaleString("en-IN")} vs ₹{stats.lastWeekRev.toLocaleString("en-IN")}</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="rounded-4 p-3 p-lg-4 glass-panel h-100">
            <div className="d-flex align-items-center gap-2 mb-2">
              <i className="bi bi-people-fill text-warning" style={{ fontSize: "1.2rem" }}></i>
              <span className="text-muted small text-uppercase fw-bold" style={{ fontSize: ".6rem", letterSpacing: "1px" }}>Total Customers</span>
            </div>
            <div className="fw-bold text-white" style={{ fontSize: "1.8rem", lineHeight: 1 }}>{stats.totalCustomers}</div>
            <div className="text-muted mt-1" style={{ fontSize: ".68rem" }}>Unique buyers</div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Weekly Revenue Chart */}
        <div className="col-lg-8">
          <div className="rounded-4 p-4 h-100 glass-panel">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h6 className="fw-bold text-white mb-0"><i className="bi bi-graph-up text-danger me-2"></i>Daily Revenue — Last 7 Days</h6>
              <span className="text-muted small">₹{stats.totalRevenue.toLocaleString("en-IN")} total</span>
            </div>
            <div className="d-flex align-items-end gap-2" style={{ height: 200 }}>
              {stats.weeklyData.map((d, i) => (
                <div key={i} className="d-flex flex-column align-items-center gap-1 flex-grow-1">
                  <div className="text-muted small" style={{ fontSize: ".65rem" }}>
                    {d.rev > 0 ? `₹${Math.round(d.rev / 1000)}k` : ""}
                  </div>
                  <div
                    className="w-100 rounded-top-3"
                    style={{
                      height: `${Math.max(4, (d.rev / maxWeekly) * 100)}%`,
                      background: d.rev > 0
                        ? "linear-gradient(180deg, #e8472a 0%, rgba(232,71,42,0.3) 100%)"
                        : "rgba(255,255,255,0.05)",
                      transition: "height .3s ease",
                      minHeight: 4,
                    }}
                  ></div>
                  <span className="text-muted" style={{ fontSize: ".65rem" }}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="col-lg-4">
          <div className="rounded-4 p-4 h-100 glass-panel">
            <h6 className="fw-bold text-white mb-4"><i className="bi bi-pie-chart text-danger me-2"></i>Orders by Status</h6>
            {Object.entries(stats.statusCounts).length === 0 ? (
              <div className="text-center text-muted py-4 small">No orders yet</div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {Object.entries(stats.statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                  const pct = Math.round((count / stats.totalOrders) * 100);
                  const color = statusColor(status);
                  return (
                    <div key={status}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small fw-semibold" style={{ color, fontSize: ".78rem" }}>{status}</span>
                        <span className="text-muted small" style={{ fontSize: ".72rem" }}>{count} ({pct}%)</span>
                      </div>
                      <div className="rounded-pill" style={{ height: 6, background: "rgba(255,255,255,0.06)" }}>
                        <div className="rounded-pill" style={{ height: "100%", width: `${pct}%`, background: color, transition: "width .5s ease" }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Low stock below */}
            {stats.lowStockItems.length > 0 && (
              <>
                <hr style={{ borderColor: "rgba(255,255,255,0.08)", margin: "20px 0" }} />
                <h6 className="fw-bold text-white mb-3" style={{ fontSize: ".85rem" }}><i className="bi bi-exclamation-triangle text-warning me-2"></i>Low Stock Alerts</h6>
                <div className="d-flex flex-column gap-2" style={{ maxHeight: 160, overflowY: "auto" }}>
                  {stats.lowStockItems.slice(0, 6).map((item, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center">
                      <div className="text-muted small text-truncate" style={{ fontSize: ".72rem", maxWidth: "75%" }}>{item.title}</div>
                      <span className={`badge rounded-pill ${item.stock === 0 ? "bg-danger" : "bg-warning text-dark"}`} style={{ fontSize: ".65rem" }}>
                        {item.stock === 0 ? "Out" : `${item.stock} left`}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* NEW: Monthly Revenue Trend */}
      <div className="row g-4 mb-4">
        <div className="col-lg-7">
          <div className="rounded-4 p-4 h-100 glass-panel">
            <h6 className="fw-bold text-white mb-4"><i className="bi bi-calendar3 text-danger me-2"></i>Monthly Revenue Trend (6 Months)</h6>
            <div className="d-flex align-items-end gap-3" style={{ height: 180 }}>
              {stats.monthlyData.map((d, i) => (
                <div key={i} className="d-flex flex-column align-items-center gap-1 flex-grow-1">
                  <div className="text-muted small fw-bold" style={{ fontSize: ".63rem" }}>
                    {d.rev > 0 ? `₹${d.rev >= 1000 ? `${(d.rev / 1000).toFixed(1)}k` : d.rev}` : ""}
                  </div>
                  <div
                    className="w-100 rounded-top-3"
                    style={{
                      height: `${Math.max(4, (d.rev / maxMonthly) * 100)}%`,
                      background: d.rev > 0
                        ? "linear-gradient(180deg, #007aff 0%, rgba(0,122,255,0.25) 100%)"
                        : "rgba(255,255,255,0.05)",
                      transition: "height .4s ease",
                      minHeight: 4,
                    }}
                  ></div>
                  <span className="text-muted fw-semibold" style={{ fontSize: ".65rem" }}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Insights */}
        <div className="col-lg-5">
          <div className="rounded-4 p-4 h-100 glass-panel">
            <h6 className="fw-bold text-white mb-4"><i className="bi bi-person-hearts text-danger me-2"></i>Top Repeat Buyers</h6>
            {stats.topBuyers.length === 0 ? (
              <div className="text-center text-muted py-4 small">No customer data yet</div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {stats.topBuyers.map((buyer, i) => (
                  <div key={i} className="d-flex align-items-center gap-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0" style={{
                      width: 36, height: 36,
                      background: i === 0 ? "linear-gradient(135deg, #FFD700, #FFA500)" : "rgba(255,255,255,0.08)",
                      color: i === 0 ? "#000" : "#fff",
                      fontSize: "0.75rem"
                    }}>
                      #{i + 1}
                    </div>
                    <div className="flex-grow-1 min-width-0">
                      <div className="text-white fw-semibold text-truncate" style={{ fontSize: ".82rem" }}>{buyer.name}</div>
                      <div className="text-muted" style={{ fontSize: ".68rem" }}>{buyer.email}</div>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <div className="text-white fw-bold" style={{ fontSize: ".82rem" }}>{buyer.orderCount} orders</div>
                      <div className="text-muted" style={{ fontSize: ".65rem" }}>₹{buyer.totalSpent.toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Top Products */}
        <div className="col-lg-5">
          <div className="rounded-4 p-4 h-100 glass-panel">
            <h6 className="fw-bold text-white mb-4"><i className="bi bi-trophy text-danger me-2"></i>Top Selling Products</h6>
            {stats.topProducts.length === 0 ? (
              <div className="text-center text-muted py-4 small">No sales data yet</div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {stats.topProducts.map((p, i) => (
                  <div key={i} className="d-flex align-items-center gap-3">
                    <span className="fw-bold text-muted" style={{ fontSize: ".8rem", width: 18 }}>#{i + 1}</span>
                    <div className="rounded-2 overflow-hidden flex-shrink-0 position-relative" style={{ width: 40, height: 40, background: "#1a1a1a" }}>
                      <Image src={p.image} alt={p.title} fill unoptimized style={{ objectFit: "cover" }} />
                    </div>
                    <div className="flex-grow-1 min-width-0">
                      <div className="text-white fw-semibold text-truncate" style={{ fontSize: ".82rem" }}>{p.title}</div>
                      <div className="text-muted" style={{ fontSize: ".7rem" }}>{p.qty} units sold</div>
                    </div>
                    <div className="text-white fw-bold flex-shrink-0" style={{ fontSize: ".85rem" }}>₹{p.revenue.toLocaleString("en-IN")}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Revenue by Category */}
        <div className="col-lg-7">
          <div className="rounded-4 p-4 h-100 glass-panel">
            <h6 className="fw-bold text-white mb-4"><i className="bi bi-tags text-danger me-2"></i>Revenue by Category</h6>
            {stats.catRevList.length === 0 ? (
              <div className="text-center text-muted py-4 small">No category data yet</div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {stats.catRevList.map(([cat, rev], i) => {
                  const pct = Math.round((rev / maxCatRev) * 100);
                  const colors = ["#e8472a", "#007aff", "#34c759", "#ff9500", "#5856d6", "#af52de"];
                  const color = colors[i % colors.length];
                  return (
                    <div key={cat}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small fw-semibold text-white" style={{ fontSize: ".8rem" }}>{cat}</span>
                        <span className="text-muted small" style={{ fontSize: ".72rem" }}>₹{rev.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="rounded-pill" style={{ height: 8, background: "rgba(255,255,255,0.06)" }}>
                        <div className="rounded-pill" style={{ height: "100%", width: `${pct}%`, background: color, transition: "width .5s ease" }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-4 p-4 glass-panel">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <h6 className="fw-bold text-white mb-0"><i className="bi bi-receipt text-danger me-2"></i>Recent Transactions</h6>
          <Link href="/seller/orders" className="text-danger text-decoration-none small fw-semibold">
            View all <i className="bi bi-arrow-right ms-1"></i>
          </Link>
        </div>
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0" style={{ "--bs-table-bg": "transparent", "--bs-table-hover-bg": "rgba(255,255,255,0.04)" } as any}>
            <thead style={{ fontSize: ".65rem", letterSpacing: "1px", color: "rgba(255,255,255,0.4)" }}>
              <tr>
                <th className="border-0 text-uppercase fw-bold">Order</th>
                <th className="border-0 text-uppercase fw-bold">Product</th>
                <th className="border-0 text-uppercase fw-bold">Customer</th>
                <th className="border-0 text-uppercase fw-bold">Amount</th>
                <th className="border-0 text-uppercase fw-bold text-end">Status</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: ".8rem" }}>
              {stats.recentItems.map(item => {
                const color = statusColor(item.sellerOrderStatus);
                return (
                  <tr key={item.id} style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <td className="py-3">
                      <span className="fw-bold font-monospace text-white" style={{ fontSize: ".8rem" }}>
                        #{item.order.id.slice(-8).toUpperCase()}
                      </span>
                      <div className="text-muted mt-1" style={{ fontSize: ".65rem" }}>
                        {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </div>
                    </td>
                    <td className="py-3 text-white">{item.variant.product?.title || "—"}</td>
                    <td className="py-3 text-muted">{item.order.user.name}</td>
                    <td className="py-3 text-white fw-bold">₹{(item.quantity * item.priceAtBuy).toLocaleString("en-IN")}</td>
                    <td className="py-3 text-end">
                      <span className="badge rounded-pill fw-semibold" style={{ fontSize: ".65rem", padding: "4px 10px", background: `${color}18`, color, border: `1px solid ${color}40` }}>
                        {item.sellerOrderStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {stats.recentItems.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted py-5 small">No transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
