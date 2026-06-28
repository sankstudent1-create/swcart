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
          where: { status: { in: ["SHIPPED", "PROCESSING"] } }, // OUT_FOR_DELIVERY is represented by SHIPPED in our app basically, processing is failed attempt
          include: { 
            shippingAddress: true, 
            user: true,
            sellerOrders: {
              include: {
                seller: {
                  include: {
                    user: true
                  }
                },
                items: {
                  include: {
                    variant: {
                      include: {
                        product: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!deliveryPerson) redirect("/");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedOrders = await prisma.order.findMany({
      where: { deliveryPersonId: deliveryPerson.id, status: "DELIVERED", updatedAt: { gte: today } },
      include: { shippingAddress: true, user: true },
      orderBy: { updatedAt: "desc" }
    });

    const driverAnalytics = {
      completedToday: completedOrders.length,
      pendingTotal: deliveryPerson.orders.length
    };

    return <DeliveryDashboard deliveryPerson={deliveryPerson} completedOrders={completedOrders} analytics={driverAnalytics} />;
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
