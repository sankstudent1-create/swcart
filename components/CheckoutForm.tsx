"use client";

import { useTransition, useState, useMemo } from "react";
import { placeOrderAction, validateCouponAction } from "@/app/actions/shop";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CheckoutForm({ items, savedAddress, walletBalance = 0 }: any) {
  const [isPending, startTransition] = useTransition();
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<{ discountType: string, discountVal: number, code: string } | null>(null);
  const [useWallet, setUseWallet] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    firstName: "",
    lastName: "",
    address: savedAddress?.street || "",
    city: savedAddress?.city || "",
    zip: savedAddress?.postalCode || ""
  });
  const router = useRouter();

  // Dynamic calculations
  const { subtotal, tax, total, totalDiscount, walletDeduction, remainingTotal } = useMemo(() => {
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
        totalDiscountAmount = Math.min(baseSubtotal, coupon.discountVal);
      }
      finalSubtotal = Math.max(0, baseSubtotal - totalDiscountAmount);
    }

    const calculatedTax = Math.round(finalSubtotal * 0.18);
    const calculatedTotal = finalSubtotal + calculatedTax;

    let deduction = 0;
    if (useWallet) {
      deduction = Math.min(walletBalance, calculatedTotal);
    }
    const finalRemaining = calculatedTotal - deduction;

    return { 
      subtotal: baseSubtotal, 
      tax: calculatedTax, 
      total: calculatedTotal, 
      totalDiscount: totalDiscountAmount,
      walletDeduction: deduction,
      remainingTotal: finalRemaining
    };
  }, [items, coupon, useWallet, walletBalance]);

  const isDigitalOnly = useMemo(() => {
    return items.every((item: any) => 
      item.variant.product.productType === "DIGITAL" || item.variant.product.productType === "EBOOK"
    );
  }, [items]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    const res = await validateCouponAction(couponCode);
    if (res.success && res.coupon) {
      setCoupon(res.coupon as any);
      toast.success("Coupon applied!");
    } else {
      setCoupon(null);
      toast.error(res.message);
    }
  };

  const handleAutofillLocation = () => {
    if (!navigator.geolocation) {
      return toast.error("Geolocation is not supported by your browser");
    }
    setIsLocating(true);
    toast.loading("Locating your position...", { id: "locate" });
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const street = addr.road || addr.suburb || addr.neighbourhood || addr.amenity || "";
            const city = addr.city || addr.town || addr.village || addr.state_district || "";
            const zip = addr.postcode || "";
            
            setShippingForm(prev => ({
              ...prev,
              address: street,
              city: city,
              zip: zip
            }));
            toast.success("Location autofilled successfully!", { id: "locate" });
          } else {
            toast.error("Could not resolve address details", { id: "locate" });
          }
        } catch (e) {
          toast.error("Failed to fetch address from location", { id: "locate" });
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        toast.error("Location access denied or timed out", { id: "locate" });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePlaceOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (coupon) {
      formData.append("couponCode", coupon.code);
    }
    formData.append("useWallet", String(useWallet));
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
    <form onSubmit={handlePlaceOrder} className="row g-4 font-jakarta">
      <div className="col-lg-7">
        {/* Shipping details */}
        {!isDigitalOnly && (
          <div className="card border-0 rounded-4 shadow-sm p-4 mb-4" style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)" }}>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <h4 className="fw-bold text-dark m-0 d-flex align-items-center">
                <div className="bg-danger bg-opacity-10 text-danger rounded-3 p-2 me-3 d-inline-flex">
                  <i className="bi bi-geo-alt-fill fs-5"></i>
                </div>
                Shipping Details
              </h4>
              <button 
                type="button" 
                className="btn btn-sm btn-outline-danger rounded-pill fw-bold"
                onClick={handleAutofillLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <><span className="spinner-border spinner-border-sm me-1"></span> Locating...</>
                ) : (
                  <><i className="bi bi-geo-alt-fill me-1"></i> Use Current Location</>
                )}
              </button>
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">First Name</label>
                <input 
                  type="text" 
                  name="firstName" 
                  className="form-control rounded-3 border-light shadow-sm" 
                  placeholder="John" 
                  value={shippingForm.firstName} 
                  onChange={(e) => setShippingForm({ ...shippingForm, firstName: e.target.value })} 
                  required={!isDigitalOnly}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Last Name</label>
                <input 
                  type="text" 
                  name="lastName" 
                  className="form-control rounded-3 border-light shadow-sm" 
                  placeholder="Doe" 
                  value={shippingForm.lastName} 
                  onChange={(e) => setShippingForm({ ...shippingForm, lastName: e.target.value })} 
                  required={!isDigitalOnly}
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Street Address</label>
                <input 
                  type="text" 
                  name="address" 
                  className="form-control rounded-3 border-light shadow-sm" 
                  placeholder="123 Shopping Avenue" 
                  value={shippingForm.address} 
                  onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })} 
                  required={!isDigitalOnly}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">City</label>
                <input 
                  type="text" 
                  name="city" 
                  className="form-control rounded-3 border-light shadow-sm" 
                  placeholder="Mumbai" 
                  value={shippingForm.city} 
                  onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })} 
                  required={!isDigitalOnly}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Postal Code</label>
                <input 
                  type="text" 
                  name="zip" 
                  className="form-control rounded-3 border-light shadow-sm" 
                  placeholder="400001" 
                  value={shippingForm.zip} 
                  onChange={(e) => setShippingForm({ ...shippingForm, zip: e.target.value })} 
                  required={!isDigitalOnly}
                />
              </div>
            </div>
          </div>
        )}

        {/* Wallet payment option */}
        <div className="card border-0 rounded-4 shadow-sm p-4 mb-4" style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)" }}>
          <h4 className="fw-bold text-dark mb-4 d-flex align-items-center">
            <div className="bg-success bg-opacity-10 text-success rounded-3 p-2 me-3 d-inline-flex">
              <i className="bi bi-wallet2 fs-5"></i>
            </div>
            Swcart Wallet
          </h4>
          <div className="p-3 rounded-4 border d-flex align-items-center justify-content-between gap-3 bg-light">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-success text-white rounded-circle p-2 d-inline-flex">
                <i className="bi bi-currency-rupee fs-5"></i>
              </div>
              <div>
                <div className="fw-bold text-dark">Wallet Balance</div>
                <div className="text-muted small">Available: ₹{walletBalance.toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div className="form-check form-switch m-0">
              <input 
                className="form-check-input cursor-pointer" 
                type="checkbox" 
                role="switch" 
                id="useWalletSwitch" 
                checked={useWallet}
                onChange={(e) => setUseWallet(e.target.checked)}
                disabled={walletBalance <= 0}
                style={{ width: "2.5rem", height: "1.25rem" }}
              />
            </div>
          </div>
        </div>

        {/* Doorstep payment */}
        <div className="card border-0 rounded-4 shadow-sm p-4" style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)" }}>
          <h4 className="fw-bold text-dark mb-3 d-flex align-items-center">
            <div className="bg-dark bg-opacity-10 text-dark rounded-3 p-2 me-3 d-inline-flex">
              <i className="bi bi-cash-coin fs-5"></i>
            </div>
            Payment Method
          </h4>
          {remainingTotal === 0 ? (
            <div className="p-3 bg-success bg-opacity-10 rounded-4 border border-success border-opacity-25 mt-3 d-flex align-items-center gap-3">
              <i className="bi bi-shield-fill-check text-success fs-2"></i>
              <div>
                <h6 className="mb-1 fw-bold text-success">Fully Covered by Wallet</h6>
                <p className="text-muted mb-0 small">No additional payment is required on delivery. Your order will be dispatched immediately.</p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-light rounded-4 border border-success border-opacity-25 mt-3 d-flex align-items-center gap-3">
              <i className="bi bi-box-seam-fill text-success fs-2"></i>
              <div>
                <h6 className="mb-1 fw-bold text-dark">Cash on Delivery (COD) for Remainder</h6>
                <p className="text-muted mb-0 small">Pay the remaining ₹{remainingTotal.toLocaleString('en-IN')} with cash or UPI at your doorstep.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Summary column */}
      <div className="col-lg-5">
        <div className="card border-0 rounded-4 shadow-sm p-4 sticky-top" style={{ top: '100px', background: "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)" }}>
          <h4 className="fw-bold text-dark mb-4">Order Summary</h4>
          <div className="d-flex flex-column gap-3 mb-4">
            {items.map((item: any) => {
              const productDiscount = item.variant.product.discountPercent || 0;
              const price = item.variant.price * (1 - (productDiscount / 100));
              return (
                <div className="d-flex justify-content-between text-muted align-items-center" key={item.id} style={{fontSize: ".9rem"}}>
                  <span className="text-truncate fw-medium text-dark" style={{maxWidth: "240px"}}>{item.quantity}x {item.variant.product.title}</span>
                  <span className="fw-semibold">₹{(price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              );
            })}
          </div>
          
          <div className="input-group mb-4 shadow-sm">
            <input 
              type="text" 
              className="form-control rounded-start-3" 
              placeholder="Promo code" 
              value={couponCode} 
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
              disabled={isPending} 
            />
            <button 
              type="button" 
              className="btn btn-dark rounded-end-3 px-3 fw-bold" 
              onClick={handleApplyCoupon} 
              disabled={!couponCode || isPending}
            >
              Apply
            </button>
          </div>

          <hr className="my-3 opacity-10" />
          
          <div className="d-flex justify-content-between mb-2 small text-muted">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          
          {coupon && (
            <div className="d-flex justify-content-between mb-2 small text-success fw-bold">
              <span>Coupon ({coupon.code})</span>
              <span>-₹{totalDiscount.toLocaleString('en-IN')}</span>
            </div>
          )}
          
          <div className="d-flex justify-content-between mb-2 small text-muted">
            <span>Shipping</span>
            <span className="text-success fw-bold">Free</span>
          </div>
          
          <div className="d-flex justify-content-between mb-2 small text-muted">
            <span>Taxes (18%)</span>
            <span>₹{tax.toLocaleString('en-IN')}</span>
          </div>

          {useWallet && walletDeduction > 0 && (
            <div className="d-flex justify-content-between mb-2 small text-success fw-bold">
              <span>Wallet Applied</span>
              <span>-₹{walletDeduction.toLocaleString('en-IN')}</span>
            </div>
          )}

          <hr className="my-3 opacity-10" />
          
          <div className="d-flex justify-content-between align-items-center mb-4">
            <span className="fw-bold text-dark fs-5">Total Payable</span>
            <span className="fw-bold text-danger fs-4">₹{remainingTotal.toLocaleString('en-IN')}</span>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-danger w-100 py-3 rounded-pill fw-bold shadow-sm"
            style={{ background: "linear-gradient(135deg, #e63946 0%, #c1121f 100%)", border: "none" }}
            disabled={isPending}
          >
            {isPending ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Processing Securely...</>
            ) : (
              <><i className="bi bi-shield-lock-fill me-2"></i>Place Secure Order</>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
