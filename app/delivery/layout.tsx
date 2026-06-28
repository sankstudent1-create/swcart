import { getSessionUserId, logoutAction } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Outfit } from "next/font/google";
import Link from "next/link";


const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "900"] });

export default async function DeliveryLayout({ children }: { children: React.ReactNode }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) redirect("/login");

    const isDelivery = await prisma.userRole.findFirst({
      where: { userId: userId, role: { name: "DELIVERY" } }
    });

    if (!isDelivery) redirect("/");

    return (
      <div className={`d-flex flex-column ${outfit.className}`} style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        {/* Mobile-first Header */}
        <header className="bg-white text-dark p-3 d-flex justify-content-between align-items-center shadow-sm sticky-top z-3 border-bottom" style={{ borderColor: "#eef0f3" }}>
          <div className="d-flex align-items-center gap-2">
            <img src="https://tools.swinfosystems.online/icon-192.png" alt="Logo" style={{ width: 30 }} />
            <div className="fw-bold text-dark" style={{ fontSize: "1.1rem" }}>Driver<span className="text-danger">App</span></div>
          </div>
          <form action={logoutAction as any} className="m-0">
            <button type="submit" className="btn btn-sm btn-outline-dark rounded-pill px-3 fw-bold" style={{ fontSize: "0.8rem" }}>
              Log Out
            </button>
          </form>
        </header>
        
        <main className="flex-grow-1 overflow-auto">
          {children}
        </main>
      </div>
    );
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") throw error; // Allow Next.js redirects to bubble up
    return (
      <div className="p-5 bg-dark text-white" style={{ minHeight: "100vh" }}>
        <h3>Server Error in Delivery Layout</h3>
        <p className="text-danger font-monospace">{error.message || String(error)}</p>
      </div>
    );
  }
}
