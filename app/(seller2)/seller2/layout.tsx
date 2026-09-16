import "./seller2.css";
import Link from "next/link";
import React from "react";
import { prisma } from "@/lib/db";

export default async function Seller2Layout({ children }: { children: React.ReactNode }) {
  // Fetch real seller data. In a real app this uses auth session.
  const seller = await prisma.seller.findFirst({
    include: { user: true }
  });

  return (
    <div className="s2-layout">
      {/* Sidebar Navigation */}
      <aside className="s2-sidebar">
        <div className="s2-sidebar-header">
          <Link href="/seller2" className="s2-brand d-flex align-items-center gap-2 text-decoration-none">
            <img src="https://tools.swinfosystems.online/icon-192.png" alt="Swcart" width={32} height={32} style={{borderRadius: 8}} />
            <div className="fw-bolder text-dark" style={{fontSize: "1.2rem"}}>
              Sw<span className="text-danger">cart</span> <span className="text-muted fw-normal" style={{fontSize:"0.9rem"}}>Seller</span>
            </div>
          </Link>
        </div>
        
        <nav className="s2-nav">
          <Link href="/seller2" className="s2-nav-link">
            <i className="bi bi-grid-1x2-fill"></i> Dashboard
          </Link>
          <Link href="/seller2/products" className="s2-nav-link">
            <i className="bi bi-box-seam"></i> Products
          </Link>
          <Link href="/seller2/orders" className="s2-nav-link">
            <i className="bi bi-receipt"></i> Orders
          </Link>
          <Link href="/seller2/returns" className="s2-nav-link">
            <i className="bi bi-arrow-return-left"></i> Returns
          </Link>
          <div className="my-3 border-top border-black opacity-10"></div>
          <Link href="/seller2/wallet" className="s2-nav-link">
            <i className="bi bi-wallet2"></i> Wallet & Payouts
          </Link>
          <Link href="/seller2/support" className="s2-nav-link">
            <i className="bi bi-headset"></i> Support
          </Link>
          <Link href="/seller2/settings" className="s2-nav-link">
            <i className="bi bi-gear"></i> Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="s2-main">
        {/* Topbar */}
        <header className="s2-topbar">
          <div className="d-flex align-items-center gap-3">
            <div className="position-relative">
              <i className="bi bi-search position-absolute text-muted" style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}></i>
              <input type="text" placeholder="Search orders, products..." className="form-control bg-light border-0 ps-5" style={{ borderRadius: "20px", width: "300px" }} />
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-4">
            <Link href="/seller2/products/add" className="s2-btn s2-btn-primary rounded-pill px-4">
              <i className="bi bi-plus-lg"></i> Add Product
            </Link>
            
            <button className="btn btn-link text-dark position-relative p-0 border-0">
              <i className="bi bi-bell fs-5"></i>
              <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"></span>
            </button>
            
            <div className="d-flex align-items-center gap-2 cursor-pointer">
              <img src={`https://ui-avatars.com/api/?name=${seller?.companyName || 'Seller'}&background=random`} alt="Avatar" className="rounded-circle shadow-sm" width="36" height="36" />
              <div className="d-none d-md-block">
                <div className="fw-bold s2-font text-dark" style={{ fontSize: "0.85rem", lineHeight: "1" }}>{seller?.companyName || 'Swcart Seller'}</div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>{seller?.user?.name || 'Vendor Profile'}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="s2-content">
          {children}
        </div>
      </main>
    </div>
  );
}
