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

  // Get products
  const products = await prisma.product.findMany({
    where: { sellerId: seller.id },
    include: { category: true }
  });

  const productIds = products.map(p => p.id);

  // Find order items containing this seller's products
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
  // Unique orders
  const uniqueOrderIds = new Set(orderItems.map(item => item.orderId));
  const totalOrders = uniqueOrderIds.size;

  // Total sales revenue from this seller's products
  const totalSales = orderItems.reduce((acc, item) => acc + (item.quantity * item.priceAtBuy), 0);

  // Recent order items list
  const recentSales = orderItems.slice(0, 5);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-2 text-white">
        <div>
          <h2 className="fw-bold mb-1" style={{ letterSpacing: "-1px" }}>Seller Console</h2>
          <p className="text-muted mb-0">Overview of your vendor metrics and recent activity.</p>
        </div>
        <Link href="/seller/products" className="btn btn-danger rounded-pill px-4 fw-bold hover-scale transition-all">
          <i className="bi bi-box-seam me-2"></i> Manage Catalog
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="bg-gray-800 p-4 rounded-4 border border-secondary border-opacity-25 hover-lift transition-all">
            <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1.5px", fontSize: "0.75rem" }}>Products Listed</h6>
            <h2 className="fw-black mb-0 display-6 text-white">{totalProducts}</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="bg-gray-800 p-4 rounded-4 border border-secondary border-opacity-25 hover-lift transition-all">
            <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1.5px", fontSize: "0.75rem" }}>Total Revenue</h6>
            <h2 className="fw-black mb-0 display-6 text-white">₹{totalSales.toLocaleString('en-IN')}</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="bg-gray-800 p-4 rounded-4 border border-secondary border-opacity-25 hover-lift transition-all">
            <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1.5px", fontSize: "0.75rem" }}>Orders Count</h6>
            <h2 className="fw-black mb-0 display-6 text-white">{totalOrders}</h2>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="row g-4">
        {/* Recent Sales Table */}
        <div className="col-lg-8">
          <div className="bg-gray-800 p-4 rounded-4 border border-secondary border-opacity-25 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0 text-white">Recent Sales</h5>
              <Link href="/seller/orders" className="text-danger text-decoration-none small fw-bold hover-scale transition-all">
                All Orders <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
            
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle mb-0">
                <thead className="table-dark text-muted small text-uppercase" style={{ fontSize: "0.72rem", letterSpacing: "1px" }}>
                  <tr>
                    <th className="border-0">Product</th>
                    <th className="border-0">Customer</th>
                    <th className="border-0">Qty</th>
                    <th className="border-0">Earnings</th>
                    <th className="border-0 text-end">Status</th>
                  </tr>
                </thead>
                <tbody className="border-0">
                  {recentSales.map((item, i) => (
                    <tr key={i}>
                      <td className="py-3">
                        <div className="fw-bold text-white small text-truncate" style={{ maxWidth: "160px" }}>{item.variant.product.title}</div>
                      </td>
                      <td className="py-3 text-muted small">{item.order.user.name}</td>
                      <td className="py-3 text-white small">{item.quantity}</td>
                      <td className="py-3 text-white fw-bold">₹{(item.quantity * item.priceAtBuy).toLocaleString('en-IN')}</td>
                      <td className="py-3 text-end">
                        <span className={`badge rounded-pill px-2 py-1 ${item.order.status === 'PAID' || item.order.status === 'DELIVERED' ? 'bg-success' : 'bg-warning'} bg-opacity-10`} style={{ fontSize: "0.68rem" }}>
                          {item.order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentSales.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4 small">No sales recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Small Widget: Vendor Status */}
        <div className="col-lg-4">
          <div className="bg-gray-800 p-4 rounded-4 border border-secondary border-opacity-25 h-100 d-flex flex-column justify-content-between">
            <div>
              <h5 className="fw-bold text-white mb-3">Vendor Account</h5>
              <div className="d-flex align-items-center gap-3 bg-dark bg-opacity-40 p-3 rounded-3 mb-3">
                <div className="bg-success rounded-circle" style={{ width: "10px", height: "10px" }}></div>
                <div>
                  <div className="fw-bold text-white small">{seller.companyName}</div>
                  <div className="text-muted small">GSTIN: {seller.gstNumber || "Not Provided"}</div>
                </div>
              </div>
              <p className="text-muted small">Your profile is verified. Standard delivery fee and payment cycles are active.</p>
            </div>
            
            <Link href="/seller/settings" className="btn btn-outline-light btn-sm rounded-pill w-100 py-2 fw-semibold">
              <i className="bi bi-gear me-1"></i> Edit Profile Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
