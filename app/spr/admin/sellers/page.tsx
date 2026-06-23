import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import SellerManager from "./SellerManager";

export default async function SellersPage() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const sellers = await prisma.seller.findMany({
    include: {
      user: true,
      _count: { select: { products: true } },
      sellerOrders: {
        where: { status: "DELIVERED" },
        include: { items: true }
      }
    },
    orderBy: { user: { createdAt: "desc" } }
  });

  const analytics = {
    totalSellers: sellers.length,
    activeSellers: sellers.filter(s => s.isVerified).length,
    pendingApplications: sellers.filter(s => !s.isVerified).length,
    totalProducts: sellers.reduce((acc, s) => acc + s._count.products, 0),
    totalRevenue: sellers.reduce((acc, s) => {
      const sellerRev = s.sellerOrders.reduce((sum: number, so: any) => {
        const soTotal = so.items.reduce((itemSum: number, item: any) => itemSum + (item.quantity * item.priceAtBuy), 0);
        return sum + soTotal;
      }, 0);
      return acc + sellerRev;
    }, 0)
  };

  return <SellerManager sellers={sellers} analytics={analytics} />;
}
