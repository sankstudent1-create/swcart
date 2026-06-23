import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import SellerReturnManager from "./SellerReturnManager";

export default async function SellerReturnsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) redirect("/profile");

  const returnRequests = await prisma.sellerOrder.findMany({
    where: {
      sellerId: seller.id,
      status: { in: ["RETURN_REQUESTED", "RETURN_APPROVED"] }
    },
    include: {
      order: {
        include: {
          user: true,
          shippingAddress: true,
          refunds: true
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
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bolder font-jakarta text-dark mb-1">Returns & Refunds</h2>
          <p className="text-muted mb-0">Manage customer return requests</p>
        </div>
      </div>
      
      <SellerReturnManager returnRequests={returnRequests} />
    </div>
  );
}
