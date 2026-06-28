"use client";

import React, { useTransition } from "react";
import { updateDeliveryStatusAction } from "@/app/actions/delivery";
import { toast } from "sonner";

export default function DeliveryDashboard({ deliveryPerson, completedOrders = [], analytics }: { deliveryPerson: any, completedOrders?: any[], analytics?: any }) {
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (orderId: string, status: string, location: string) => {
    startTransition(async () => {
      const res = await updateDeliveryStatusAction(orderId, status, location);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <div className="p-3 pb-5 text-dark font-jakarta">
      {/* Profile & Vehicle Info */}
      <div className="card border-0 rounded-4 p-3 mb-4 shadow-sm bg-white border" style={{ borderColor: "#eef0f3" }}>
        <div className="d-flex align-items-center gap-3">
          <div className="bg-danger bg-opacity-10 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0" style={{ width: 50, height: 50 }}>
            <i className="bi bi-person-badge-fill fs-4 text-danger"></i>
          </div>
          <div>
            <div className="text-muted small text-uppercase fw-bold" style={{ letterSpacing: "1px", fontSize: "0.75rem" }}>Active Delivery Agent</div>
            <div className="fw-bold text-dark" style={{ fontSize: "1.1rem" }}>
              {deliveryPerson.vehicle ? `${deliveryPerson.vehicle.type} (${deliveryPerson.vehicle.licensePlate})` : "No Vehicle Assigned"}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="row g-3 mb-4">
        <div className="col-6">
          <div className="card border-0 p-3 rounded-4 shadow-sm border text-center h-100 bg-white" style={{ borderLeft: "4px solid #ffb703 !important" }}>
            <div className="text-muted small fw-bold text-uppercase mb-1">To Pick Up / Deliver</div>
            <div className="fs-3 fw-bold text-warning">{analytics?.pendingTotal || 0}</div>
          </div>
        </div>
        <div className="col-6">
          <div className="card border-0 p-3 rounded-4 shadow-sm border text-center h-100 bg-white" style={{ borderLeft: "4px solid #2ec4b6 !important" }}>
            <div className="text-muted small fw-bold text-uppercase mb-1">Delivered Today</div>
            <div className="fs-3 fw-bold text-success">{analytics?.completedToday || 0}</div>
          </div>
        </div>
      </div>

      <h5 className="fw-bold text-dark mb-3 d-flex justify-content-between align-items-center">
        <span>Active Workload Tasks</span> 
        <span className="badge rounded-pill bg-danger">{deliveryPerson.orders.length}</span>
      </h5>

      <div className="d-flex flex-column gap-3">
        {deliveryPerson.orders.map((order: any, idx: number) => {
          const isPickup = order.status === "PROCESSING";
          const addr = order.shippingAddress;
          const sellerOrder = order.sellerOrders?.[0];
          const seller = sellerOrder?.seller;
          const sellerAddressObj = seller?.pickupAddress as any;
          const sellerAddressStr = sellerAddressObj
            ? `${sellerAddressObj.street || ""}, ${sellerAddressObj.city || ""}, ${sellerAddressObj.state || ""} ${sellerAddressObj.pincode || seller.pickupPincode || ""}`
            : (seller?.pickupPincode ? `Pincode Area: ${seller.pickupPincode}` : "Seller pickup address not set");

          return (
            <div key={order.id} className="card border-0 rounded-4 overflow-hidden shadow-sm bg-white" style={{ border: "1px solid #eef0f3" }}>
              {/* Card Header */}
              <div className="p-3 d-flex justify-content-between align-items-center bg-light border-bottom" style={{ borderColor: "#eef0f3" }}>
                <div>
                  <span className="badge bg-dark text-white me-2">#{idx + 1}</span>
                  <span className="font-monospace text-muted small">TRK: {order.trackingNumber}</span>
                </div>
                <span className={`badge px-3 py-2 rounded-pill fw-bold ${isPickup ? 'bg-warning text-dark' : 'bg-primary text-white'}`}>
                  {isPickup ? 'First-Mile Pickup' : 'Last-Mile Delivery'}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-3">
                {isPickup ? (
                  <>
                    <div className="text-muted small text-uppercase fw-bold mb-1" style={{ letterSpacing: "0.5px", fontSize: "0.7rem" }}>Pick Up Address (Seller)</div>
                    <h5 className="fw-bold mb-2 text-dark">{seller?.companyName || "Vendor"}</h5>
                    <div className="text-muted small mb-3">
                      <i className="bi bi-geo-alt-fill text-warning me-1"></i> 
                      {sellerAddressStr}
                    </div>

                    <a href={`tel:${seller?.user?.phone || ""}`} className="btn btn-sm btn-outline-dark rounded-pill w-100 mb-3 fw-bold">
                      <i className="bi bi-telephone-fill me-2 text-danger"></i> Call Seller ({seller?.user?.name || "Vendor"})
                    </a>

                    <div className="bg-light p-3 rounded-4 mb-3 small border" style={{ borderColor: "#eef0f3" }}>
                      <div className="fw-bold mb-2 text-muted"><i className="bi bi-list-check me-1"></i> Items to Collect:</div>
                      {sellerOrder?.items.map((item: any, i: number) => (
                        <div key={i} className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-10 last-border-none">
                          <span className="text-dark fw-medium">{item.variant.product.title} {item.variant.size && `(${item.variant.size})`} {item.variant.color && `[${item.variant.color}]`}</span>
                          <span className="fw-bold text-danger">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <button 
                      className="btn btn-warning rounded-pill fw-bold py-2.5 shadow-sm w-100 text-dark"
                      onClick={() => handleUpdate(order.id, "Picked Up", sellerAddressObj?.city || "Seller Hub")}
                      disabled={isPending}
                    >
                      <i className="bi bi-box-arrow-in-down me-2"></i> Confirm Picked Up from Seller
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-muted small text-uppercase fw-bold mb-1" style={{ letterSpacing: "0.5px", fontSize: "0.7rem" }}>Delivery Address (Customer)</div>
                    <h5 className="fw-bold mb-2 text-dark">{order.user.name}</h5>
                    <div className="text-muted small mb-3">
                      <i className="bi bi-geo-alt-fill text-danger me-1"></i> 
                      {addr ? `${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}` : "Address Unknown"}
                    </div>
                    
                    <a href={`tel:${order.user.phone}`} className="btn btn-sm btn-outline-dark rounded-pill w-100 mb-3 fw-bold">
                      <i className="bi bi-telephone me-2 text-danger"></i> Call Customer
                    </a>

                    <div className="d-flex flex-column gap-2 mt-2">
                      <button 
                        className="btn btn-primary rounded-pill fw-bold py-2.5 shadow-sm"
                        onClick={() => handleUpdate(order.id, "Out for Delivery", addr?.city || "Local Hub")}
                        disabled={isPending}
                      >
                        <i className="bi bi-truck me-2"></i> Mark Out for Delivery
                      </button>
                      <button 
                        className="btn btn-success rounded-pill fw-bold py-2.5 shadow-sm"
                        onClick={() => handleUpdate(order.id, "Delivered", addr?.city || "Destination")}
                        disabled={isPending}
                      >
                        <i className="bi bi-check-circle me-2"></i> Mark Delivered
                      </button>
                      <button 
                        className="btn btn-outline-danger rounded-pill fw-bold py-2.5"
                        onClick={() => handleUpdate(order.id, "Failed Attempt", addr?.city || "Local Hub")}
                        disabled={isPending}
                      >
                        <i className="bi bi-x-circle me-2"></i> Failed Attempt
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {deliveryPerson.orders.length === 0 && (
          <div className="text-center py-5 bg-white rounded-4 border shadow-sm p-4">
            <i className="bi bi-emoji-smile fs-1 text-muted mb-3 d-block opacity-50"></i>
            <h5 className="text-dark fw-bold">No tasks assigned</h5>
            <p className="text-muted small mb-0">You're all caught up! Check back later for new pick-up routing or delivery dispatches.</p>
          </div>
        )}
      </div>

      <h5 className="fw-bold text-dark mt-5 mb-3 d-flex justify-content-between align-items-center">
        <span>Completed Deliveries (Today)</span>
        <span className="badge rounded-pill bg-success">{completedOrders.length}</span>
      </h5>
      
      <div className="d-flex flex-column gap-3 mb-5">
        {completedOrders.map((order: any, idx: number) => {
          const addr = order.shippingAddress;
          return (
            <div key={order.id} className="card border-0 rounded-4 overflow-hidden shadow-sm bg-white" style={{ border: "1px solid #eef0f3", opacity: 0.85 }}>
              <div className="p-3 d-flex justify-content-between align-items-center bg-success bg-opacity-10 border-bottom" style={{ borderColor: "rgba(40,167,69,0.15)" }}>
                <div>
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  <span className="font-monospace text-muted small">TRK: {order.trackingNumber}</span>
                </div>
                <span className="badge bg-success">Delivered</span>
              </div>
              <div className="p-3">
                <h6 className="fw-bold mb-1 text-dark">{order.user?.name}</h6>
                <div className="text-muted small">
                  <i className="bi bi-geo-alt text-success me-1"></i> 
                  {addr ? `${addr.street}, ${addr.city}` : "Address Unknown"}
                </div>
              </div>
            </div>
          );
        })}
        {completedOrders.length === 0 && (
          <div className="text-center py-4 text-muted small bg-white border rounded-4 shadow-sm p-4">
            No completed deliveries yet today.
          </div>
        )}
      </div>
    </div>
  );
}
