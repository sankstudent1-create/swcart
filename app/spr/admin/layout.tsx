
import { ReactNode } from "react";
import SuperAdminNav from "@/components/SuperAdminNav";
import { requireSuperAdmin } from "@/lib/roleGuard";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  try {
    await requireSuperAdmin();
  } catch (e) {
    redirect("/login");
    return null;
  }
  return (
    <div className="min-h-screen bg-gray-900 text-white d-flex flex-column">
      {/* Mobile Header Top Bar */}
      <header className="d-lg-none bg-gray-800 border-bottom border-secondary border-opacity-25 px-4 py-3 d-flex justify-content-between align-items-center position-sticky top-0 z-3">
        <Link href="/" className="brand text-decoration-none">
          <div className="name fs-4 fw-bold">Sw<span>cart</span> <span className="small text-muted" style={{ fontSize: "0.8rem", fontWeight: 400 }}>Admin</span></div>
        </Link>
        <button className="btn btn-outline-light border-0 fs-3 p-0" type="button" data-bs-toggle="offcanvas" data-bs-target="#adminSidebarCanvas">
          <i className="bi bi-list"></i>
        </button>
      </header>

      <div className="d-flex flex-grow-1">
        {/* Desktop Sidebar */}
        <aside className="d-none d-lg-block w-64 bg-gray-800 p-4 min-h-screen border-end border-secondary border-opacity-10">
          <div className="brand mb-4 px-2">
            <Link href="/" className="text-decoration-none">
              <div className="name fs-3 fw-bold">Sw<span>cart</span></div>
              <div className="tagline" style={{ fontSize: "0.6rem", letterSpacing: "1px" }}>Admin Panel</div>
            </Link>
          </div>
          <SuperAdminNav />
        </aside>

        {/* Mobile Sidebar Offcanvas */}
        <div className="offcanvas offcanvas-start bg-gray-800 text-white w-75 d-lg-none" tabIndex={-1} id="adminSidebarCanvas" aria-labelledby="adminSidebarLabel">
          <div className="offcanvas-header border-bottom border-secondary border-opacity-25">
            <h5 className="offcanvas-title fw-bold" id="adminSidebarLabel">
              <span className="text-danger">Sw</span>cart Admin Menu
            </h5>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
          <div className="offcanvas-body p-4">
            <SuperAdminNav />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-grow-1 p-4 p-md-5 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
