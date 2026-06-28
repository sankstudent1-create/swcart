import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import SellerSupportManager from "./SellerSupportManager";

export default async function SellerSupportPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) redirect("/sell");

  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      conversations: {
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            include: { sender: { select: { name: true } } }
          }
        }
      }
    }
  });

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold text-white mb-1">Seller Support</h2>
        <p className="text-muted small">Raise tickets for payout issues, policy questions, or platform problems. Our team responds within 24 hours.</p>
      </div>
      <SellerSupportManager
        tickets={JSON.parse(JSON.stringify(tickets))}
        userId={userId}
        sellerName={seller.companyName}
      />
    </div>
  );
}
