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
      products: { include: { variants: { include: { orderItems: true } } } }
    },
    orderBy: { user: { createdAt: "desc" } }
  });

  const analytics = {
    totalSellers: sellers.length,
    activeSellers: sellers.filter(s => s.isVerified).length,
    pendingApplications: sellers.filter(s => !s.isVerified).length,
    totalProducts: sellers.reduce((acc, s) => acc + s.products.length, 0),
    totalRevenue: sellers.reduce((acc, s) => {
      let revenue = 0;
      s.products.forEach(p => {
        p.variants.forEach(v => {
          v.orderItems.forEach(oi => {
            revenue += oi.quantity * oi.priceAtBuy;
          });
        });
      });
      return acc + revenue;
    }, 0)
  };

  return <SellerManager sellers={sellers} analytics={analytics} />;
}
