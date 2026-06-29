import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";

export default async function CheckoutPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: { include: { variant: { include: { product: true } } } }
    }
  });

  const profile = await prisma.customerProfile.findUnique({
    where: { userId },
    include: { addresses: true }
  });
  const savedAddresses = profile?.addresses || [];
  const defaultAddress = savedAddresses.find(a => a.isDefault) || savedAddresses[0] || null;
  
  const wallet = await prisma.wallet.findUnique({
    where: { userId }
  });
  const walletBalance = wallet?.balance || 0;

  const items = cart?.items || [];
  if (items.length === 0) {
    redirect("/cart");
  }

  return (
    <div className="container checkout-layout py-5">
      <h1 className="mb-4 fw-bold">Secure Checkout</h1>
      <CheckoutForm 
        items={items} 
        savedAddresses={savedAddresses} 
        defaultAddress={defaultAddress} 
        walletBalance={walletBalance} 
        userName={user?.name || ""}
      />
    </div>
  );
}
