import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import PayoutManager from "./PayoutManager";

export default async function AdminPayoutsPage() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  // Get the commission rate
  let settings = await prisma.siteSetting.findUnique({ where: { id: "GLOBAL" } });
  if (!settings) {
    settings = await prisma.siteSetting.create({ data: { id: "GLOBAL" } });
  }

  const commissionRate = settings.platformCommission / 100;

  // Get sellers with UNPAID, DELIVERED orders
  const sellers = await prisma.seller.findMany({
    where: {
      sellerOrders: {
        some: { status: "DELIVERED", payoutStatus: "UNPAID" }
      }
    },
    include: {
      user: true,
      sellerOrders: {
        where: { status: "DELIVERED", payoutStatus: "UNPAID" },
        include: { order: true, items: true }
      }
    }
  });

  // Calculate totals
  const mappedSellers = sellers.map(seller => {
    const totalSales = seller.sellerOrders.reduce((sum, so) => {
      const soTotal = so.items.reduce((itemSum, item) => itemSum + (item.quantity * item.priceAtBuy), 0);
      return sum + soTotal;
    }, 0);
    const platformCut = totalSales * commissionRate;
    const sellerEarnings = totalSales - platformCut;

    return {
      id: seller.id,
      companyName: seller.companyName,
      user: { name: seller.user.name, email: seller.user.email },
      bankDetails: seller.bankDetails,
      unpaidOrdersCount: seller.sellerOrders.length,
      totalSales,
      platformCut,
      sellerEarnings,
      orderIds: seller.sellerOrders.map(so => so.id)
    };
  });

  const totalOwed = mappedSellers.reduce((sum, s) => sum + s.sellerEarnings, 0);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Payouts & Finance</h2>
          <p className="text-muted mb-0">Manage merchant payouts and platform revenue splits.</p>
        </div>
      </div>
      <PayoutManager 
        sellers={JSON.parse(JSON.stringify(mappedSellers))} 
        totalOwed={totalOwed}
        commissionRate={settings.platformCommission}
      />
    </div>
  );
}
