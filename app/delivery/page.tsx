import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import DeliveryDashboard from "./DeliveryDashboard";

export default async function DeliveryPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  try {
    const deliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { userId: userId },
      include: {
        vehicle: true,
        orders: {
          where: { status: { not: "DELIVERED" } },
          include: { shippingAddress: true, user: true },
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!deliveryPerson) redirect("/");

    return <DeliveryDashboard deliveryPerson={deliveryPerson} />;
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") throw error;
    return (
      <div className="p-5 text-white">
        <h3>Server Error in Delivery Page</h3>
        <p className="text-danger font-monospace">{error.message || String(error)}</p>
      </div>
    );
  }
}
