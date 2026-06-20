import Link from "next/link";
import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import CartItemRow from "@/components/CartItemRow";

export default async function CartPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true
            }
          }
        },
        orderBy: { id: "asc" }
      }
    }
  });

  const items = cart?.items || [];
  const subtotal = items.reduce((acc: number, item: any) => acc + (item.variant.price * item.quantity), 0);
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  return (
    <div className="container py-5" style={{ minHeight: "60vh" }}>
      <h1 className="mb-4 fw-bold">Your Shopping Cart</h1>
      
      {items.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-cart-x text-muted" style={{fontSize: "4rem"}}></i>
          <h3 className="mt-3 fw-semibold">Your cart is empty</h3>
          <p className="text-muted">Looks like you haven't added any items to your cart yet.</p>
          <Link href="/" className="btn btn-primary px-4 py-2 mt-2 rounded-pill" style={{background: "var(--ink)", border: "none"}}>
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="bg-white p-4 rounded-4 shadow-sm border border-light">
              <div className="d-flex border-bottom pb-2 mb-3 text-muted fw-semibold" style={{fontSize: ".85rem", textTransform: "uppercase", letterSpacing: "1px"}}>
                <div className="flex-grow-1">Product Details</div>
                <div style={{width: "120px", textAlign: "center"}}>Quantity</div>
                <div style={{width: "110px", textAlign: "right"}}>Total</div>
              </div>
              
              {items.map((item: any) => (
                <CartItemRow key={item.id} item={item as any} />
              ))}
            </div>
          </div>
          
          <div className="col-lg-4">
            <div className="bg-white p-4 rounded-4 shadow-sm border border-light sticky-top" style={{top: "100px"}}>
              <h4 className="mb-4 fw-bold">Order Summary</h4>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Subtotal ({items.length} items)</span>
                <span className="fw-semibold">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Taxes (18%)</span>
                <span className="fw-semibold">₹{tax.toLocaleString("en-IN")}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Shipping</span>
                <span className="fw-semibold text-success">Free</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-4">
                <span className="fw-bold fs-5">Total</span>
                <span className="fw-bold fs-5 text-dark">₹{total.toLocaleString("en-IN")}</span>
              </div>
              
              <Link href="/checkout" className="btn btn-primary w-100 py-3 rounded-3 fw-bold shadow-sm" style={{background: "var(--red)", border: "none", fontSize: "1.1rem"}}>
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
