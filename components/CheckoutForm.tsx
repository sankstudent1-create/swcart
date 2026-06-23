"use client";

import { useTransition, useState, useMemo } from "react";
import { placeOrderAction, validateCouponAction } from "@/app/actions/shop";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CheckoutForm({ items, savedAddress }: any) {
  const [isPending, startTransition] = useTransition();
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<{ discountType: string, discountVal: number, code: string } | null>(null);
  const router = useRouter();

  // Dynamic calculations
  const { subtotal, tax, total, totalDiscount } = useMemo(() => {
    let baseSubtotal = items.reduce((acc: number, item: any) => {
      const discount = item.variant.product.discountPercent || 0;
      const price = item.variant.price * (1 - (discount / 100));
      return acc + (price * item.quantity);
    }, 0);

    let finalSubtotal = baseSubtotal;
    let totalDiscountAmount = 0;

    if (coupon) {
      if (coupon.discountType === "PERCENTAGE") {
        totalDiscountAmount = baseSubtotal * (coupon.discountVal / 100);
      } else {
        totalDiscountAmount = Math.min(baseSubtotal, coupon.discountVal); // Can't discount more than subtotal
      }
      finalSubtotal = Math.max(0, baseSubtotal - totalDiscountAmount);
    }

    const calculatedTax = Math.round(finalSubtotal * 0.18);
    const calculatedTotal = finalSubtotal + calculatedTax;

    return { subtotal: baseSubtotal, tax: calculatedTax, total: calculatedTotal, totalDiscount: totalDiscountAmount };
  }, [items, coupon]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    const res = await validateCouponAction(couponCode);
    if (res.success) {
      setCoupon(res.coupon);
      toast.success("Coupon applied!");
    } else {
      setCoupon(null);
      toast.error(res.message);
    }
  };

  const handlePlaceOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (coupon) {
      formData.append("couponCode", coupon.code);
    }
    startTransition(async () => {
      const res = await placeOrderAction(formData);
      if (res.success) {
        toast.success("Order placed successfully!");
        router.push("/profile?success=true");
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <form onSubmit={handlePlaceOrder} className="row g-4">
      <div className="col-lg-7">
        <div className="c-card mb-4">
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
              <input type="text" name="address" defaultValue={savedAddress?.street || ""} placeholder="123 Shopping Avenue" required />
            </div>
            <div className="col-md-6 form-group">
              <label>City</label>
              <input type="text" name="city" defaultValue={savedAddress?.city || ""} placeholder="Mumbai" required />
            </div>
            <div className="col-md-6 form-group">
              <label>Postal Code</label>
              <input type="text" name="zip" defaultValue={savedAddress?.postalCode || ""} placeholder="400001" required />
            </div>
          </div>
        </div>

        <div className="c-card">
          <h2><i className="bi bi-cash-coin"></i> Payment Method</h2>
          <div className="p-4 bg-light rounded-3 border border-success border-opacity-25 mt-3 d-flex align-items-center gap-3">
            <i className="bi bi-box-seam-fill text-success fs-1"></i>
            <div>
              <h5 className="mb-1 fw-bold text-dark">Cash on Delivery (COD)</h5>
              <p className="text-muted mb-0 small">Pay easily with cash or UPI directly at your doorstep when your package arrives.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="col-lg-5">
        <div className="summary-card sticky-top" style={{ top: '100px' }}>
          <h2>Order Summary</h2>
          {items.map((item: any) => {
            const productDiscount = item.variant.product.discountPercent || 0;
            const price = item.variant.price * (1 - (productDiscount / 100));
            return (
              <div className="d-flex justify-content-between mb-2 text-muted" key={item.id} style={{fontSize: ".9rem"}}>
                <span className="text-truncate" style={{maxWidth: "200px"}}>{item.quantity}x {item.variant.product.title}</span>
                <span>₹{(price * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            );
          })}
          
          <div className="mt-4 mb-3 d-flex gap-2">
            <input type="text" className="form-control" placeholder="Promo code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} disabled={isPending} />
            <button type="button" className="btn btn-dark px-3" onClick={handleApplyCoupon} disabled={!couponCode || isPending}>Apply</button>
          </div>

          <hr />
          <div className="s-row"><span>Subtotal</span> <span>₹{subtotal.toLocaleString('en-IN')}</span></div>
          {coupon && (
            <div className="s-row text-success fw-bold">
              <span>Coupon ({coupon.code})</span> 
              <span>-₹{totalDiscount.toLocaleString('en-IN')}</span>
            </div>
          )}
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
