import Link from "next/link";
import { checkSession, getSessionUserId, checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import CartWishlistCounts from "./CartWishlistCounts";

export default async function Header() {
  const userId = await getSessionUserId();
  const isSuperAdmin = await checkSuperAdmin();
  // Cart and wishlist counts are fetched client-side via CartWishlistCounts
  let user = null;

  if (userId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } }
    });
    user = dbUser;
  }

  const dbCategories = await prisma.category.findMany({
    where: { parentId: null },
    include: { children: true },
    take: 8
  });

  const categories = dbCategories.length > 0 ? dbCategories : [
    { id: "c1", name: "Electronics", children: [{ id: "c1_1", name: "Smartphones" }, { id: "c1_2", name: "Headphones" }, { id: "c1_3", name: "Laptops" }] },
    { id: "c2", name: "Fashion", children: [{ id: "c2_1", name: "Menswear" }, { id: "c2_2", name: "Womenswear" }, { id: "c2_3", name: "Accessories" }] },
    { id: "c3", name: "Home & Kitchen", children: [{ id: "c3_1", name: "Cookware" }, { id: "c3_2", name: "Furniture" }] },
    { id: "c4", name: "Grocery", children: [{ id: "c4_1", name: "Pantry Staples" }, { id: "c4_2", name: "Beverages" }] },
  ];

  const isSeller = user?.roles?.some((r: any) => r.role.name === "SELLER") || false;
  const isWarehouseManager = user?.roles?.some((r: any) => r.role.name === "WAREHOUSE_MANAGER") || false;
  const isDeliveryAgent = user?.roles?.some((r: any) => r.role.name === "DELIVERY") || false;

  return (
    <>
      <div className="util-bar">
        <div className="container d-flex justify-content-between">
          <div>Free delivery on orders above ₹499</div>
          <div className="d-none d-md-block">
            <Link href="/track-order">Track Order</Link>
            <Link href="/help">Help Center</Link>
            <Link href="/sell">Sell on Swcart</Link>
          </div>
        </div>
      </div>

      <header className="site-header font-jakarta">
        <div className="container">
          <div className="row align-items-center g-3">
            <div className="col-6 col-lg-2 d-flex align-items-center gap-2">
              <button className="hamburger-btn" id="menuToggle" data-bs-toggle="offcanvas" data-bs-target="#menuCanvas">
                <i className="bi bi-list"></i>
              </button>
              <Link href="/" className="brand">
                <img src="https://tools.swinfosystems.online/icon-192.png" alt="Swcart logo" />
                <div>
                  <div className="name">Sw<span>cart</span></div>
                  <div className="tagline d-none d-sm-block">Everything, one cart</div>
                </div>
              </Link>
            </div>
            
            <div className="col-12 col-lg-6 order-3 order-lg-2">
              <div className="search-wrap">
                <i className="bi bi-search"></i>
                <input type="text" id="searchInput" placeholder="Search for products, brands and more" autoComplete="off" />
                <button id="searchBtn">Search</button>
                <div className="search-results" id="searchResults"></div>
              </div>
            </div>
            
            <div className="col-6 col-lg-4 order-2 order-lg-3">
              <div className="d-flex justify-content-end gap-3">
                {isSuperAdmin && (
                  <Link href="/spr/admin" className="header-icon-btn d-none d-sm-flex text-danger">
                    <i className="bi bi-speedometer2"></i>
                    <span className="d-none d-md-inline">Admin</span>
                  </Link>
                )}
                {userId ? (
                  <div className="dropdown d-none d-sm-flex">
                    <button className="header-icon-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false" style={{ background: "transparent", border: "none" }}>
                      <i className="bi bi-person-circle"></i>
                      <span className="d-none d-md-inline ms-1">Account</span>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-3 rounded-4" style={{ minWidth: "220px", fontSize: "0.9rem" }}>
                      <li><div className="dropdown-header fw-bold text-dark fs-6">{user?.name}</div></li>
                      <li><Link className="dropdown-item py-2 d-flex align-items-center" href="/profile"><i className="bi bi-person me-3 text-muted fs-5"></i> My Profile</Link></li>
                      <li><Link className="dropdown-item py-2 d-flex align-items-center" href="/profile"><i className="bi bi-box-seam me-3 text-muted fs-5"></i> My Orders</Link></li>
                      
                      {isSeller && (
                        <>
                          <li><hr className="dropdown-divider opacity-10" /></li>
                          <li><Link className="dropdown-item py-2 text-warning fw-bold d-flex align-items-center" href="/seller/dashboard"><i className="bi bi-shop me-3 fs-5"></i> Seller Portal</Link></li>
                        </>
                      )}
                      {isWarehouseManager && (
                        <li><Link className="dropdown-item py-2 text-info fw-bold d-flex align-items-center" href="/warehouse"><i className="bi bi-building me-3 fs-5"></i> Hub Manager</Link></li>
                      )}
                      {isDeliveryAgent && (
                        <li><Link className="dropdown-item py-2 text-success fw-bold d-flex align-items-center" href="/delivery"><i className="bi bi-truck me-3 fs-5"></i> Driver App</Link></li>
                      )}
                    </ul>
                  </div>
                ) : (
                  <Link href="/login" className="header-icon-btn d-none d-sm-flex" style={{color: "var(--red)"}}>
                    <i className="bi bi-box-arrow-in-right"></i>
                    <span className="d-none d-md-inline">Login / Sign Up</span>
                  </Link>
                )}
                <CartWishlistCounts />
              </div>
            </div>
            
          </div>
        </div>
      </header>

      {/* Desktop Mega Menu Bar */}
      <nav className="mega-menu-bar d-none d-lg-block border-bottom border-light bg-white shadow-sm position-relative z-3">
        <div className="container">
          <div className="d-flex align-items-center gap-4 py-1">
            {categories.map((cat: any) => (
              <div key={cat.id} className="mega-menu-item position-relative">
                <Link href={`/categories?id=${cat.id}`} className="nav-link fw-semibold py-2 d-flex align-items-center gap-1 text-dark hover-red" style={{ fontSize: "0.9rem" }}>
                  {cat.name} <i className="bi bi-chevron-down small" style={{ fontSize: "0.7rem" }}></i>
                </Link>
                {cat.children && cat.children.length > 0 && (
                  <div className="mega-menu-dropdown position-absolute bg-white rounded-3 shadow-lg p-4 border border-light dropdown-animate" style={{ top: "100%", left: 0, minWidth: "500px", zIndex: 1000 }}>
                    <div className="row">
                      <div className="col-6">
                        <h6 className="fw-bold mb-3 text-danger">{cat.name} Departments</h6>
                        <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                          {cat.children.map((sub: any) => (
                            <li key={sub.id}>
                              <Link href={`/categories?id=${sub.id}`} className="text-decoration-none text-muted hover-red small">
                                {sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="col-6 bg-light rounded-3 p-3 d-flex flex-column justify-content-between">
                        <div>
                          <h6 className="fw-bold mb-1 small text-dark">International Shipping Available</h6>
                          <p className="text-muted small mb-0">Get quality goods delivered directly to your doorstep globally.</p>
                        </div>
                        <Link href={`/categories?id=${cat.id}`} className="btn btn-danger btn-sm rounded-pill fw-bold mt-3 align-self-start">
                          Explore All
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Offcanvas Drawer */}
      <div className="offcanvas offcanvas-start border-0 shadow-lg premium-sidebar" tabIndex={-1} id="menuCanvas" aria-labelledby="menuCanvasLabel">
        <div className="offcanvas-header p-4 d-flex justify-content-between align-items-center position-relative z-2">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-gradient-primary p-1 rounded-3 shadow-sm" style={{ background: "var(--red)" }}>
              <img src="https://tools.swinfosystems.online/icon-192.png" alt="Swcart logo" style={{ width: "28px", height: "28px", borderRadius: "6px" }} />
            </div>
            <h5 className="offcanvas-title fw-bolder mb-0 font-jakarta tracking-tight text-white" id="menuCanvasLabel">
              <span className="text-danger">Sw</span>cart
            </h5>
          </div>
          <button type="button" className="btn-close btn-close-white opacity-75 hover-opacity-100 transition-all" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        
        <div className="offcanvas-body p-0 d-flex flex-column custom-scrollbar">
          {/* User Profile Header */}
          <div className="p-4 mx-3 my-2 rounded-4 premium-user-card position-relative overflow-hidden">
            <div className="premium-glow"></div>
            {user ? (
              <div className="d-flex align-items-center gap-3 position-relative z-2">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="shadow-lg border border-light border-opacity-25" style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div className="avatar-placeholder rounded-circle bg-gradient-danger text-white d-flex align-items-center justify-content-center fw-bolder shadow-lg border border-light border-opacity-10" style={{ width: "56px", height: "56px", fontSize: "1.4rem" }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h6 className="fw-bolder mb-1 text-white font-jakarta">{user.name}</h6>
                  <p className="text-white-50 small mb-0 text-truncate font-jakarta" style={{ maxWidth: "160px" }}>{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-3 position-relative z-2">
                <p className="text-white-50 small mb-3 font-jakarta">Sign in to sync your cart & track orders.</p>
                <a href="/login" className="btn btn-danger w-100 rounded-pill py-2.5 fw-bolder shadow-lg d-flex align-items-center justify-content-center gap-2 transition-all hover-scale">
                  <i className="bi bi-box-arrow-in-right"></i> Log In / Sign Up
                </a>
              </div>
            )}
          </div>

          {/* Nav Items */}
          <div className="p-3 flex-grow-1">
            <nav className="d-flex flex-column gap-2 font-jakarta">
              <div className="nav-group-label text-uppercase text-white-50 small fw-bold tracking-wide ms-3 mb-2 mt-2">Shopping</div>
              <a href="/" className="premium-nav-item">
                <div className="nav-icon-wrapper bg-white bg-opacity-10"><i className="bi bi-house text-white"></i></div>
                <span className="fw-semibold">Home</span>
              </a>
              
              {user && (
                <a href="/profile" className="premium-nav-item">
                  <div className="nav-icon-wrapper bg-white bg-opacity-10"><i className="bi bi-person-circle text-white"></i></div>
                  <span className="fw-semibold">My Profile</span>
                </a>
              )}
              
              <div className="premium-nav-item-container">
                <CartWishlistCounts />
              </div>
              
              <a href="/track-order" className="premium-nav-item">
                <div className="nav-icon-wrapper bg-white bg-opacity-10"><i className="bi bi-geo-alt text-white"></i></div>
                <span className="fw-semibold">Track Order</span>
              </a>
              
              <div className="nav-group-label text-uppercase text-white-50 small fw-bold tracking-wide ms-3 mb-2 mt-4">More</div>
              
              <a href="/sell" className="premium-nav-item">
                <div className="nav-icon-wrapper bg-white bg-opacity-10"><i className="bi bi-shop text-white"></i></div>
                <span className="fw-semibold">Become a Seller</span>
              </a>
              
              <a href="/help" className="premium-nav-item">
                <div className="nav-icon-wrapper bg-white bg-opacity-10"><i className="bi bi-question-circle text-white"></i></div>
                <span className="fw-semibold">Help Center</span>
              </a>

              {(isSeller || isWarehouseManager || isDeliveryAgent || isSuperAdmin) && (
                <div className="nav-group-label text-uppercase text-white-50 small fw-bold tracking-wide ms-3 mb-2 mt-4">Portals</div>
              )}

              {isSeller && (
                <a href="/seller/dashboard" className="premium-nav-item portal-item seller-portal">
                  <div className="nav-icon-wrapper"><i className="bi bi-graph-up-arrow text-warning"></i></div>
                  <span className="fw-bold text-warning">Seller Dashboard</span>
                </a>
              )}

              {isWarehouseManager && (
                <a href="/warehouse" className="premium-nav-item portal-item hub-portal">
                  <div className="nav-icon-wrapper"><i className="bi bi-building text-info"></i></div>
                  <span className="fw-bold text-info">Hub Manager Portal</span>
                </a>
              )}

              {isDeliveryAgent && (
                <a href="/delivery" className="premium-nav-item portal-item driver-portal">
                  <div className="nav-icon-wrapper"><i className="bi bi-truck text-success"></i></div>
                  <span className="fw-bold text-success">Driver App</span>
                </a>
              )}

              {isSuperAdmin && (
                <a href="/spr/admin" className="premium-nav-item portal-item admin-portal">
                  <div className="nav-icon-wrapper"><i className="bi bi-speedometer2 text-danger"></i></div>
                  <span className="fw-bold text-danger">Admin Control Panel</span>
                </a>
              )}
            </nav>
          </div>
          
          <div className="p-4 border-top border-light border-opacity-10 text-center">
            <p className="text-white-50 small mb-0 font-jakarta">© 2026 Swcart. All rights reserved.</p>
          </div>
        </div>

        <style>{`
          .premium-sidebar {
            background: linear-gradient(145deg, rgba(20,18,22,0.98) 0%, rgba(38,28,33,0.98) 100%) !important;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            width: 320px;
          }
          
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
          
          .tracking-tight { letter-spacing: -0.02em; }
          .tracking-wide { letter-spacing: 0.1em; }
          .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
          
          .premium-user-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          }
          .premium-glow {
            position: absolute;
            top: -50%; left: -50%;
            width: 200%; height: 200%;
            background: radial-gradient(circle at center, rgba(232, 71, 42, 0.15) 0%, transparent 60%);
            opacity: 0.5;
            pointer-events: none;
          }
          .bg-gradient-danger {
            background: linear-gradient(135deg, #e63946 0%, #c1121f 100%);
          }
          
          .premium-nav-item {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 12px 16px;
            border-radius: 12px;
            color: rgba(255, 255, 255, 0.75);
            text-decoration: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            font-size: 0.95rem;
          }
          .premium-nav-item::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(255, 255, 255, 0.05);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .premium-nav-item:hover {
            color: #fff;
            transform: translateX(4px);
          }
          .premium-nav-item:hover::before {
            opacity: 1;
          }
          .premium-nav-item .nav-icon-wrapper {
            width: 36px; height: 36px;
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            color: #fff !important;
          }
          .premium-nav-item:hover .nav-icon-wrapper {
            transform: scale(1.1) rotate(5deg);
            background: var(--red) !important;
            box-shadow: 0 4px 12px rgba(232, 71, 42, 0.3);
          }
          
          .portal-item { border: 1px solid transparent; }
          .seller-portal { background: rgba(255, 193, 7, 0.03); border-color: rgba(255, 193, 7, 0.1); }
          .seller-portal:hover .nav-icon-wrapper { background: rgba(255, 193, 7, 0.2) !important; box-shadow: 0 4px 12px rgba(255, 193, 7, 0.2); }
          
          .hub-portal { background: rgba(13, 202, 240, 0.03); border-color: rgba(13, 202, 240, 0.1); }
          .hub-portal:hover .nav-icon-wrapper { background: rgba(13, 202, 240, 0.2) !important; box-shadow: 0 4px 12px rgba(13, 202, 240, 0.2); }
          
          .driver-portal { background: rgba(25, 135, 84, 0.03); border-color: rgba(25, 135, 84, 0.1); }
          .driver-portal:hover .nav-icon-wrapper { background: rgba(25, 135, 84, 0.2) !important; box-shadow: 0 4px 12px rgba(25, 135, 84, 0.2); }
          
          .admin-portal { background: rgba(232, 71, 42, 0.03); border-color: rgba(232, 71, 42, 0.1); }
          .admin-portal:hover .nav-icon-wrapper { background: rgba(232, 71, 42, 0.2) !important; box-shadow: 0 4px 12px rgba(232, 71, 42, 0.2); }

          .hover-scale { transition: transform 0.2s ease; }
          .hover-scale:hover { transform: scale(1.03); }
          
          .premium-nav-item-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .premium-nav-item-container > a.header-icon-btn {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 12px 16px !important;
            border-radius: 12px !important;
            color: rgba(255, 255, 255, 0.75) !important;
            text-decoration: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            background: transparent !important;
            border: none;
            width: 100%;
            justify-content: flex-start;
          }
          
          .premium-nav-item-container > a.header-icon-btn::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(255, 255, 255, 0.05);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .premium-nav-item-container > a.header-icon-btn:hover {
            color: #fff !important;
            transform: translateX(4px);
          }
          .premium-nav-item-container > a.header-icon-btn:hover::before {
            opacity: 1;
          }
          
          .premium-nav-item-container > a.header-icon-btn .icon-wrap {
            width: 36px; height: 36px;
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            position: relative;
          }
          
          .premium-nav-item-container > a.header-icon-btn:hover .icon-wrap {
            transform: scale(1.1) rotate(5deg);
            background: var(--red) !important;
            box-shadow: 0 4px 12px rgba(232, 71, 42, 0.3);
          }
          
          .premium-nav-item-container > a.header-icon-btn .badge-count {
            position: absolute;
            top: -6px; right: -6px;
            background: var(--red);
            color: white;
            font-size: 0.65rem;
            width: 18px; height: 18px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 50%;
            border: 2px solid #201a1e;
            font-weight: bold;
          }
          
          .premium-nav-item-container > a.header-icon-btn .d-none.d-md-inline {
            display: inline !important;
            font-weight: 600;
            font-size: 0.95rem;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
          
          .mega-menu-item .dropdown-animate {
            opacity: 0;
            visibility: hidden;
            transform: translateY(8px);
            transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
          }
          .mega-menu-item:hover .dropdown-animate {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
          }
          .hover-red:hover {
            color: var(--red) !important;
          }
        `}</style>
      </div>
    </>
  );
}
