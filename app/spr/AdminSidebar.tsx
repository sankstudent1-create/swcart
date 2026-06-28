"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/actions/auth";

const navGroups = [
  {
    label: "Core Intelligence",
    links: [
      { href: "/spr/admin", label: "Dashboard", icon: "bi-speedometer2", exact: true },
      { href: "/spr/admin/users", label: "User CRM", icon: "bi-people" },
      { href: "/spr/admin/sellers", label: "Seller ERP", icon: "bi-shop" },
    ]
  },
  {
    label: "Catalog",
    links: [
      { href: "/spr/admin/categories", label: "Category Intel", icon: "bi-tags" },
      { href: "/spr/admin/products", label: "Products Catalog", icon: "bi-box-seam" },
      { href: "/spr/admin/digital", label: "Digital Products", icon: "bi-collection-play" },
      { href: "/spr/admin/digital-logs", label: "Digital Access Logs", icon: "bi-shield-check" },
    ]
  },
  {
    label: "Operations",
    links: [
      { href: "/spr/admin/orders", label: "Order Ledger", icon: "bi-receipt" },
      { href: "/spr/admin/logistics", label: "Logistics Hub", icon: "bi-truck" },
      { href: "/spr/admin/support", label: "Support Helpdesk", icon: "bi-headset" },
    ]
  },
  {
    label: "Marketing",
    links: [
      { href: "/spr/admin/coupons", label: "Coupons", icon: "bi-tag" },
      { href: "/spr/admin/offers", label: "Offers Hub", icon: "bi-gift" },
      { href: "/spr/admin/referrals", label: "Referral Program", icon: "bi-share" },
    ]
  },
  {
    label: "System",
    links: [
      { href: "/spr/admin/roles", label: "Access Roles", icon: "bi-shield-lock" },
      { href: "/spr/admin/settings", label: "Settings", icon: "bi-gear" },
    ]
  }
];

export default function AdminSidebar({ models }: { models: string[] }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [dbOpen, setDbOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <style>{`
        .spr-sidebar { transition: width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1); }
        .spr-nav-link { transition: all 0.15s ease; text-decoration: none; border-radius: 10px; display: flex; align-items: center; gap: 10px; padding: 9px 10px; color: rgba(255,255,255,0.6); font-weight: 600; font-size: 0.83rem; white-space: nowrap; overflow: hidden; }
        .spr-nav-link:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .spr-nav-link.active { background: rgba(239,68,68,0.18); color: #fff; }
        .spr-nav-link.active i { color: #ef4444; }
        .spr-nav-link i { font-size: 1rem; flex-shrink: 0; width: 18px; text-align: center; }
        .spr-group-label { font-size: 0.6rem; font-weight: 800; letter-spacing: 0.1em; color: rgba(255,255,255,0.25); text-transform: uppercase; padding: 4px 10px 4px; white-space: nowrap; overflow: hidden; }
        .spr-collapse-btn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: rgba(255,255,255,0.5); transition: all 0.15s; flex-shrink: 0; }
        .spr-collapse-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .spr-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 6px 10px; }
        .spr-db-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 8px; color: rgba(255,255,255,0.4); font-size: 0.75rem; font-weight: 500; text-decoration: none; white-space: nowrap; overflow: hidden; transition: all 0.15s; }
        .spr-db-item:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.75); }
        .spr-scrollbar::-webkit-scrollbar { width: 3px; }
        .spr-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }
      `}</style>

      <aside
        className="spr-sidebar d-none d-lg-flex flex-column"
        style={{
          width: collapsed ? 62 : 260,
          minWidth: collapsed ? 62 : 260,
          height: "100vh",
          position: "sticky",
          top: 0,
          background: "linear-gradient(180deg, #0f0f13 0%, #111118 100%)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          zIndex: 30,
          overflow: "hidden",
        }}
      >
        {/* Logo + Collapse Toggle */}
        <div style={{ padding: "16px 12px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <Link href="/spr/admin" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", overflow: "hidden" }}>
            <img src="https://tools.swinfosystems.online/icon-192.png" alt="Swcart" style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0 }} />
            {!collapsed && (
              <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff", whiteSpace: "nowrap" }}>
                Sw<span style={{ color: "#ef4444" }}>cart</span>
              </span>
            )}
          </Link>
          <button className="spr-collapse-btn" onClick={() => setCollapsed(c => !c)} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <i className={`bi ${collapsed ? "bi-chevron-double-right" : "bi-chevron-double-left"}`} style={{ fontSize: "0.75rem" }} />
          </button>
        </div>

        {/* Nav Links */}
        <div className="spr-scrollbar" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "10px 8px" }}>
          {navGroups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 4 }}>
              {!collapsed && <div className="spr-group-label">{group.label}</div>}
              {collapsed && gi > 0 && <div className="spr-divider" />}
              {group.links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`spr-nav-link ${isActive(link.href, link.exact) ? "active" : ""}`}
                  title={collapsed ? link.label : undefined}
                >
                  <i className={`bi ${link.icon}`} />
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              ))}
            </div>
          ))}

          {/* Raw DB section */}
          <div className="spr-divider" style={{ margin: "10px 0" }} />
          {!collapsed ? (
            <div>
              <button
                onClick={() => setDbOpen(o => !o)}
                style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 10px 6px", color: "rgba(255,255,255,0.25)" }}
              >
                <span style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>Raw Master Data</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ background: "#ef4444", color: "#fff", borderRadius: 999, padding: "1px 6px", fontSize: "0.6rem", fontWeight: 800 }}>{models.length}</span>
                  <i className={`bi ${dbOpen ? "bi-chevron-up" : "bi-chevron-down"}`} style={{ fontSize: "0.65rem" }} />
                </span>
              </button>
              {dbOpen && (
                <div style={{ maxHeight: 220, overflowY: "auto" }}>
                  {models.map(m => (
                    <a key={m} href={`/spr/admin/db/${m.toLowerCase()}`} className="spr-db-item">
                      <i className="bi bi-database" style={{ fontSize: "0.75rem", flexShrink: 0 }} />{m}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link href="/spr/admin/db" className="spr-nav-link" title="Raw Master Data">
              <i className="bi bi-database" />
            </Link>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <Link href="/" className="spr-nav-link" title="Back to Storefront">
            <i className="bi bi-arrow-left" />
            {!collapsed && <span style={{ fontSize: "0.8rem" }}>Back to Storefront</span>}
          </Link>
          <form action={logoutAction as any} style={{ marginTop: 4 }}>
            <button type="submit" className="spr-nav-link" style={{ width: "100%", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
              <i className="bi bi-box-arrow-right" style={{ color: "#ef4444" }} />
              {!collapsed && <span>Log Out</span>}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
