import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SellerDashboard() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const seller = await prisma.seller.findUnique({
    where: { userId }
  });

  if (!seller) {
    redirect("/sell");
  }

  // Fetch products with variants and inventory to check stock
  const products = await prisma.product.findMany({
    where: { sellerId: seller.id },
    include: {
      category: true,
      variants: {
        include: {
          inventory: true
        }
      }
    }
  });

  const productIds = products.map(p => p.id);

  // Fetch order items matching products
  const orderItems = await prisma.orderItem.findMany({
    where: { variant: { productId: { in: productIds } } },
    include: {
      order: {
        include: { user: true }
      },
      variant: {
        include: { product: true }
      }
    },
    orderBy: { order: { createdAt: "desc" } }
  });

  // Calculate statistics
  const totalProducts = products.length;
  const uniqueOrderIds = new Set(orderItems.map(item => item.orderId));
  const totalOrders = uniqueOrderIds.size;
  const totalSales = orderItems.reduce((acc, item) => acc + (item.quantity * item.priceAtBuy), 0);
  const averageOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  // Calculate low stock items (quantity < 5)
  const lowStockItems: Array<{ title: string; sku: string; stock: number }> = [];
  products.forEach(p => {
    p.variants.forEach(v => {
      const stock = v.inventory.reduce((acc, inv) => acc + inv.quantity, 0);
      if (stock < 5) {
        lowStockItems.push({
          title: p.title,
          sku: v.sku,
          stock
        });
      }
    });
  });

  // Calculate sales conversion (simple demo ratio)
  const conversionRate = totalProducts > 0 ? Math.min(98, Math.round((totalOrders / (totalProducts * 10)) * 100)) : 0;

  // Chart percentage (mock weekly trend)
  const weeklyTrends = [25, 45, 30, 80, 50, 95, 75];

  return (
    <div className="container-fluid py-2 text-white">
      {/* Header Dashboard Control */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1 font-family-poppins tracking-tight text-white d-flex align-items-center">
            <i className="bi bi-grid-1x2-fill me-3 text-danger"></i> Vendor Analytics Console
          </h2>
          <p className="text-muted small mb-0">Live catalog metrics, purchase orders, and fulfillment pipelines.</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/seller/products" className="btn btn-danger rounded-pill px-4 fw-bold hover-scale transition-all shadow-sm">
            <i className="bi bi-plus-lg me-1"></i> Add Product
          </Link>
          <Link href="/seller/orders" className="btn btn-outline-light rounded-pill px-4 fw-bold hover-scale transition-all">
            <i className="bi bi-truck me-1"></i> Dispatch Orders
          </Link>
        </div>
      </div>

      {/* Analytical Metrics Row */}
      <div className="row g-4 mb-4">
        {/* Gross Revenue */}
        <div className="col-md-3">
          <div className="bg-gray-800 p-4 rounded-4 border border-secondary border-opacity-25 position-relative overflow-hidden hover-lift transition-all h-100">
            <div className="position-absolute end-0 bottom-0 mb-n3 me-n2 opacity-10">
              <i className="bi bi-cash-stack" style={{ fontSize: "5rem" }}></i>
            </div>
            <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1.5px", fontSize: "0.7rem" }}>Gross Sales</h6>
            <h2 className="fw-black mb-2 text-white display-6">₹{totalSales.toLocaleString('en-IN')}</h2>
            <div className="text-success small fw-semibold"><i className="bi bi-graph-up-arrow me-1"></i> +14.2% Growth</div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="col-md-3">
          <div className="bg-gray-800 p-4 rounded-4 border border-secondary border-opacity-25 position-relative overflow-hidden hover-lift transition-all h-100">
            <div className="position-absolute end-0 bottom-0 mb-n3 me-n2 opacity-10">
              <i className="bi bi-cart-check" style={{ fontSize: "5rem" }}></i>
            </div>
            <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1.5px", fontSize: "0.7rem" }}>Orders Fulfilled</h6>
            <h2 className="fw-black mb-2 text-white display-6">{totalOrders}</h2>
            <div className="text-success small fw-semibold"><i className="bi bi-check-circle me-1"></i> 100% active cycles</div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="col-md-3">
          <div className="bg-gray-800 p-4 rounded-4 border border-secondary border-opacity-25 position-relative overflow-hidden hover-lift transition-all h-100">
            <div className="position-absolute end-0 bottom-0 mb-n3 me-n2 opacity-10">
              <i className="bi bi-bag-check" style={{ fontSize: "5rem" }}></i>
            </div>
            <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1.5px", fontSize: "0.7rem" }}>Avg. Order Value</h6>
            <h2 className="fw-black mb-2 text-white display-6">₹{averageOrderValue.toLocaleString('en-IN')}</h2>
            <div className="text-muted small fw-semibold">Value per checkout</div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="col-md-3">
          <div className="bg-gray-800 p-4 rounded-4 border border-secondary border-opacity-25 position-relative overflow-hidden hover-lift transition-all h-100">
            <div className="position-absolute end-0 bottom-0 mb-n3 me-n2 opacity-10">
              <i className="bi bi-lightning" style={{ fontSize: "5rem" }}></i>
            </div>
            <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1.5px", fontSize: "0.7rem" }}>Sales Conversion</h6>
            <h2 className="fw-black mb-2 text-white display-6">{conversionRate}%</h2>
            <div className="progress bg-dark rounded-pill" style={{ height: "6px" }}>
              <div className="progress-bar bg-danger rounded-pill" style={{ width: `${conversionRate}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Weekly Performance Graph Visual */}
        <div className="col-lg-8">
          <div className="bg-gray-800 p-4 p-md-5 rounded-4 border border-secondary border-opacity-25 h-100">
            <h5 className="fw-bold mb-4 text-white"><i className="bi bi-graph-up text-danger me-2"></i> Weekly Revenue Trend</h5>
            <div className="d-flex align-items-end justify-content-between h-100 pb-3" style={{ minHeight: "220px" }}>
              {weeklyTrends.map((height, i) => (
                <div key={i} className="d-flex flex-column align-items-center gap-2" style={{ width: "10%" }}>
                  <div className="w-100 rounded-top-3 hover-bar transition-all" style={{ height: `${height}%`, minHeight: "15px", background: "linear-gradient(180deg, var(--red) 0%, rgba(232, 71, 42, 0.4) 100%)" }}></div>
                  <span className="text-muted small fw-bold" style={{ fontSize: "0.7rem" }}>Day {i+1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="col-lg-4">
          <div className="bg-gray-800 p-4 rounded-4 border border-secondary border-opacity-25 h-100 d-flex flex-column">
            <h5 className="fw-bold mb-3 text-white"><i className="bi bi-exclamation-triangle text-warning me-2"></i> Inventory Warnings</h5>
            <div className="flex-grow-1 overflow-y-auto" style={{ maxHeight: "250px" }}>
              {lowStockItems.length === 0 ? (
                <div className="text-center py-5 text-muted small">
                  <i className="bi bi-check-circle-fill text-success fs-3 mb-2 d-block"></i>
                  All product variants are sufficiently stocked!
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {lowStockItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-dark bg-opacity-40 rounded-3 border-start border-3 border-warning d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold text-white small text-truncate" style={{ maxWidth: "160px" }}>{item.title}</div>
                        <div className="text-muted font-monospace" style={{ fontSize: "0.68rem" }}>SKU: {item.sku}</div>
                      </div>
                      <span className="badge bg-danger rounded-pill px-2 py-1" style={{ fontSize: "0.7rem" }}>{item.stock} left</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-gray-800 p-4 rounded-4 border border-secondary border-opacity-25 mb-2">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <h5 className="fw-bold mb-0 text-white"><i className="bi bi-receipt me-2 text-danger"></i> Recent Purchases</h5>
          <Link href="/seller/orders" className="text-danger text-decoration-none small fw-bold hover-scale transition-all">
            See All Transactions <i className="bi bi-arrow-right ms-1"></i>
          </Link>
        </div>
        
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0">
            <thead className="table-dark text-muted small text-uppercase" style={{ fontSize: "0.72rem", letterSpacing: "1px" }}>
              <tr>
                <th className="border-0">Order Reference</th>
                <th className="border-0">Item Description</th>
                <th className="border-0">Customer</th>
                <th className="border-0">Purchase Value</th>
                <th className="border-0 text-end">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="border-0">
              {orderItems.slice(0, 5).map((item) => (
                <tr key={item.id}>
                  <td className="py-3">
                    <span className="fw-bold font-monospace text-white">#{item.order.id.slice(-8).toUpperCase()}</span>
                    <div className="text-muted small mt-1" style={{ fontSize: "0.68rem" }}>{new Date(item.order.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="py-3">
                    <div className="text-white small fw-bold">{item.variant.product.title}</div>
                    <div className="text-muted small" style={{ fontSize: "0.72rem" }}>Qty: {item.quantity} × ₹{item.priceAtBuy.toLocaleString('en-IN')}</div>
                  </td>
                  <td className="py-3 text-muted small">{item.order.user.name}</td>
                  <td className="py-3 text-white fw-bold">₹{(item.quantity * item.priceAtBuy).toLocaleString('en-IN')}</td>
                  <td className="py-3 text-end">
                    <span className={`badge rounded-pill px-3 py-2 ${item.order.status === 'DELIVERED' ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'} border`} style={{ fontSize: "0.68rem" }}>
                      {item.order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {orderItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-5 small">No transaction records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .fw-black { font-weight: 900; }
        .hover-bar:hover { filter: brightness(1.25); cursor: pointer; }
        .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 1rem 2rem rgba(0,0,0,.15)!important; }
        .transition-all { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
      `}</style>
    </div>
  );
}
