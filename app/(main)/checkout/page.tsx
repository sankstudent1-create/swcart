import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";

export default async function CheckoutPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: { include: { variant: { include: { product: true } } } }
    }
  });

  const items = cart?.items || [];
  if (items.length === 0) {
    redirect("/cart");
  }

  const subtotal = items.reduce((acc, item) => acc + (item.variant.price * item.quantity), 0);
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  return (
    <div className="container checkout-layout py-5">
      <h1 className="mb-4 fw-bold">Secure Checkout</h1>
      <CheckoutForm items={items} subtotal={subtotal} tax={tax} total={total} />
    </div>
  );
}
