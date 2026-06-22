"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSellerOrderLogisticsAction } from "@/app/actions/seller";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  orderId: string;
  quantity: number;
  priceAtBuy: number;
  order: {
    id: string;
    status: string;
    shippingProvider: string | null;
    trackingNumber: string | null;
    createdAt: string;
    user: {
      name: string;
      email: string;
      phone: string | null;
    };
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  variant: {
    product: {
      title: string;
    };
  };
}

interface SellerOrderManagerProps {
  orderItems: OrderItem[];
}

export default function SellerOrderManager({ orderItems }: SellerOrderManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  
  // Logistics form state inside modal
  const [logisticsForm, setLogisticsForm] = useState({
    status: "PENDING",
    shippingProvider: "",
    trackingNumber: ""
  });

  // Group items by orderId
  const groupedOrders: { [key: string]: { order: any; items: any[]; totalEarnings: number } } = {};
  
  orderItems.forEach(item => {
    if (!groupedOrders[item.orderId]) {
      groupedOrders[item.orderId] = {
        order: item.order,
        items: [],
        totalEarnings: 0
      };
    }
    groupedOrders[item.orderId].items.push(item);
    groupedOrders[item.orderId].totalEarnings += item.quantity * item.priceAtBuy;
  });

  const ordersList = Object.values(groupedOrders);

  const handleOpenLogisticsModal = (orderData: any) => {
    setSelectedOrder(orderData);
    setLogisticsForm({
      status: orderData.order.status,
      shippingProvider: orderData.order.shippingProvider || "Delhivery",
      trackingNumber: orderData.order.trackingNumber || ""
    });
  };

  const handleSaveLogistics = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    startTransition(async () => {
      const res = await updateSellerOrderLogisticsAction(selectedOrder.order.id, {
        status: logisticsForm.status,
        shippingProvider: logisticsForm.shippingProvider || null,
        trackingNumber: logisticsForm.trackingNumber || null
      });

      if (res.success) {
        toast.success(res.message);
        setSelectedOrder(null);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const printShippingLabel = (orderData: any) => {
    const { order } = orderData;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups to print shipping labels.");
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Shipping Label - ${order.id}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; color: #000; background-color: #fff; }
            .label-card { border: 4px solid #000; padding: 20px; width: 480px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
            .header h2 { margin: 0; font-size: 26px; letter-spacing: 2px; }
            .section { margin-bottom: 14px; font-size: 14px; line-height: 1.4; }
            .title { font-weight: bold; text-transform: uppercase; font-size: 11px; margin-bottom: 2px; text-decoration: underline; }
            .barcode { text-align: center; font-size: 30px; letter-spacing: 4px; margin: 25px 0; font-family: sans-serif; font-weight: bold; }
            .meta-row { display: flex; justify-content: space-between; border-top: 2px solid #000; padding-top: 8px; margin-top: 15px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="header">
              <h2>SWCART PRIORITY</h2>
              <small>Domestic Shipping Cargo Label</small>
            </div>
            <div class="section">
              <div class="title">SHIP FROM (VENDOR):</div>
              <strong>Swcart Fulfillment Service</strong><br/>
              Standard Hub, Warehouse 1A
            </div>
            <div class="section">
              <div class="title">SHIP TO (CUSTOMER):</div>
              <strong>${order.user.name}</strong><br/>
              ${order.shippingAddress.street}<br/>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}<br/>
              ${order.shippingAddress.country}<br/>
              Phone: ${order.user.phone || "N/A"}<br/>
              Email: ${order.user.email}
            </div>
            <div class="barcode">
              |||||| | |||| ||| ||| ||
              <div style="font-size:12px; letter-spacing: 1px; margin-top:5px; font-family: monospace;">TRK: ${order.trackingNumber || "PENDING"}</div>
            </div>
            <div class="meta-row">
              <div><strong>ORDER ID:</strong> #${order.id.toUpperCase()}</div>
              <div><strong>PROVIDER:</strong> ${order.shippingProvider || "STANDARD"}</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-danger";
      case "PROCESSING": return "bg-warning";
      case "SHIPPED": return "bg-primary";
      case "DELIVERED": return "bg-success";
      default: return "bg-secondary";
    }
  };

  return (
    <div>
      <div className="mb-4 text-white">
        <h2 className="fw-bold mb-1" style={{ letterSpacing: "-1px" }}>Vendor Logistics</h2>
        <p className="text-muted mb-0">Monitor orders, print shipping labels / invoices, choose carriers, and update tracking numbers.</p>
      </div>

      <div className="bg-gray-800 p-4 rounded-4 border border-secondary border-opacity-25">
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0">
            <thead className="table-dark text-muted small text-uppercase" style={{ fontSize: "0.72rem", letterSpacing: "1px" }}>
              <tr>
                <th className="border-0">Order ID / Date</th>
                <th className="border-0">Products Ordered</th>
                <th className="border-0">Customer Details</th>
                <th className="border-0">Logistics</th>
                <th className="border-0">Earnings</th>
                <th className="border-0 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="border-0">
              {ordersList.map(({ order, items, totalEarnings }) => (
                <tr key={order.id}>
                  <td className="py-3">
                    <div className="fw-bold text-white small">#{order.id.slice(-8).toUpperCase()}</div>
                    <div className="text-muted small mt-1">{new Date(order.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="py-3">
                    <div className="d-flex flex-column gap-1">
                      {items.map((item, idx) => (
                        <div key={item.id} className="small text-white">
                          • {item.variant.product.title} <span className="text-muted">x {item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="text-white small fw-bold">{order.user.name}</div>
                    <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
                      {order.user.email}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`badge rounded-pill px-2.5 py-1 ${getStatusBadge(order.status)} bg-opacity-20 text-white`} style={{ fontSize: "0.68rem" }}>
                      {order.status}
                    </span>
                    {order.shippingProvider && (
                      <div className="text-muted small mt-1" style={{ fontSize: "0.7rem" }}>
                        <i className="bi bi-truck me-1"></i> {order.shippingProvider}
                      </div>
                    )}
                  </td>
                  <td className="py-3 text-white fw-bold">₹{totalEarnings.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-end">
                    <div className="d-flex justify-content-end gap-2">
                      <button 
                        className="btn btn-sm btn-outline-light rounded-pill px-3 fw-semibold"
                        onClick={() => handleOpenLogisticsModal({ order, items, totalEarnings })}
                      >
                        Logistics & Print
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {ordersList.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-5 small">No sales orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logistics & Details Modal */}
      {selectedOrder && (
        <div className="modal d-block animate-fade-in" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content bg-gray-900 border border-secondary border-opacity-25 rounded-4 shadow-lg text-white">
              <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3">
                <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2">
                  <i className="bi bi-truck text-danger"></i>
                  Order Details #{selectedOrder.order.id.slice(-8).toUpperCase()}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedOrder(null)}></button>
              </div>

              <div className="modal-body p-4" style={{ maxHeight: "65vh", overflowY: "auto" }}>
                <div className="row g-4">
                  {/* Left Column: Order details & address */}
                  <div className="col-md-6 d-flex flex-column gap-3">
                    <div className="bg-dark p-3 rounded-4 border border-secondary border-opacity-10">
                      <h6 className="fw-bold mb-2 text-danger"><i className="bi bi-person me-2"></i>Customer Info</h6>
                      <div className="small text-white">
                        <div><strong>Name:</strong> {selectedOrder.order.user.name}</div>
                        <div><strong>Email:</strong> {selectedOrder.order.user.email}</div>
                        <div><strong>Phone:</strong> {selectedOrder.order.user.phone || "Not Provided"}</div>
                      </div>
                    </div>

                    <div className="bg-dark p-3 rounded-4 border border-secondary border-opacity-10">
                      <h6 className="fw-bold mb-2 text-danger"><i className="bi bi-geo-alt me-2"></i>Shipping Address</h6>
                      <div className="small text-white-50">
                        {selectedOrder.order.shippingAddress.street}<br />
                        {selectedOrder.order.shippingAddress.city}, {selectedOrder.order.shippingAddress.state} - {selectedOrder.order.shippingAddress.postalCode}<br />
                        {selectedOrder.order.shippingAddress.country}
                      </div>
                    </div>

                    <div className="bg-dark p-3 rounded-4 border border-secondary border-opacity-10">
                      <h6 className="fw-bold mb-2 text-danger"><i className="bi bi-cart me-2"></i>Items Details</h6>
                      <div className="d-flex flex-column gap-2">
                        {selectedOrder.items.map((item: any) => (
                          <div key={item.id} className="d-flex justify-content-between align-items-center small py-1 border-bottom border-secondary border-opacity-10 last-border-0">
                            <div>
                              <span className="text-white">{item.variant.product.title}</span>
                              <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                                Qty: {item.quantity} × ₹{item.priceAtBuy.toLocaleString('en-IN')}
                              </div>
                            </div>
                            <span className="text-white fw-bold">₹{(item.quantity * item.priceAtBuy).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                        <div className="d-flex justify-content-between align-items-center fw-bold mt-2 pt-2 border-top border-secondary border-opacity-25 text-white">
                          <span>Total Earnings:</span>
                          <span>₹{selectedOrder.totalEarnings.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Update Logistics Form */}
                  <div className="col-md-6">
                    <form onSubmit={handleSaveLogistics} className="bg-dark p-4 rounded-4 border border-secondary border-opacity-10 h-100 d-flex flex-column justify-content-between">
                      <div>
                        <h6 className="fw-bold mb-3 text-danger"><i className="bi bi-sliders me-2"></i>Update Logistics</h6>
                        
                        <div className="mb-3">
                          <label className="form-label text-muted small text-uppercase fw-bold mb-1">Dispatch Stage</label>
                          <select 
                            className="form-select bg-gray-900 border-secondary text-white rounded-3"
                            value={logisticsForm.status}
                            onChange={e => setLogisticsForm({ ...logisticsForm, status: e.target.value })}
                          >
                            <option value="PENDING">Pending Approval</option>
                            <option value="PROCESSING">Processing / Packing</option>
                            <option value="SHIPPED">Shipped / Dispatched</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="form-label text-muted small text-uppercase fw-bold mb-1">Shipping Provider</label>
                          <select 
                            className="form-select bg-gray-900 border-secondary text-white rounded-3"
                            value={logisticsForm.shippingProvider}
                            onChange={e => setLogisticsForm({ ...logisticsForm, shippingProvider: e.target.value })}
                          >
                            <option value="Delhivery">Delhivery</option>
                            <option value="BlueDart">BlueDart</option>
                            <option value="FedEx">FedEx</option>
                            <option value="DHL">DHL</option>
                            <option value="Internal Delivery">Internal Delivery</option>
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="form-label text-muted small text-uppercase fw-bold mb-1">Tracking Number</label>
                          <input 
                            type="text" 
                            className="form-control bg-gray-900 border-secondary text-white rounded-3"
                            placeholder="e.g. TRK9876543210"
                            value={logisticsForm.trackingNumber}
                            onChange={e => setLogisticsForm({ ...logisticsForm, trackingNumber: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <button type="submit" className="btn btn-danger w-100 rounded-pill fw-bold text-white py-2 mb-2 shadow" disabled={isPending}>
                          {isPending ? "Saving changes..." : "Save Logistics Info"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Print Invoice & Shipping Label triggers */}
                <div className="mt-4 pt-3 border-top border-secondary border-opacity-10 d-flex justify-content-between flex-wrap gap-2">
                  <button 
                    type="button" 
                    className="btn btn-outline-light rounded-pill px-4 fw-semibold"
                    onClick={() => printShippingLabel(selectedOrder)}
                  >
                    <i className="bi bi-printer me-2"></i> Print Shipping Label
                  </button>
                  <a 
                    href={`/orders/${selectedOrder.order.id}/invoice`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-danger text-white rounded-pill px-4 fw-bold shadow-sm"
                  >
                    <i className="bi bi-receipt me-2"></i> View & Print Invoice
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
