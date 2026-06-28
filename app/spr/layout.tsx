import Link from "next/link";
import { logoutAction, checkSuperAdmin } from "@/app/actions/auth";
import { Prisma } from "@prisma/client";
import { Outfit } from "next/font/google";
import { redirect } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "900"] });

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const models = Prisma.dmmf.datamodel.models.map(m => m.name).sort();

  return (
    <div className={`d-flex flex-column flex-lg-row ${outfit.className}`} style={{ minHeight: "100vh", backgroundColor: "#f4f5f7" }}>

      {/* Desktop collapsible sidebar */}
      <AdminSidebar models={models} />

      {/* Mobile Offcanvas Drawer */}
      <div
        className="offcanvas offcanvas-start text-white w-75 d-lg-none"
        tabIndex={-1}
        id="adminSidebarCanvas"
        aria-labelledby="adminSidebarLabel"
        style={{ background: "#0f0f13" }}
      >
        <div className="offcanvas-header border-bottom px-4 py-3" style={{ borderColor: "rgba(255,255,255,0.08) !important" }}>
          <h5 className="offcanvas-title fw-bold text-white" id="adminSidebarLabel">
            Sw<span style={{ color: "#ef4444" }}>cart</span> Admin
          </h5>
          <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close" />
        </div>
        <div className="offcanvas-body p-3" style={{ overflowY: "auto" }}>
          {/* Mobile nav links */}
          <div className="d-flex flex-column gap-1">
            {[
              { href: "/spr/admin", label: "Dashboard", icon: "bi-speedometer2" },
              { href: "/spr/admin/users", label: "User CRM", icon: "bi-people" },
              { href: "/spr/admin/sellers", label: "Seller ERP", icon: "bi-shop" },
              { href: "/spr/admin/categories", label: "Category Intel", icon: "bi-tags" },
              { href: "/spr/admin/products", label: "Products Catalog", icon: "bi-box-seam" },
              { href: "/spr/admin/digital", label: "Digital Products", icon: "bi-collection-play" },
              { href: "/spr/admin/digital-logs", label: "Digital Access Logs", icon: "bi-shield-check" },
              { href: "/spr/admin/orders", label: "Order Ledger", icon: "bi-receipt" },
              { href: "/spr/admin/logistics", label: "Logistics Hub", icon: "bi-truck" },
              { href: "/spr/admin/support", label: "Support Helpdesk", icon: "bi-headset" },
              { href: "/spr/admin/coupons", label: "Coupons", icon: "bi-tag" },
              { href: "/spr/admin/offers", label: "Offers Hub", icon: "bi-gift" },
              { href: "/spr/admin/referrals", label: "Referral Program", icon: "bi-share" },
              { href: "/spr/admin/roles", label: "Access Roles", icon: "bi-shield-lock" },
              { href: "/spr/admin/settings", label: "Settings", icon: "bi-gear" },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, color: "rgba(255,255,255,0.65)", textDecoration: "none", fontWeight: 600, fontSize: "0.85rem" }}
              >
                <i className={`bi ${link.icon}`} style={{ fontSize: "1rem", width: 18, textAlign: "center", color: "rgba(255,255,255,0.4)" }} />
                {link.label}
              </a>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 12, paddingTop: 12 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, color: "rgba(255,255,255,0.4)", textDecoration: "none", fontWeight: 600, fontSize: "0.82rem" }}>
              <i className="bi bi-arrow-left" /> Back to Storefront
            </Link>
            <form action={logoutAction as any}>
              <button type="submit" style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>
                <i className="bi bi-box-arrow-right" style={{ color: "#ef4444" }} /> Log Out
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column" style={{ maxWidth: "100%", overflowX: "hidden", minWidth: 0 }}>

        {/* Top Navbar */}
        <div style={{ background: "#fff", padding: "10px 20px", boxShadow: "0 1px 0 rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 20 }}>
          {/* Mobile hamburger */}
          <button
            className="btn btn-light border-0 d-lg-none p-1"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#adminSidebarCanvas"
            aria-controls="adminSidebarCanvas"
          >
            <i className="bi bi-list fs-4" />
          </button>

          <div style={{ fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "1.5px", fontSize: "0.75rem" }}>
            Superadmin Control Panel
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Notification bell */}
            <div style={{ position: "relative", cursor: "pointer" }}>
              <i className="bi bi-bell" style={{ fontSize: "1.1rem", color: "#374151" }} />
              <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, background: "#ef4444", borderRadius: "50%", border: "2px solid #fff" }} />
            </div>

            {/* Admin badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", background: "#f8f9fb", borderRadius: 99, border: "1px solid #e5e7eb" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#ef4444,#dc2626)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.7rem", fontWeight: 800 }}>SA</div>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151" }}>Super Admin</span>
            </div>

            <form action={logoutAction as any} style={{ margin: 0 }}>
              <button type="submit" style={{ padding: "6px 16px", background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: 99, color: "#fff", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <i className="bi bi-box-arrow-right" /> Log Out
              </button>
            </form>
          </div>
        </div>

        {/* Page Content */}
        <main style={{ flex: 1, padding: "28px 24px", backgroundColor: "#f4f5f7", overflowAuto: "auto" } as any}>
          {children}
        </main>
      </div>

      <style>{`
        .hover-text-danger:hover { color: var(--red) !important; }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
    </div>
  );
}
