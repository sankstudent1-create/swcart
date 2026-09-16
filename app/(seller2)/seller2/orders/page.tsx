import { prisma } from "@/lib/db";
import Link from "next/link";
import React from "react";
import { StaggerContainer, StaggerItem } from "@/components/Seller2/MotionWrapper";

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
    <StaggerContainer>
      <StaggerItem className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="s2-page-title mb-1 s2-gradient-text">Order Pipeline</h1>
          <p className="text-muted s2-font">Process orders, track fulfillment progress, and print labels.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="s2-btn s2-btn-outline rounded-pill px-4 shadow-sm"><i className="bi bi-download"></i> Export CSV</button>
        </div>
      </StaggerItem>

      <StaggerItem className="s2-card-bento p-0 overflow-hidden">
        {/* Interactive Kanban / Tabs header */}
        <div className="d-flex border-bottom bg-light bg-opacity-75 px-4 pt-3 gap-5">
          <div className="pb-3 border-bottom border-primary border-3 fw-bolder text-primary cursor-pointer transition-all">All Orders</div>
          <div className="pb-3 text-muted fw-bold cursor-pointer transition-all hover-scale">Pending <span className="badge bg-warning rounded-pill ms-1">3</span></div>
          <div className="pb-3 text-muted fw-bold cursor-pointer transition-all hover-scale">Processing <span className="badge bg-secondary rounded-pill ms-1">1</span></div>
          <div className="pb-3 text-muted fw-bold cursor-pointer transition-all hover-scale">Shipped <span className="badge bg-info rounded-pill ms-1">12</span></div>
        </div>

        <div className="table-responsive">
          <table className="table table-borderless align-middle mb-0">
            <thead className="table-light text-muted small text-uppercase border-bottom border-light">
              <tr>
                <th className="ps-4 py-3">Order ID</th>
                <th className="py-3">Customer & Location</th>
                <th className="py-3" style={{ width: "250px" }}>Fulfillment Progress</th>
                <th className="py-3">Total Amount</th>
                <th className="text-end pe-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((so) => {
                  let progress = 10;
                  let color = "bg-warning";
                  if (so.status === "PROCESSING") { progress = 50; color = "bg-primary"; }
                  if (so.status === "SHIPPED") { progress = 80; color = "bg-info"; }
                  if (so.status === "DELIVERED") { progress = 100; color = "bg-success"; }

                  return (
                    <tr key={so.id} className="s2-table-row border-bottom border-light">
                      <td className="ps-4 py-3">
                        <Link href={`/seller2/orders/${so.id}`} className="text-decoration-none">
                          <div className="fw-bolder text-dark font-monospace mb-1">#{so.id.slice(-8).toUpperCase()}</div>
                          <div className="small text-muted">{new Date(so.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                        </Link>
                      </td>
                      <td className="py-3">
                        <div className="d-flex align-items-center gap-3">
                          <img src={`https://ui-avatars.com/api/?name=${so.order.user.name}&background=random&color=fff`} className="rounded-circle shadow-sm" width={40} height={40} />
                          <div>
                            <div className="fw-bold text-dark">{so.order.user.name}</div>
                            <div className="small text-muted"><i className="bi bi-geo-alt-fill opacity-50"></i> {so.order.shippingAddress?.city}, {so.order.shippingAddress?.state}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="d-flex justify-content-between mb-1 small fw-bold">
                          <span className={color.replace("bg-", "text-")}>{so.status}</span>
                          <span className="text-muted">{progress}%</span>
                        </div>
                        <div className="s2-progress-track shadow-sm border border-light">
                          <div className={`s2-progress-fill ${color}`} style={{ width: `${progress}%` }}></div>
                        </div>
                      </td>
                      <td className="fw-bolder fs-5 text-dark py-3">₹{so.order.totalAmount}</td>
                      <td className="text-end pe-4 py-3 position-relative">
                        <Link href={`/seller2/orders/${so.id}`} className="btn btn-sm btn-light text-primary fw-bold px-4 py-2 rounded-pill shadow-sm border transition-all hover-scale">
                          Manage <i className="bi bi-arrow-right ms-1"></i>
                        </Link>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-5">
                    <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm" style={{ width: 80, height: 80 }}>
                      <i className="bi bi-receipt fs-1 text-primary opacity-50"></i>
                    </div>
                    <h5 className="fw-bolder text-dark">Your pipeline is clear</h5>
                    <p className="text-muted">You have no active orders at the moment.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </StaggerItem>
    </StaggerContainer>
  );
}
