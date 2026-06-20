import Link from "next/link";
import { checkSession, getSessionUserId, checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";

export default async function Header() {
  const userId = await getSessionUserId();
  const isSuperAdmin = await checkSuperAdmin();
  let cartCount = 0;
  let wishCount = 0;

  if (userId) {
    const [cart, wish] = await Promise.all([
      prisma.cart.findUnique({ where: { userId }, include: { items: true } }),
      prisma.wishlist.findUnique({ where: { userId }, include: { items: true } })
    ]);
    cartCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;
    wishCount = wish?.items.length || 0;
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
    </>
  );
}
