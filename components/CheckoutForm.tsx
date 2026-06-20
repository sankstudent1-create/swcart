"use client";

import { useTransition } from "react";
import { placeOrderAction } from "@/app/actions/shop";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CheckoutForm({ items, subtotal, tax, total }: any) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handlePlaceOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await placeOrderAction(formData);
      if (res.success) {
        toast.success("Order placed successfully!");
        router.push("/profile");
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <form onSubmit={handlePlaceOrder} className="row g-4">
      <div className="col-lg-7">
        <div className="c-card">
          <h2><i className="bi bi-geo-alt"></i> Shipping Details</h2>
          <div className="row">
            <div className="col-md-6 form-group">
              <label>First Name</label>
              <input type="text" name="firstName" placeholder="John" required />
            </div>
            <div className="col-md-6 form-group">
              <label>Last Name</label>
              <input type="text" name="lastName" placeholder="Doe" required />
            </div>
            <div className="col-12 form-group">
              <label>Street Address</label>
              <input type="text" name="address" placeholder="123 Shopping Avenue" required />
            </div>
            <div className="col-md-6 form-group">
              <label>City</label>
              <input type="text" name="city" placeholder="Mumbai" required />
            </div>
            <div className="col-md-6 form-group">
              <label>Postal Code</label>
              <input type="text" name="zip" placeholder="400001" required />
            </div>
          </div>
        </div>

        <div className="c-card">
          <h2><i className="bi bi-credit-card"></i> Payment Method</h2>
          <div className="form-group">
            <label>Card Number</label>
            <input type="text" placeholder="0000 0000 0000 0000" required />
          </div>
          <div className="row">
            <div className="col-6 form-group">
              <label>Expiry Date</label>
              <input type="text" placeholder="MM/YY" required />
            </div>
            <div className="col-6 form-group">
              <label>CVV</label>
              <input type="text" placeholder="123" required />
            </div>
          </div>
        </div>
      </div>
      
      <div className="col-lg-5">
        <div className="summary-card sticky-top" style={{ top: '100px' }}>
          <h2>Order Summary</h2>
          {items.map((item: any) => (
            <div className="d-flex justify-content-between mb-2 text-muted" key={item.id} style={{fontSize: ".9rem"}}>
              <span className="text-truncate" style={{maxWidth: "200px"}}>{item.quantity}x {item.variant.product.name}</span>
              <span>₹{(item.variant.price * item.quantity).toLocaleString('en-IN')}</span>
            </div>
          ))}
          <hr />
          <div className="s-row"><span>Subtotal</span> <span>₹{subtotal.toLocaleString('en-IN')}</span></div>
          <div className="s-row"><span>Shipping</span> <span className="text-success">Free</span></div>
          <div className="s-row"><span>Taxes (18%)</span> <span>₹{tax.toLocaleString('en-IN')}</span></div>
          <div className="s-total mt-3"><span>Total</span> <span>₹{total.toLocaleString('en-IN')}</span></div>
          <button type="submit" className="btn-pay" disabled={isPending}>
            {isPending ? "Processing securely..." : "Pay Now"}
          </button>
        </div>
      </div>
    </form>
  );
}
