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
      prisma.user.findUnique({ where: { id: userId } })
    ]);
    cartCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;
    wishCount = wish?.items.length || 0;
    user = dbUser;
  }

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
                  <Link href="/profile" className="header-icon-btn d-none d-sm-flex">
                    <i className="bi bi-person-circle"></i>
                    <span className="d-none d-md-inline">Account</span>
                  </Link>
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
                <Link href="/login" className="btn btn-danger w-100 rounded-pill py-2 fw-bold shadow-sm" data-bs-dismiss="offcanvas">
                  <i className="bi bi-box-arrow-in-right me-1"></i> Log In / Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Nav Items */}
          <div className="p-4">
            <nav className="d-flex flex-column gap-2">
              <Link href="/" className="text-white text-decoration-none py-3 px-3 rounded-3 hover-bg-light-opacity d-flex align-items-center gap-3 transition-all" data-bs-dismiss="offcanvas">
                <i className="bi bi-house fs-5 text-danger"></i> Home
              </Link>
              
              <Link href="/cart" className="text-white text-decoration-none py-3 px-3 rounded-3 hover-bg-light-opacity d-flex align-items-center justify-content-between transition-all" data-bs-dismiss="offcanvas">
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-cart3 fs-5 text-danger"></i> Cart
                </div>
                {cartCount > 0 && <span className="badge bg-danger rounded-pill px-3 py-2 fw-bold">{cartCount}</span>}
              </Link>
              
              <Link href="/wishlist" className="text-white text-decoration-none py-3 px-3 rounded-3 hover-bg-light-opacity d-flex align-items-center justify-content-between transition-all" data-bs-dismiss="offcanvas">
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-heart fs-5 text-danger"></i> Wishlist
                </div>
                {wishCount > 0 && <span className="badge bg-danger rounded-pill px-3 py-2 fw-bold">{wishCount}</span>}
              </Link>
              
              <Link href="/track-order" className="text-white text-decoration-none py-3 px-3 rounded-3 hover-bg-light-opacity d-flex align-items-center gap-3 transition-all" data-bs-dismiss="offcanvas">
                <i className="bi bi-geo-alt fs-5 text-danger"></i> Track Order
              </Link>
              
              <Link href="/sell" className="text-white text-decoration-none py-3 px-3 rounded-3 hover-bg-light-opacity d-flex align-items-center gap-3 transition-all" data-bs-dismiss="offcanvas">
                <i className="bi bi-shop fs-5 text-danger"></i> Become Seller
              </Link>
              
              <Link href="/help" className="text-white text-decoration-none py-3 px-3 rounded-3 hover-bg-light-opacity d-flex align-items-center gap-3 transition-all" data-bs-dismiss="offcanvas">
                <i className="bi bi-question-circle fs-5 text-danger"></i> Help Center
              </Link>

              {isSuperAdmin && (
                <Link href="/spr/admin" className="text-danger text-decoration-none py-3 px-3 rounded-3 hover-bg-light-opacity d-flex align-items-center gap-3 transition-all fw-bold mt-2" style={{ background: "rgba(232, 71, 42, 0.05)", border: "1px solid rgba(232, 71, 42, 0.15)" }} data-bs-dismiss="offcanvas">
                  <i className="bi bi-speedometer2 fs-5"></i> Admin Control Panel
                </Link>
              )}
            </nav>
          </div>
        </div>

        <style>{`
          .hover-bg-light-opacity:hover { background-color: rgba(255,255,255,0.06); }
          .transition-all { transition: all 0.2s ease; }
        `}</style>
      </div>
    </>
  );
}
