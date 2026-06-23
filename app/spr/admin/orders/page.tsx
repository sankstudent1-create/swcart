import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import OrderStatusSelect from "@/components/OrderStatusSelect";

export default async function AdminOrdersPage() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { 
      user: true, 
      sellerOrders: { 
        include: { 
          seller: { include: { user: true } },
          items: { include: { variant: { include: { product: true } } } } 
        } 
      } 
    }
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0 text-dark">Orders Management</h2>
        <div className="d-flex gap-2">
          <div className="position-relative">
            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
            <input type="text" className="form-control rounded-pill ps-5 pe-4 shadow-sm border-0 bg-white" placeholder="Search orders..." />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-4 shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 border-light">
            <thead className="table-light text-muted small text-uppercase" style={{ letterSpacing: "0.5px" }}>
              <tr>
                <th className="fw-bold border-0 rounded-start py-3">Order ID</th>
                <th className="fw-bold border-0 py-3">Customer</th>
                <th className="fw-bold border-0 py-3">Amount</th>
                <th className="fw-bold border-0 py-3">Date</th>
                <th className="fw-bold border-0 rounded-end py-3">Update Status</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {orders.map(order => (
                <tr key={order.id} className="hover-bg-light transition-all">
                  <td className="py-3">
                    <div className="fw-bold text-dark mb-1">#{order.id.slice(-8).toUpperCase()}</div>
                    {order.sellerOrders.length > 1 && (
                      <span className="badge bg-dark bg-opacity-10 text-dark border border-dark border-opacity-25 rounded-pill" style={{ fontSize: "0.65rem" }}>
                        Multi-Vendor Split ({order.sellerOrders.length})
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="fw-bold text-dark">{order.user.name}</div>
                    <div className="text-muted small" style={{ fontSize: "0.75rem" }}>{order.user.email}</div>
                  </td>
                  <td className="fw-bold text-dark py-3">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="text-muted small py-3 fw-semibold">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="py-3">
                    <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-5 fw-semibold">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
        .hover-bg-light:hover { background-color: #f8f9fa !important; }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
    </div>
  );
}
