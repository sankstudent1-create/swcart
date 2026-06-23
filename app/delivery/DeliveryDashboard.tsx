"use client";

import React, { useTransition } from "react";
import { updateDeliveryStatusAction } from "@/app/actions/delivery";
import { toast } from "sonner";

export default function DeliveryDashboard({ deliveryPerson }: { deliveryPerson: any }) {
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (orderId: string, status: string, location: string) => {
    startTransition(async () => {
      const res = await updateDeliveryStatusAction(orderId, status, location);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <div className="p-3 pb-5 text-white">
      {/* Profile & Vehicle Info */}
      <div className="rounded-4 p-3 mb-4 d-flex align-items-center gap-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="bg-danger rounded-circle d-flex justify-content-center align-items-center flex-shrink-0" style={{ width: 50, height: 50 }}>
          <i className="bi bi-person fs-3 text-white"></i>
        </div>
        <div>
          <div className="text-muted small text-uppercase fw-bold" style={{ letterSpacing: "1px" }}>On Duty</div>
          <div className="fw-bold fs-5">{deliveryPerson.vehicle ? `${deliveryPerson.vehicle.type} (${deliveryPerson.vehicle.licensePlate})` : "No Vehicle"}</div>
        </div>
      </div>

      <h5 className="fw-bold mb-3 d-flex justify-content-between align-items-center">
        My Deliveries 
        <span className="badge rounded-pill bg-danger">{deliveryPerson.orders.length}</span>
      </h5>

      <div className="d-flex flex-column gap-3">
        {deliveryPerson.orders.map((order: any, idx: number) => {
          const addr = order.shippingAddress;
          return (
            <div key={order.id} className="rounded-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {/* Card Header */}
              <div className="p-3 d-flex justify-content-between align-items-center" style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <span className="badge bg-white text-dark me-2">#{idx + 1}</span>
                  <span className="font-monospace text-muted small">TRK: {order.trackingNumber}</span>
                </div>
                <span className={`badge ${order.status === 'SHIPPED' ? 'bg-primary' : 'bg-warning text-dark'}`}>
                  {order.status === 'SHIPPED' ? 'Ready' : order.status}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-3">
                <h6 className="fw-bold mb-1">{order.user.name}</h6>
                <div className="text-muted small mb-3">
                  <i className="bi bi-geo-alt text-danger me-1"></i> 
                  {addr ? `${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}` : "Address Unknown"}
                </div>
                
                <a href={`tel:${order.user.phone}`} className="btn btn-sm btn-outline-light rounded-pill w-100 mb-4 fw-bold">
                  <i className="bi bi-telephone me-2"></i> Call Customer
                </a>

                <div className="d-flex flex-column gap-2">
                  <button 
                    className="btn btn-primary rounded-pill fw-bold py-2 shadow-sm"
                    onClick={() => handleUpdate(order.id, "Out for Delivery", addr?.city || "Local Hub")}
                    disabled={isPending || order.status === "SHIPPED" && false} // Just logic simplification
                  >
                    <i className="bi bi-truck me-2"></i> Mark Out for Delivery
                  </button>
                  <button 
                    className="btn btn-success rounded-pill fw-bold py-2 shadow-sm"
                    onClick={() => handleUpdate(order.id, "Delivered", addr?.city || "Destination")}
                    disabled={isPending}
                  >
                    <i className="bi bi-check-circle me-2"></i> Mark Delivered
                  </button>
                  <button 
                    className="btn btn-dark rounded-pill fw-bold py-2" style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                    onClick={() => handleUpdate(order.id, "Failed Attempt", addr?.city || "Local Hub")}
                    disabled={isPending}
                  >
                    <i className="bi bi-x-circle me-2"></i> Failed Attempt
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {deliveryPerson.orders.length === 0 && (
          <div className="text-center py-5">
            <i className="bi bi-box-seam fs-1 text-muted mb-3 opacity-50"></i>
            <h5 className="text-muted fw-bold">No packages assigned</h5>
            <p className="text-muted small">You're all caught up for the day!</p>
          </div>
        )}
      </div>
    </div>
  );
}
