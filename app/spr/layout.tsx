import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { Prisma } from "@prisma/client";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "900"] });

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const models = Prisma.dmmf.datamodel.models.map(m => m.name).sort();

  return (
    <div className={`d-flex flex-column flex-md-row ${outfit.className}`} style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      {/* Sidebar */}
      <div className="bg-dark text-white p-4 shadow-lg position-relative z-3 d-flex flex-column" style={{ width: "100%", maxWidth: "280px", borderRight: "1px solid rgba(255,255,255,0.1)", maxHeight: "100vh" }}>
        <Link href="/spr/admin" className="text-white text-decoration-none fs-3 fw-bold mb-4 d-flex align-items-center justify-content-center justify-content-md-start">
          <img src="https://tools.swinfosystems.online/icon-192.png" alt="Swcart logo" style={{ width: "35px", marginRight: "10px" }} />
          <span>Sw<span style={{color: "var(--red)"}}>cart</span></span>
        </Link>
        
        <div className="overflow-auto db-nav flex-grow-1 pe-2">
          <div className="text-uppercase text-muted small fw-bold mb-3" style={{ letterSpacing: "1px" }}>Intelligence Core</div>
          <div className="d-flex flex-column gap-2 mb-4">
            <Link href="/spr/admin" className="text-white text-decoration-none p-3 rounded-3 d-flex align-items-center hover-bg-light-10 transition-all">
              <i className="bi bi-speedometer2 me-3 fs-5 opacity-75"></i> <span className="fw-semibold">Dashboard</span>
            </Link>
            <Link href="/spr/admin/users" className="text-white text-decoration-none p-3 rounded-3 d-flex align-items-center hover-bg-light-10 transition-all">
              <i className="bi bi-people me-3 fs-5 opacity-75"></i> <span className="fw-semibold">User CRM</span>
            </Link>
            <Link href="/spr/admin/sellers" className="text-white text-decoration-none p-3 rounded-3 d-flex align-items-center hover-bg-light-10 transition-all">
              <i className="bi bi-shop me-3 fs-5 opacity-75"></i> <span className="fw-semibold">Seller ERP</span>
            </Link>
            <Link href="/spr/admin/categories" className="text-white text-decoration-none p-3 rounded-3 d-flex align-items-center hover-bg-light-10 transition-all">
              <i className="bi bi-tags me-3 fs-5 opacity-75"></i> <span className="fw-semibold">Category Intel</span>
            </Link>
            <Link href="/spr/admin/orders" className="text-white text-decoration-none p-3 rounded-3 d-flex align-items-center hover-bg-light-10 transition-all">
              <i className="bi bi-receipt me-3 fs-5 opacity-75"></i> <span className="fw-semibold">Logistics</span>
            </Link>
            <Link href="/spr/admin/roles" className="text-white text-decoration-none p-3 rounded-3 d-flex align-items-center hover-bg-light-10 transition-all">
              <i className="bi bi-shield-lock me-3 fs-5 opacity-75"></i> <span className="fw-semibold">Roles</span>
            </Link>
            <Link href="/spr/admin/settings" className="text-white text-decoration-none p-3 rounded-3 d-flex align-items-center hover-bg-light-10 transition-all">
              <i className="bi bi-gear me-3 fs-5 opacity-75"></i> <span className="fw-semibold">Settings</span>
            </Link>
          </div>

          <details className="mb-4">
            <summary className="text-uppercase text-muted small fw-bold mb-3 d-flex justify-content-between align-items-center" style={{ letterSpacing: "1px", cursor: "pointer", userSelect: "none" }}>
              Raw Master Data
              <span className="badge rounded-pill" style={{ backgroundColor: "var(--red)" }}>{models.length}</span>
            </summary>
            
            <div className="d-flex flex-column gap-1 pt-2">
              {models.map(model => (
                <Link key={model} href={`/spr/admin/db/${model.toLowerCase()}`} className="text-white-50 text-decoration-none p-2 rounded-3 d-flex align-items-center hover-bg-light-10 transition-all" style={{ fontSize: "0.9rem" }}>
                  <i className="bi bi-database me-3 opacity-50"></i> {model}
                </Link>
              ))}
            </div>
          </details>
        </div>

        <div className="mt-auto pt-4 border-top border-secondary mt-3">
          <Link href="/" className="text-muted text-decoration-none small d-flex align-items-center justify-content-center justify-content-md-start hover-text-white transition-all fw-semibold">
            <i className="bi bi-arrow-left me-2"></i> Back to Storefront
          </Link>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column" style={{ maxWidth: "100%", overflowX: "hidden", maxHeight: "100vh" }}>
        {/* Top Navbar */}
        <div className="bg-white px-4 py-3 shadow-sm d-flex justify-content-between align-items-center sticky-top z-2">
          <div className="fw-bold text-muted d-none d-md-block text-uppercase" style={{ letterSpacing: "1px", fontSize: "0.85rem" }}>Superadmin Control Panel</div>
          <div className="d-flex align-items-center gap-4 ms-auto">
            <div className="position-relative" style={{ cursor: "pointer" }}>
              <i className="bi bi-bell fs-5 text-dark hover-text-danger transition-all"></i>
              <span className="position-absolute top-0 start-100 translate-middle p-1 border border-light rounded-circle" style={{ backgroundColor: "var(--red)" }}>
                <span className="visually-hidden">New alerts</span>
              </span>
            </div>
            <form action={logoutAction} className="m-0">
              <button type="submit" className="btn btn-sm text-white rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center hover-scale transition-all" style={{ backgroundColor: "var(--red)" }}>
                <i className="bi bi-box-arrow-right me-2"></i> Log Out
              </button>
            </form>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 p-md-5 overflow-auto flex-grow-1" style={{ background: "linear-gradient(180deg, #f3f4f6 0%, #ffffff 100%)" }}>
          {children}
        </div>
      </div>
      <style>{`
        .hover-bg-light-10:hover { background-color: rgba(255,255,255,0.1); color: white !important; transform: translateX(5px); }
        .hover-text-white:hover { color: white !important; }
        .hover-text-danger:hover { color: var(--red) !important; }
        .hover-scale:hover { transform: scale(1.05); }
        .transition-all { transition: all 0.2s ease-in-out; }
        
        /* Custom Scrollbar for Sidebar */
        .db-nav::-webkit-scrollbar { width: 6px; }
        .db-nav::-webkit-scrollbar-track { background: transparent; }
        .db-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        .db-nav::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}
