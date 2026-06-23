import { getSessionUserId, logoutAction } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Outfit } from "next/font/google";
import Link from "next/link";


const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "900"] });

export default async function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const isDelivery = await prisma.userRole.findFirst({
    where: { userId: userId, role: { name: "DELIVERY" } }
  });

  if (!isDelivery) redirect("/");

  return (
    <div className={`d-flex flex-column ${outfit.className}`} style={{ minHeight: "100vh", backgroundColor: "#121212" }}>
      {/* Mobile-first Header */}
      <header className="bg-dark text-white p-3 d-flex justify-content-between align-items-center shadow-sm sticky-top z-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="d-flex align-items-center gap-2">
          <img src="https://tools.swinfosystems.online/icon-192.png" alt="Logo" style={{ width: 30 }} />
          <div className="fw-bold" style={{ fontSize: "1.1rem" }}>Driver<span className="text-danger">App</span></div>
        </div>
        <form action={logoutAction as any} className="m-0">
          <button type="submit" className="btn btn-sm btn-outline-light rounded-pill px-3 fw-bold" style={{ fontSize: "0.8rem" }}>
            Log Out
          </button>
        </form>
      </header>
      
      <main className="flex-grow-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
