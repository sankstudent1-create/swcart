import { prisma } from "@/lib/db";
import { updateOrderStatus, updateOrderTracking } from "@/app/actions/seller2-orders";
import Link from "next/link";
import React from "react";
import { StaggerContainer, StaggerItem } from "@/components/Seller2/MotionWrapper";

export default async function Seller2OrderDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const seller = await prisma.seller.findFirst();
  if (!seller) return <div>No seller found</div>;

  const order = await prisma.sellerOrder.findUnique({
    where: { id: resolvedParams.id },
    include: {
      order: {
        include: {
          user: true,
          shippingAddress: true,
        }
      },
      items: {
        include: {
          variant: {
            include: { product: true }
          }
        }
      }
    }
  });

  if (!order) return <div className="p-5 text-center text-muted">Order not found.</div>;

  return (
    <StaggerContainer>
      {/* Header Actions (hidden in print) */}
      <StaggerItem className="d-flex justify-content-between align-items-center mb-4 no-print">
        <div>
          <Link href="/seller2/orders" className="text-decoration-none text-muted mb-2 d-inline-block transition-all hover-scale">
            <i className="bi bi-arrow-left"></i> Back to Orders
          </Link>
          <h1 className="s2-page-title mb-1 s2-gradient-text">Order #{order.id.slice(-8).toUpperCase()}</h1>
        </div>
        <div className="d-flex gap-2">
          {/* Status Controls */}
          <form className="d-flex gap-2">
            <button formAction={async () => { "use server"; await updateOrderStatus(order.id, "PROCESSING"); }} className="s2-btn s2-btn-outline bg-white shadow-sm border" disabled={order.status === "PROCESSING" || order.status === "SHIPPED" || order.status === "DELIVERED"}>
              Mark Processing
            </button>
            <button formAction={async () => { "use server"; await updateOrderStatus(order.id, "DELIVERED"); }} className="s2-btn s2-btn-outline text-success border-success bg-success bg-opacity-10 shadow-sm" disabled={order.status === "DELIVERED" || order.status !== "SHIPPED"}>
              Mark Delivered
            </button>
          </form>
          <button className="s2-btn s2-btn-primary shadow" onClick={() => {/* Needs client script */}} data-print-btn><i className="bi bi-printer"></i> Print Invoice</button>
        </div>
      </StaggerItem>

      <div className="row g-4 no-print mb-4">
        {/* Fulfillment Control Center */}
        <StaggerItem className="col-lg-8">
          <div className="s2-card-bento h-100">
            <h5 className="fw-bolder mb-3">Fulfillment Status: <span className="text-primary">{order.status}</span></h5>
            
            <div className="position-relative mt-4 mb-5">
              <div className="s2-progress-track shadow-sm border border-light" style={{height: 12}}>
                <div className={`s2-progress-fill ${order.status === 'PENDING' ? 'bg-warning w-25' : order.status === 'PROCESSING' ? 'bg-primary w-50' : order.status === 'SHIPPED' ? 'bg-info w-75' : 'bg-success w-100'}`}></div>
              </div>
            </div>

            {order.status === "PROCESSING" && (
              <form action={async (fd) => { "use server"; await updateOrderTracking(order.id, fd); }} className="bg-light bg-opacity-50 border rounded p-4">
                <h6 className="fw-bolder mb-3"><i className="bi bi-box-seam text-primary me-2"></i> Ready to Ship?</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <input type="text" name="trackingNumber" className="form-control" placeholder="Tracking Number (e.g. AW123456789)" required />
                  </div>
                  <div className="col-md-4">
                    <select name="provider" className="form-select">
                      <option value="FedEx">FedEx</option>
                      <option value="DHL">DHL</option>
                      <option value="BlueDart">BlueDart</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <button type="submit" className="btn btn-primary w-100">Ship</button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </StaggerItem>

        <StaggerItem className="col-lg-4">
          <div className="s2-card-bento h-100 bg-primary text-white border-0">
            <h5 className="fw-bolder text-white text-opacity-75 mb-3">Customer Notes</h5>
            <p className="mb-0 text-white s2-font">No specific notes provided by the customer.</p>
          </div>
        </StaggerItem>
      </div>

      {/* Invoice Document (visible in both web and print) */}
      <StaggerItem className="s2-card-bento p-4 p-md-5 bg-white mx-auto shadow-lg printable-invoice border border-light" style={{ maxWidth: "800px" }}>
        {/* Invoice Header */}
        <div className="d-flex justify-content-between align-items-start border-bottom pb-4 mb-4">
          <div>
            <div className="fs-2 fw-bolder text-primary mb-2 d-flex align-items-center gap-2">
              <img src="https://tools.swinfosystems.online/icon-192.png" alt="Logo" width={32} />
              {seller.companyName}
            </div>
            <div className="text-muted small">
              GSTIN: {seller.gstNumber || "Not Provided"}<br />
              {seller.pickupAddress || "No Pickup Address Set"}
            </div>
          </div>
          <div className="text-end">
            <div className="fs-1 fw-bolder text-dark mb-1" style={{ letterSpacing: "2px" }}>INVOICE</div>
            <div className="text-muted fw-bold">#{order.id.slice(-8).toUpperCase()}</div>
            <div className="text-muted small mt-2">Date: {new Date(order.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="row mb-5">
          <div className="col-sm-6">
            <div className="text-muted small text-uppercase fw-bold mb-2">Billed To:</div>
            <div className="fw-bolder fs-5 text-dark">{order.order.user.name}</div>
            <div className="text-muted">{order.order.user.email}</div>
          </div>
          <div className="col-sm-6 text-sm-end mt-4 mt-sm-0">
            <div className="text-muted small text-uppercase fw-bold mb-2">Shipped To:</div>
            <div className="text-dark fw-semibold">{order.order.shippingAddress?.street}</div>
            <div className="text-dark">{order.order.shippingAddress?.city}, {order.order.shippingAddress?.state} {order.order.shippingAddress?.postalCode}</div>
          </div>
        </div>

        {/* Line Items */}
        <table className="table table-borderless mb-5">
          <thead className="border-bottom border-dark border-opacity-10 text-muted small text-uppercase">
            <tr>
              <th className="ps-0 py-3">Item Description</th>
              <th className="text-center py-3">Qty</th>
              <th className="text-end py-3">Unit Price</th>
              <th className="text-end pe-0 py-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item: any) => (
              <tr key={item.id} className="border-bottom border-light">
                <td className="ps-0 py-3">
                  <div className="fw-bold text-dark">{item.variant.product.title}</div>
                  <div className="small text-muted font-monospace">SKU: {item.variant.sku}</div>
                </td>
                <td className="text-center py-3 fw-semibold">{item.quantity}</td>
                <td className="text-end py-3 text-muted">₹{item.priceAtBuy}</td>
                <td className="text-end pe-0 py-3 fw-bold text-dark">₹{item.quantity * item.priceAtBuy}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="row justify-content-end mb-5">
          <div className="col-sm-5">
            <div className="d-flex justify-content-between border-top pt-3 mt-3">
              <span className="fw-bolder fs-5 text-dark">Total:</span>
              <span className="fw-bolder fs-4 text-primary">₹{order.order.totalAmount}</span>
            </div>
          </div>
        </div>
      </StaggerItem>
      
      {/* Client-side script for printing */}
      <script dangerouslySetInnerHTML={{__html: `
        document.querySelector('[data-print-btn]')?.addEventListener('click', () => window.print());
      `}} />
    </StaggerContainer>
  );
}
