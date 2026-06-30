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
    <div className="d-flex" style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <div 
        className={`d-flex flex-column transition-all ${sidebarOpen ? 'w-250px' : 'w-0 overflow-hidden'}`}
        style={{ 
          width: sidebarOpen ? '280px' : '0', 
          transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
          zIndex: 1000,
          background: "rgba(20,20,25,0.6)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255,255,255,0.05)"
        }}
      >
        <div className="p-4 border-bottom border-secondary border-opacity-10 d-flex align-items-center justify-content-between position-relative overflow-hidden">
          {/* Neon Glow effect */}
          <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: "radial-gradient(circle at top left, rgba(230,57,70,0.15) 0%, transparent 70%)", zIndex: -1 }}></div>
          
          <Link href="/superad" className="text-decoration-none d-flex align-items-center gap-3 text-white z-1">
            <div className="bg-danger text-white rounded shadow-sm d-flex align-items-center justify-content-center position-relative" style={{ width: 36, height: 36 }}>
              <i className="bi bi-shield-shaded fs-5"></i>
              <div className="position-absolute top-0 start-100 translate-middle p-1 bg-warning border border-light rounded-circle pulse-dot"></div>
            </div>
            <div>
              <span className="fw-bolder fs-5 tracking-wide text-uppercase d-block lh-1" style={{ letterSpacing: "1px" }}>GOD MODE</span>
              <span className="text-danger small fw-bold" style={{ fontSize: "0.65rem", letterSpacing: "2px" }}>SYSTEM ADMIN</span>
            </div>
          </Link>
          <button className="btn btn-sm btn-link text-white d-md-none" onClick={() => setSidebarOpen(false)}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="flex-grow-1 overflow-auto p-3 custom-scrollbar">
          <div className="mb-4">
            <Link 
              href="/superad" 
              className={`d-flex align-items-center py-2 px-3 rounded-3 text-decoration-none mb-1 fw-bold ${pathname === '/superad' ? 'text-white' : 'text-secondary hover-text-white'}`}
              style={{ 
                transition: 'all 0.3s', 
                background: pathname === '/superad' ? 'linear-gradient(90deg, rgba(230,57,70,0.2) 0%, transparent 100%)' : 'transparent',
                borderLeft: pathname === '/superad' ? '3px solid #e63946' : '3px solid transparent'
              }}
            >
              <i className={`bi bi-grid-1x2-fill me-3 ${pathname === '/superad' ? 'text-danger' : ''}`}></i> Command Center
            </Link>
          </div>

          <div className="text-uppercase fw-bolder text-secondary small tracking-wide mb-3 px-3" style={{ fontSize: '0.65rem', letterSpacing: '2px' }}>
            Operational Hubs
          </div>

          <div className="d-flex flex-column gap-1">
            {HUBS.map(hub => {
              const isActive = pathname.startsWith(`/superad/${hub.id}`);
              return (
                <Link 
                  key={hub.id}
                  href={`/superad/${hub.id}`}
                  className={`d-flex align-items-center py-2 px-3 rounded-3 text-decoration-none fs-6 ${isActive ? 'text-white' : 'text-secondary hover-text-white'}`}
                  style={{ 
                    transition: 'all 0.3s', 
                    fontSize: '0.9rem',
                    background: isActive ? 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, transparent 100%)' : 'transparent',
                    borderLeft: isActive ? `3px solid var(--bs-${hub.id === 'logistics' ? 'warning' : hub.id === 'sellers' ? 'success' : 'info'})` : '3px solid transparent'
                  }}
                >
                  <i className={`bi ${hub.icon} me-3 ${isActive ? 'text-light' : 'opacity-50'}`}></i> 
                  <span className="fw-semibold">{hub.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
        
        <div className="p-4 border-top border-secondary border-opacity-10" style={{ background: "rgba(0,0,0,0.2)" }}>
          <Link href="/spr/admin" className="btn btn-dark w-100 rounded-3 small fw-bold border border-secondary border-opacity-25 d-flex align-items-center justify-content-center gap-2" style={{ transition: "all 0.3s" }}>
            <i className="bi bi-box-arrow-left text-muted"></i> Exit God Mode
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column position-relative overflow-hidden" style={{ minWidth: 0, background: "radial-gradient(circle at 50% -20%, #1a1a2e 0%, #050508 80%)" }}>
        
        {/* Animated background particles/grid could go here */}
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 }}></div>

        <div className="px-4 py-3 d-flex align-items-center justify-content-between position-relative z-1" style={{ background: "rgba(5, 5, 8, 0.7)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="d-flex align-items-center">
            <button className="btn btn-sm btn-link text-white me-3 p-0" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <i className="bi bi-list fs-4"></i>
            </button>
            <div className="fs-5 fw-bold text-white d-flex align-items-center tracking-wide">
              Data Control Center
              <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-50 ms-3 px-2 py-1 rounded-pill fw-bold font-monospace" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>RESTRICTED ZONE</span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="text-end d-none d-md-block">
              <div className="fw-bold text-white text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Super Administrator</div>
              <div className="text-success small d-flex align-items-center justify-content-end gap-1" style={{ fontSize: "0.7rem" }}><div className="pulse-dot bg-success rounded-circle" style={{width: 6, height: 6}}></div> System Online</div>
            </div>
            <div className="rounded-circle bg-secondary bg-opacity-50 d-flex align-items-center justify-content-center text-white border border-secondary border-opacity-50" style={{ width: 40, height: 40 }}>
              <i className="bi bi-person-fill"></i>
            </div>
          </div>
        </div>

        <div className="flex-grow-1 p-4 p-md-5 overflow-auto position-relative z-1 custom-scrollbar">
          {children}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hover-bg-dark:hover { background-color: rgba(255,255,255,0.05); color: #fff !important; }
        .hover-text-white:hover { color: #fff !important; }
        .backdrop-blur { backdrop-filter: blur(10px); }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; border: 2px solid #050508; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .pulse-dot { animation: pulse 2s infinite; }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(var(--bs-success-rgb), 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(var(--bs-success-rgb), 0); }
          100% { box-shadow: 0 0 0 0 rgba(var(--bs-success-rgb), 0); }
        }
      `}} />
    </div>
  );
}
