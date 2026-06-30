"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const HUBS = [
  { id: "users", label: "Identity & Access", icon: "bi-people-fill", desc: "Manage users and roles" },
  { id: "sellers", label: "Vendor Command", icon: "bi-shop-window", desc: "Manage sellers & KYC" },
  { id: "logistics", label: "Fleet & Hubs", icon: "bi-truck", desc: "Manage delivery network" },
  { id: "commerce", label: "Catalog & Orders", icon: "bi-cart-check-fill", desc: "Manage sales & products" }
];

export default function SuperadLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="d-flex" style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <div 
        className={`bg-dark border-end border-secondary border-opacity-25 d-flex flex-column transition-all ${sidebarOpen ? 'w-250px' : 'w-0 overflow-hidden'}`}
        style={{ width: sidebarOpen ? '280px' : '0', transition: 'width 0.3s ease', zIndex: 1000 }}
      >
        <div className="p-4 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
          <Link href="/superad" className="text-decoration-none d-flex align-items-center gap-2 text-white">
            <div className="bg-danger text-white rounded p-1 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
              <i className="bi bi-shield-lock-fill fs-5"></i>
            </div>
            <span className="fw-bolder fs-5 tracking-wide text-uppercase" style={{ letterSpacing: "1px" }}>GOD MODE</span>
          </Link>
          <button className="btn btn-sm btn-link text-white d-md-none" onClick={() => setSidebarOpen(false)}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="flex-grow-1 overflow-auto p-3 custom-scrollbar">
          <div className="mb-4">
            <Link 
              href="/superad" 
              className={`d-block py-2 px-3 rounded-3 text-decoration-none mb-1 fw-semibold ${pathname === '/superad' ? 'bg-danger text-white' : 'text-secondary hover-bg-dark'}`}
              style={{ transition: 'all 0.2s' }}
            >
              <i className="bi bi-grid-1x2-fill me-2"></i> Dashboard Overview
            </Link>
          </div>

          <div className="text-uppercase fw-bolder text-muted small tracking-wide mb-3 px-3" style={{ fontSize: '0.65rem', letterSpacing: '1.5px' }}>
            Operational Hubs
          </div>

          <div className="d-flex flex-column gap-2">
            {HUBS.map(hub => {
              const isActive = pathname.startsWith(`/superad/${hub.id}`);
              return (
                <Link 
                  key={hub.id}
                  href={`/superad/${hub.id}`}
                  className={`d-block py-2 px-3 rounded-3 text-decoration-none fs-6 ${isActive ? 'bg-secondary bg-opacity-25 text-white fw-bold border border-secondary border-opacity-50' : 'text-secondary hover-text-white border border-transparent'}`}
                  style={{ transition: 'all 0.2s', fontSize: '0.9rem' }}
                >
                  <i className={`bi ${hub.icon} me-2 ${isActive ? 'text-info' : 'opacity-50'}`}></i> 
                  {hub.label}
                </Link>
              );
            })}
          </div>
        </div>
        
        <div className="p-3 border-top border-secondary border-opacity-25">
          <Link href="/spr/admin" className="btn btn-outline-secondary w-100 rounded-3 small fw-bold">
            <i className="bi bi-arrow-left me-2"></i> Back to Standard Admin
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0, background: "radial-gradient(circle at top right, #1a1a2e 0%, #0a0a0f 100%)" }}>
        <div className="px-4 py-3 border-bottom border-secondary border-opacity-25 d-flex align-items-center bg-dark bg-opacity-50 backdrop-blur">
          <button className="btn btn-sm btn-outline-secondary me-3" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <i className="bi bi-list fs-5"></i>
          </button>
          <div className="fs-5 fw-bold text-white d-flex align-items-center">
            SuperAdmin Unified Data Manager
            <span className="badge bg-danger ms-3 px-2 py-1 rounded-pill fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>RESTRICTED ACCESS</span>
          </div>
        </div>

        <div className="flex-grow-1 p-4 p-md-5 overflow-auto">
          {children}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hover-bg-dark:hover { background-color: rgba(255,255,255,0.05); color: #fff !important; }
        .hover-text-white:hover { color: #fff !important; }
        .backdrop-blur { backdrop-filter: blur(10px); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />
    </div>
  );
}
