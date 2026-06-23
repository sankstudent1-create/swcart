import Link from "next/link";
import { checkSession, getSessionUserId, checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";

export default async function Header() {
  const userId = await getSessionUserId();
  const isSuperAdmin = await checkSuperAdmin();
  let cartCount = 0;
  let wishCount = 0;
  let user = null;

  if (userId) {
    const [cart, wish, dbUser] = await Promise.all([
      prisma.cart.findUnique({ where: { userId }, include: { items: true } }),
      prisma.wishlist.findUnique({ where: { userId }, include: { items: true } }),
      prisma.user.findUnique({ where: { id: userId }, include: { roles: { include: { role: true } } } })
    ]);
    cartCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;
    wishCount = wish?.items.length || 0;
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

      <header className="site-header">
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
                <Link href="/wishlist" className="header-icon-btn">
                  <span className="icon-wrap">
                    <i className="bi bi-heart"></i>
                    {wishCount > 0 && <span className="badge-count" id="wishCount">{wishCount}</span>}
                  </span>
                  <span className="d-none d-md-inline">Wishlist</span>
                </Link>
                <Link href="/cart" className="header-icon-btn">
                  <span className="icon-wrap">
                    <i className="bi bi-cart3"></i>
                    {cartCount > 0 && <span className="badge-count" id="globalCartCount">{cartCount}</span>}
                  </span>
                  <span className="d-none d-md-inline">Cart</span>
                </Link>
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
      <div className="offcanvas offcanvas-start text-white border-0 shadow-lg" tabIndex={-1} id="menuCanvas" aria-labelledby="menuCanvasLabel" style={{ background: "linear-gradient(135deg, #1A1410 0%, #2A1F18 100%)" }}>
        <div className="offcanvas-header border-bottom border-light border-opacity-10 p-4 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <img src="https://tools.swinfosystems.online/icon-192.png" alt="Swcart logo" style={{ width: "32px", height: "32px", borderRadius: "8px" }} />
            <h5 className="offcanvas-title fw-bold mb-0" id="menuCanvasLabel">
              <span className="text-danger">Sw</span>cart
            </h5>
          </div>
          <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        
        <div className="offcanvas-body p-0">
          {/* User Profile Header */}
          <div className="p-4 border-bottom border-light border-opacity-10 bg-white bg-opacity-5">
            {user ? (
              <div className="d-flex align-items-center gap-3">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="shadow-sm border border-light border-opacity-25" style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div className="avatar-placeholder rounded-circle bg-danger text-white d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: "50px", height: "50px", fontSize: "1.25rem" }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h6 className="fw-bold mb-0 text-white">{user.name}</h6>
                  <p className="text-muted small mb-0 text-truncate" style={{ maxWidth: "160px" }}>{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <a href="/login" className="btn btn-danger w-100 rounded-pill py-2 fw-bold shadow-sm">
                  <i className="bi bi-box-arrow-in-right me-1"></i> Log In / Sign Up
                </a>
              </div>
            )}
          </div>

          {/* Nav Items */}
          <div className="p-4">
            <nav className="d-flex flex-column gap-2">
              <a href="/" className="text-white text-decoration-none py-3 px-3 rounded-3 hover-bg-light-opacity d-flex align-items-center gap-3 transition-all">
                <i className="bi bi-house fs-5 text-danger"></i> Home
              </a>
              
              {user && (
                <a href="/profile" className="text-white text-decoration-none py-3 px-3 rounded-3 hover-bg-light-opacity d-flex align-items-center gap-3 transition-all">
                  <i className="bi bi-person-circle fs-5 text-danger"></i> Profile
                </a>
              )}
              
              <a href="/cart" className="text-white text-decoration-none py-3 px-3 rounded-3 hover-bg-light-opacity d-flex align-items-center justify-content-between transition-all">
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-cart3 fs-5 text-danger"></i> Cart
                </div>
                {cartCount > 0 && <span className="badge bg-danger rounded-pill px-3 py-2 fw-bold">{cartCount}</span>}
              </a>
              
              <a href="/wishlist" className="text-white text-decoration-none py-3 px-3 rounded-3 hover-bg-light-opacity d-flex align-items-center justify-content-between transition-all">
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-heart fs-5 text-danger"></i> Wishlist
                </div>
                {wishCount > 0 && <span className="badge bg-danger rounded-pill px-3 py-2 fw-bold">{wishCount}</span>}
              </a>
              
              <a href="/track-order" className="text-white text-decoration-none py-3 px-3 rounded-3 hover-bg-light-opacity d-flex align-items-center gap-3 transition-all">
                <i className="bi bi-geo-alt fs-5 text-danger"></i> Track Order
              </a>
              
              <a href="/sell" className="text-white text-decoration-none py-3 px-3 rounded-3 hover-bg-light-opacity d-flex align-items-center gap-3 transition-all">
                <i className="bi bi-shop fs-5 text-danger"></i> Become Seller
              </a>
              
              <a href="/help" className="text-white text-decoration-none py-3 px-3 rounded-3 hover-bg-light-opacity d-flex align-items-center gap-3 transition-all">
                <i className="bi bi-question-circle fs-5 text-danger"></i> Help Center
              </a>

              {isSeller && (
                <a href="/seller/dashboard" className="text-warning text-decoration-none py-3 px-3 rounded-3 hover-bg-light-opacity d-flex align-items-center gap-3 transition-all fw-bold mt-2" style={{ background: "rgba(255, 193, 7, 0.05)", border: "1px solid rgba(255, 193, 7, 0.15)" }}>
                  <i className="bi bi-shop fs-5"></i> Seller Dashboard
                </a>
              )}

              {isWarehouseManager && (
                <a href="/warehouse" className="text-info text-decoration-none py-3 px-3 rounded-3 hover-bg-light-opacity d-flex align-items-center gap-3 transition-all fw-bold mt-2" style={{ background: "rgba(13, 202, 240, 0.05)", border: "1px solid rgba(13, 202, 240, 0.15)" }}>
                  <i className="bi bi-building fs-5"></i> Hub Manager Portal
                </a>
              )}

              {isDeliveryAgent && (
                <a href="/delivery" className="text-success text-decoration-none py-3 px-3 rounded-3 hover-bg-light-opacity d-flex align-items-center gap-3 transition-all fw-bold mt-2" style={{ background: "rgba(25, 135, 84, 0.05)", border: "1px solid rgba(25, 135, 84, 0.15)" }}>
                  <i className="bi bi-truck fs-5"></i> Driver App
                </a>
              )}

              {isSuperAdmin && (
                <a href="/spr/admin" className="text-danger text-decoration-none py-3 px-3 rounded-3 hover-bg-light-opacity d-flex align-items-center gap-3 transition-all fw-bold mt-2" style={{ background: "rgba(232, 71, 42, 0.05)", border: "1px solid rgba(232, 71, 42, 0.15)" }}>
                  <i className="bi bi-speedometer2 fs-5"></i> Admin Control Panel
                </a>
              )}
            </nav>
          </div>
        </div>

        <style>{`
          .hover-bg-light-opacity:hover { background-color: rgba(255,255,255,0.06); }
          .transition-all { transition: all 0.2s ease; }
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
