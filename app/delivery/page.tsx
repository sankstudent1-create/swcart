import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import DeliveryDashboard from "./DeliveryDashboard";

export default async function DeliveryPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

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
}
