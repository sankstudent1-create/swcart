"use client";

import React, { useTransition, useState } from "react";
import { updateDeliveryStatusAction } from "@/app/actions/delivery";
import { toast } from "sonner";

export default function DeliveryDashboard({ deliveryPerson, completedOrders = [], analytics }: { deliveryPerson: any, completedOrders?: any[], analytics?: any }) {
  const [isPending, startTransition] = useTransition();
  const [showReport, setShowReport] = useState(false);

  const handleUpdate = (orderId: string, status: string, location: string) => {
    startTransition(async () => {
      const res = await updateDeliveryStatusAction(orderId, status, location);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const totalTasks = deliveryPerson.orders.length;
  const totalPickups = deliveryPerson.orders.filter((o: any) => o.status === "PROCESSING").length;
  const totalDeliveries = deliveryPerson.orders.filter((o: any) => o.status !== "PROCESSING").length;

  return (
    <div className="p-3 pb-5 text-dark font-jakarta">
      {/* Profile & Vehicle Info */}
      <div className="card border-0 rounded-4 p-3 mb-4 shadow-sm bg-white border" style={{ borderColor: "#eef0f3" }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
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
          <button 
            type="button" 
            className="btn btn-outline-danger rounded-pill fw-bold btn-sm px-3"
            onClick={() => setShowReport(true)}
          >
            <i className="bi bi-file-earmark-bar-graph me-1"></i> Shift Report
          </button>
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

      {/* Driver Printable Shift Report Modal */}
      {showReport && (
        <div className="modal d-block text-dark font-jakarta" style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header bg-dark text-white p-4">
                <div className="d-flex align-items-center gap-3">
                  <img src="https://tools.swinfosystems.online/icon-192.png" alt="Logo" style={{ width: 40 }} />
                  <div>
                    <h5 className="modal-title fw-bold text-white m-0">Driver Shift & Activity Report</h5>
                    <div className="small text-white-50">Swcart Logistics Network Partner</div>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowReport(false)}></button>
              </div>
              <div className="modal-body p-4 bg-light" id="printable-driver-report">
                {/* Brand Header */}
                <div className="d-flex justify-content-between align-items-center border-bottom pb-4 mb-4">
                  <div>
                    <h3 className="fw-black text-danger m-0">Sw<span className="text-dark">cart</span></h3>
                    <div className="text-muted small">Last-Mile Routing Operations</div>
                  </div>
                  <div className="text-end text-muted small">
                    <div>Date: {new Date().toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div>Agent Operations Log</div>
                  </div>
                </div>

                {/* Driver & Vehicle Details */}
                <div className="card border-0 rounded-3 shadow-sm p-4 mb-4 bg-white">
                  <div className="text-muted small fw-bold text-uppercase mb-2"><i className="bi bi-person-badge me-1 text-danger"></i> Courier Agent Information</div>
                  <h6 className="fw-bold mb-1 text-dark">{deliveryPerson.user?.name || "Agent"}</h6>
                  <div className="text-muted small">{deliveryPerson.user?.email}</div>
                  
                  <hr className="my-3 opacity-10" />
                  <div className="text-muted small fw-bold text-uppercase mb-1"><i className="bi bi-truck me-1"></i> Assigned Shift Fleet Vehicle</div>
                  {deliveryPerson.vehicle ? (
                    <div className="fw-bold text-dark">{deliveryPerson.vehicle.type} &bull; License: <span className="font-monospace text-danger">{deliveryPerson.vehicle.licensePlate}</span></div>
                  ) : (
                    <div className="text-muted small italic">No vehicle assigned for current shift.</div>
                  )}
                </div>

                {/* Logistics Stats */}
                <div className="card border-0 rounded-3 shadow-sm p-4 mb-4 bg-white">
                  <h6 className="fw-bold mb-3 border-bottom pb-2 text-dark"><i className="bi bi-pie-chart me-1"></i> Shift Accomplishment summary</h6>
                  <div className="row text-center g-3">
                    <div className="col-4">
                      <div className="fs-3 fw-bold text-dark">{totalTasks}</div>
                      <div className="text-muted small">Active Tasks</div>
                    </div>
                    <div className="col-4">
                      <div className="fs-3 fw-bold text-primary">{totalPickups}</div>
                      <div className="text-muted small">Pickups</div>
                    </div>
                    <div className="col-4">
                      <div className="fs-3 fw-bold text-success">{completedOrders.length}</div>
                      <div className="text-muted small">Delivered Today</div>
                    </div>
                  </div>
                </div>

                {/* Active Task Details */}
                <div className="bg-white p-4 rounded-3 border mb-4">
                  <h6 className="fw-bold mb-3 border-bottom pb-2 text-dark"><i className="bi bi-list-check me-1"></i> Active Workload Run details</h6>
                  <ul className="list-group list-group-flush small">
                    {deliveryPerson.orders.map((o: any, i: number) => (
                      <li key={o.id} className="list-group-item bg-transparent px-0 py-2 border-bottom">
                        <div className="d-flex justify-content-between align-items-center">
                          <strong className="text-dark">#{i + 1} Run Task</strong>
                          <span className="badge bg-light text-dark border font-monospace">{o.trackingNumber}</span>
                        </div>
                        <div className="text-muted mt-1" style={{ fontSize: "0.75rem" }}>
                          Type: <strong>{o.status === "PROCESSING" ? "Pickup" : "Delivery"}</strong><br />
                          Contact: {o.user?.name || "Customer"}<br />
                          Destination: {o.shippingAddress?.street || "Seller Location"}
                        </div>
                      </li>
                    ))}
                    {deliveryPerson.orders.length === 0 && (
                      <div className="text-muted py-2 text-center">No active route tasks.</div>
                    )}
                  </ul>
                </div>

                {/* Footnote */}
                <div className="text-center text-muted small mt-4 pt-4 border-top">
                  Swcart Courier Routing Aggregator Network &bull; Shift Summary Report
                </div>
              </div>
              <div className="modal-footer border-top-0 p-4 pt-0 bg-light d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowReport(false)}>Close</button>
                <button 
                  type="button" 
                  className="btn btn-dark rounded-pill px-4 fw-bold shadow-sm"
                  onClick={() => {
                    const printContents = document.getElementById("printable-driver-report")?.innerHTML;
                    if (printContents) {
                      document.body.innerHTML = printContents;
                      window.print();
                      window.location.reload();
                    }
                  }}
                >
                  <i className="bi bi-printer me-2"></i> Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
