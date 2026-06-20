import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id, userId },
    include: {
      user: true,
      shippingAddress: true,
      items: {
        include: {
          variant: {
            include: { product: true }
          }
        }
      }
    }
  });

  if (!order) {
    return (
      <div className="container py-5 text-center">
        <h2>Order Not Found</h2>
        <Link href="/profile" className="btn btn-dark mt-3">Back to Profile</Link>
      </div>
    );
  }

  const subtotal = order.totalAmount - order.taxAmount - order.shippingFee;

  return (
    <div className="container py-5" style={{ maxWidth: "800px" }}>
      {/* Hide controls when printing */}
      <div className="d-flex justify-content-between align-items-center mb-4 d-print-none">
        <Link href="/profile" className="btn btn-outline-dark rounded-pill fw-bold">
          <i className="bi bi-arrow-left me-2"></i> Back to Orders
        </Link>
        <button className="btn text-white rounded-pill fw-bold shadow-sm px-4" style={{ backgroundColor: "var(--red)" }} onClick={() => window.print()}>
          <i className="bi bi-printer me-2"></i> Print Invoice
        </button>
      </div>

      <div className="bg-white p-5 rounded-4 shadow-sm border border-light invoice-container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start border-bottom pb-4 mb-4">
          <div>
            <h1 className="fw-black mb-0" style={{ color: "var(--red)", letterSpacing: "-1px" }}>Swcart.</h1>
            <p className="text-muted mb-0 mt-1 small">The Ultimate Shopping Experience</p>
          </div>
          <div className="text-end">
            <h3 className="text-muted fw-bold mb-1">INVOICE</h3>
            <p className="fw-bold mb-0">#{order.id.slice(-8).toUpperCase()}</p>
            <p className="text-muted small mb-0">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Addresses */}
        <div className="row mb-5">
          <div className="col-sm-6">
            <h6 className="text-muted text-uppercase fw-bold mb-2 small" style={{ letterSpacing: "1px" }}>Billed To:</h6>
            <div className="fw-bold fs-5 mb-1">{order.user.name}</div>
            <div className="text-muted small">{order.user.email}</div>
          </div>
          <div className="col-sm-6 text-sm-end mt-4 mt-sm-0">
            <h6 className="text-muted text-uppercase fw-bold mb-2 small" style={{ letterSpacing: "1px" }}>Shipped To:</h6>
            <div className="fw-bold mb-1">{order.user.name}</div>
            <div className="text-muted small">
              {order.shippingAddress.street}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.country}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="table-responsive mb-4">
          <table className="table border-light align-middle">
            <thead className="table-light text-muted small text-uppercase" style={{ letterSpacing: "1px" }}>
              <tr>
                <th className="border-0 rounded-start py-3 px-3">Item Description</th>
                <th className="border-0 py-3 text-center">Qty</th>
                <th className="border-0 py-3 text-end">Rate</th>
                <th className="border-0 rounded-end py-3 text-end px-3">Amount</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {order.items.map(item => (
                <tr key={item.id}>
                  <td className="py-3 px-3">
                    <div className="fw-bold">{item.variant.product.title}</div>
                    <div className="text-muted small">Size: {item.variant.size} | Color: {item.variant.color}</div>
                  </td>
                  <td className="py-3 text-center fw-semibold">{item.quantity}</td>
                  <td className="py-3 text-end text-muted">₹{item.priceAtBuy.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-end px-3 fw-bold">₹{(item.priceAtBuy * item.quantity).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="row justify-content-end">
          <div className="col-sm-5">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted fw-semibold">Subtotal</span>
              <span className="fw-bold">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted fw-semibold">Shipping</span>
              <span className="text-success fw-bold">Free</span>
            </div>
            <div className="d-flex justify-content-between mb-3 border-bottom pb-3">
              <span className="text-muted fw-semibold">Taxes (18% GST)</span>
              <span className="fw-bold">₹{order.taxAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-black fs-5 text-dark">Total</span>
              <span className="fw-black fs-4" style={{ color: "var(--red)" }}>₹{order.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-top text-center text-muted small">
          <p className="mb-1 fw-bold text-dark">Payment Method: Cash on Delivery (COD)</p>
          <p className="mb-0">Thank you for shopping with Swcart. If you have any questions, please contact support@swcart.com.</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .container { max-width: 100% !important; padding: 0 !important; }
          .invoice-container { border: none !important; box-shadow: none !important; padding: 0 !important; }
          header, footer, .navbar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
