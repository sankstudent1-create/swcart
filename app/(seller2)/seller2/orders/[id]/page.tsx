"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function Seller2OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    // In a real app, this would be a server component or fetch data.
    // Since we're demonstrating the print/pdf capability and UI, we mock the fetch.
    setOrder({
      id: id,
      status: "PROCESSING",
      createdAt: new Date().toISOString(),
      order: {
        totalAmount: 1999,
        user: { name: "John Doe", email: "john@example.com", phone: "+91 9876543210" },
        shippingAddress: {
          street: "123 Main St, Apt 4B",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          country: "India"
        }
      },
      items: [
        {
          id: "item1",
          quantity: 1,
          priceAtBuy: 1999,
          variant: {
            sku: "HDPH-BLK-01",
            product: { title: "Over-ear Wireless Headphones" }
          }
        }
      ]
    });
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (!order) return <div className="p-5 text-center">Loading...</div>;

  return (
    <>
      {/* Header Actions (hidden in print) */}
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <div>
          <Link href="/seller2/orders" className="text-decoration-none text-muted mb-2 d-inline-block">
            <i className="bi bi-arrow-left"></i> Back to Orders
          </Link>
          <h1 className="s2-page-title mb-1">Order #{order.id.slice(-8).toUpperCase()}</h1>
        </div>
        <div className="d-flex gap-2">
          <button className="s2-btn s2-btn-outline text-danger border-danger"><i className="bi bi-x-circle"></i> Cancel</button>
          <button className="s2-btn s2-btn-primary" onClick={handlePrint}><i className="bi bi-printer"></i> Print Invoice (PDF)</button>
        </div>
      </div>

      {/* Invoice Document (visible in both web and print) */}
      <div className="s2-card p-4 p-md-5 bg-white mx-auto shadow-lg printable-invoice" style={{ maxWidth: "800px" }}>
        
        {/* Invoice Header */}
        <div className="d-flex justify-content-between align-items-start border-bottom pb-4 mb-4">
          <div>
            <div className="fs-2 fw-bolder text-primary mb-2"><i className="bi bi-shop"></i> Swcart Seller</div>
            <div className="text-muted small">
              123 Seller Street, Commerce Park<br />
              Bangalore, Karnataka 560001<br />
              GSTIN: 29XXXXX1234X1Z5
            </div>
          </div>
          <div className="text-end">
            <div className="fs-1 fw-bolder text-dark mb-1">INVOICE</div>
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
            <div className="text-muted">{order.order.user.phone}</div>
          </div>
          <div className="col-sm-6 text-sm-end mt-4 mt-sm-0">
            <div className="text-muted small text-uppercase fw-bold mb-2">Shipped To:</div>
            <div className="text-dark fw-semibold">{order.order.shippingAddress.street}</div>
            <div className="text-dark">{order.order.shippingAddress.city}, {order.order.shippingAddress.state} {order.order.shippingAddress.postalCode}</div>
            <div className="text-dark">{order.order.shippingAddress.country}</div>
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
                  <div className="small text-muted">SKU: {item.variant.sku}</div>
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
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Subtotal:</span>
              <span className="fw-semibold">₹{order.order.totalAmount}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Tax (GST):</span>
              <span className="fw-semibold">₹0.00</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Shipping:</span>
              <span className="fw-semibold">₹0.00</span>
            </div>
            <div className="d-flex justify-content-between border-top pt-3 mt-3">
              <span className="fw-bolder fs-5 text-dark">Total:</span>
              <span className="fw-bolder fs-4 text-primary">₹{order.order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-muted small mt-5 pt-4 border-top">
          Thank you for shopping with us!<br/>
          If you have any questions concerning this invoice, contact support@swcart.com.
        </div>
      </div>
    </>
  );
}
