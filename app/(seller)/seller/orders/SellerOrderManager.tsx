"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSellerOrderStatusAction } from "@/app/actions/seller";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  orderId: string;
  quantity: number;
  priceAtBuy: number;
  order: {
    id: string;
    status: string;
    createdAt: string;
    user: {
      name: string;
      email: string;
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

  const handleStatusChange = (orderId: string, status: string) => {
    startTransition(async () => {
      const res = await updateSellerOrderStatusAction(orderId, status);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
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
        <p className="text-muted mb-0">Monitor purchase orders and update shipping stages.</p>
      </div>

      <div className="bg-gray-800 p-4 rounded-4 border border-secondary border-opacity-25">
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0">
            <thead className="table-dark text-muted small text-uppercase" style={{ fontSize: "0.72rem", letterSpacing: "1px" }}>
              <tr>
                <th className="border-0">Order ID / Date</th>
                <th className="border-0">Product Info</th>
                <th className="border-0">Customer & Address</th>
                <th className="border-0">Earnings</th>
                <th className="border-0 text-end">Dispatch Stage</th>
              </tr>
            </thead>
            <tbody className="border-0">
              {orderItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-3">
                    <div className="fw-bold text-white small">#{item.order.id.slice(-8).toUpperCase()}</div>
                    <div className="text-muted small mt-1">{new Date(item.order.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="py-3">
                    <div className="text-white small fw-bold">{item.variant.product.title}</div>
                    <div className="text-muted small">Qty: {item.quantity} × ₹{item.priceAtBuy.toLocaleString('en-IN')}</div>
                  </td>
                  <td className="py-3">
                    <div className="text-white small">{item.order.user.name}</div>
                    <div className="text-muted small mt-1" style={{ maxWidth: "200px", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.order.shippingAddress.street}, {item.order.shippingAddress.city}, {item.order.shippingAddress.state} {item.order.shippingAddress.postalCode}
                    </div>
                  </td>
                  <td className="py-3 text-white fw-bold">₹{(item.quantity * item.priceAtBuy).toLocaleString('en-IN')}</td>
                  <td className="py-3 text-end">
                    <div className="d-flex justify-content-end align-items-center gap-2">
                      <span className={`badge rounded-pill px-2 py-1 ${getStatusBadge(item.order.status)} bg-opacity-10`} style={{ fontSize: "0.68rem" }}>
                        {item.order.status}
                      </span>
                      <select 
                        className="form-select form-select-sm bg-dark border-secondary text-white rounded-pill px-2 py-1"
                        style={{ width: "120px", fontSize: "0.78rem" }}
                        value={item.order.status}
                        onChange={e => handleStatusChange(item.order.id, e.target.value)}
                        disabled={isPending}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {orderItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-5 small">No sales orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
