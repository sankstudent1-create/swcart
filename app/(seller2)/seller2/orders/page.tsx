import { prisma } from "@/lib/db";
import Link from "next/link";
import React from "react";

export default async function Seller2Orders() {
  const seller = await prisma.seller.findFirst();
  
  if (!seller) {
    return <div className="text-center p-5">No seller found.</div>;
  }

  const orders = await prisma.sellerOrder.findMany({
    where: { sellerId: seller.id },
    include: { 
      order: {
        include: {
          user: true,
          shippingAddress: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="s2-page-title mb-1">Orders Management</h1>
          <p className="text-muted s2-font">Process orders, print labels, and track shipments.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="s2-btn s2-btn-outline"><i className="bi bi-download"></i> Export CSV</button>
        </div>
      </div>

      <div className="s2-card p-0 overflow-hidden">
        {/* Kanban / Tabs header */}
        <div className="d-flex border-bottom bg-light bg-opacity-50 px-3 pt-3 gap-4">
          <div className="pb-3 border-bottom border-primary border-3 fw-bolder text-primary cursor-pointer">All Orders</div>
          <div className="pb-3 text-muted fw-bold cursor-pointer">Pending (3)</div>
          <div className="pb-3 text-muted fw-bold cursor-pointer">Processing (1)</div>
          <div className="pb-3 text-muted fw-bold cursor-pointer">Shipped (12)</div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted small text-uppercase">
              <tr>
                <th className="ps-4">Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((so) => (
                  <tr key={so.id}>
                    <td className="ps-4 fw-bolder text-dark">
                      <Link href={`/seller2/orders/${so.id}`} className="text-decoration-none text-dark">
                        #{so.id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="text-muted">{new Date(so.createdAt).toLocaleString()}</td>
                    <td>
                      <div className="fw-bold">{so.order.user.name}</div>
                      <div className="small text-muted">{so.order.shippingAddress?.city}, {so.order.shippingAddress?.state}</div>
                    </td>
                    <td>
                      <span className={`badge rounded-pill px-3 py-2 ${
                        so.status === 'PENDING' ? 'bg-warning bg-opacity-10 text-warning border border-warning' :
                        so.status === 'SHIPPED' ? 'bg-info bg-opacity-10 text-info border border-info' :
                        so.status === 'DELIVERED' ? 'bg-success bg-opacity-10 text-success border border-success' :
                        'bg-primary bg-opacity-10 text-primary border border-primary'
                      }`}>
                        {so.status}
                      </span>
                    </td>
                    <td className="fw-bolder">₹{so.order.totalAmount}</td>
                    <td className="text-end pe-4">
                      <Link href={`/seller2/orders/${so.id}`} className="btn btn-sm btn-light text-primary fw-bold px-3 rounded-pill border shadow-sm">
                        Manage <i className="bi bi-arrow-right ms-1"></i>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <i className="bi bi-receipt display-4 text-muted opacity-50 mb-3 d-block"></i>
                    <h5 className="fw-bolder">No orders yet</h5>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
