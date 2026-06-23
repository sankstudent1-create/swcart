import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "900"] });

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const seller = await prisma.seller.findUnique({
    where: { userId }
  });

  if (!seller) {
    redirect("/sell");
  }

  const navLinks = [
    { href: "/seller/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
    { href: "/seller/products", label: "Products Catalog", icon: "bi-box-seam" },
    { href: "/seller/orders", label: "Logistics ERP", icon: "bi-receipt" },
    { href: "/seller/settings", label: "Store Settings", icon: "bi-gear" },
  ];

  const SidebarContent = () => (
    <div className="d-flex flex-column h-100">
      <Link href="/seller/dashboard" className="text-white text-decoration-none fs-3 fw-bold mb-4 d-flex align-items-center justify-content-start">
        <img src="https://tools.swinfosystems.online/icon-192.png" alt="Swcart logo" style={{ width: "35px", marginRight: "10px" }} />
        <span>Sw<span style={{color: "var(--red)"}}>cart</span></span>
      </Link>
      
      <div className="overflow-auto db-nav flex-grow-1 pe-2">
        <div className="text-uppercase text-muted small fw-bold mb-3" style={{ letterSpacing: "1.5px" }}>Vendor Core</div>
        <div className="d-flex flex-column gap-1 mb-4">
          {navLinks.map(link => (
            <a 
              key={link.href} 
              href={link.href} 
              className="text-white text-decoration-none p-3 rounded-3 d-flex align-items-center hover-bg-light-10 transition-all"
            >
              <i className={`bi ${link.icon} me-3 fs-5 opacity-75`}></i> 
              <span className="fw-semibold">{link.label}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4 border-top border-secondary border-opacity-35 mt-3">
        <Link href="/" className="text-muted text-decoration-none small d-flex align-items-center justify-content-start hover-text-white transition-all fw-semibold">
          <i className="bi bi-arrow-left me-2"></i> Back to Storefront
        </Link>
      </div>
    </div>
  );

  return (
    <div className={`d-flex flex-column flex-lg-row ${outfit.className}`} style={{ minHeight: "100vh", backgroundColor: "#f4f5f7" }}>
      
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside 
        className="d-none d-lg-block bg-dark text-white p-4 shadow-lg position-relative z-3 flex-shrink-0" 
        style={{ width: "280px", borderRight: "1px solid rgba(255,255,255,0.1)", height: "100vh", position: "sticky", top: 0 }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Offcanvas Drawer (hidden on desktop) */}
      <div 
        className="offcanvas offcanvas-start bg-dark text-white w-75 d-lg-none" 
        tabIndex={-1} 
        id="sellerSidebarCanvas" 
        aria-labelledby="sellerSidebarLabel"
      >
        <div className="offcanvas-header border-bottom border-secondary border-opacity-25 px-4 py-3">
          <h5 className="offcanvas-title fw-bold text-white" id="sellerSidebarLabel">
            <span className="text-danger">Sw</span>cart Seller Menu
          </h5>
          <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body p-4">
          <SidebarContent />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column" style={{ maxWidth: "100%", overflowX: "hidden" }}>
        
        {/* Top Navbar */}
        <div className="px-4 py-3 d-flex justify-content-between align-items-center sticky-top z-2" style={{ backgroundColor: "#111", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Hamburger toggle button visible on mobile */}
          <button 
            className="btn btn-light border-0 d-lg-none fs-4 p-0 me-3" 
            type="button" 
            data-bs-toggle="offcanvas" 
            data-bs-target="#sellerSidebarCanvas"
            aria-controls="sellerSidebarCanvas"
          >
            <i className="bi bi-list"></i>
          </button>
          
          <div className="fw-bold text-uppercase" style={{ letterSpacing: "1.5px", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
            Seller Merchant Panel
          </div>
          
          <div className="d-flex align-items-center gap-4 ms-auto">
            <div className="d-none d-sm-block px-3 py-1 rounded-pill" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span className="small fw-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Store: </span>
              <strong className="small text-white fw-bold">{seller.companyName}</strong>
            </div>
            
            <div className="position-relative" style={{ cursor: "pointer" }}>
              <i className="bi bi-bell fs-5 text-white hover-text-danger transition-all"></i>
              <span className="position-absolute top-0 start-100 translate-middle p-1 border border-dark rounded-circle" style={{ backgroundColor: "var(--red)" }}>
                <span className="visually-hidden">New alerts</span>
              </span>
            </div>
            
            <form action={logoutAction as any} className="m-0">
              <button type="submit" className="btn btn-sm text-white rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center hover-scale transition-all" style={{ backgroundColor: "var(--red)" }}>
                <i className="bi bi-box-arrow-right me-2"></i> Log Out
              </button>
            </form>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-4 p-md-5 overflow-auto flex-grow-1" style={{ backgroundColor: "#0d0d0d", color: "#fff" }}>
          {children}
        </main>
      </div>
      
      <style>{`
        .hover-bg-light-10:hover { background-color: rgba(255,255,255,0.08); color: white !important; transform: translateX(5px); }
        .hover-text-white:hover { color: white !important; }
        .hover-text-danger:hover { color: var(--red) !important; }
        .hover-scale:hover { transform: scale(1.05); }
        .transition-all { transition: all 0.2s ease-in-out; }
        
        /* Custom Scrollbar for Sidebar */
        .db-nav::-webkit-scrollbar { width: 6px; }
        .db-nav::-webkit-scrollbar-track { background: transparent; }
        .db-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
        .db-nav::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
      `}</style>
    </div>
  );
}
