import { getSessionUserId, logoutAction } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "900"] });

export default async function WarehouseLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const isManager = await prisma.userRole.findFirst({
    where: { userId, role: { name: "WAREHOUSE_MANAGER" } }
  });

  if (!isManager) redirect("/");

  return (
    <div className={`d-flex flex-column ${outfit.className}`} style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <header className="bg-dark text-white p-3 d-flex justify-content-between align-items-center shadow-sm sticky-top z-3">
        <div className="d-flex align-items-center gap-2">
          <img src="https://tools.swinfosystems.online/icon-192.png" alt="Logo" style={{ width: 30 }} />
          <div className="fw-bold fs-5">Hub<span className="text-danger">Manager</span></div>
        </div>
        <form action={logoutAction as any} className="m-0">
          <button type="submit" className="btn btn-sm btn-outline-light rounded-pill px-3 fw-bold">
            Log Out
          </button>
        </form>
      </header>
      
      <main className="flex-grow-1 overflow-auto p-4">
        {children}
      </main>
    </div>
  );
}
