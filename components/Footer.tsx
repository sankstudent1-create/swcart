import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="row g-4">
          <div className="col-md-3">
            <div className="footer-brand">
              <img src="https://tools.swinfosystems.online/icon-192.png" alt="Swcart logo" />
              <span>Swcart</span>
            </div>
            <p style={{fontSize: ".85rem"}}>Your one-stop marketplace for electronics, fashion, home, grocery and more — all in a single cart.</p>
            <div className="social-row mt-3">
              <Link href="#"><i className="bi bi-facebook"></i></Link>
              <Link href="#"><i className="bi bi-instagram"></i></Link>
              <Link href="#"><i className="bi bi-twitter-x"></i></Link>
              <Link href="#"><i className="bi bi-youtube"></i></Link>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <h6>Shop</h6>
            <Link href="#" className="footer-cat" data-cat="Electronics">Electronics</Link>
            <Link href="#" className="footer-cat" data-cat="Fashion">Fashion</Link>
            <Link href="#" className="footer-cat" data-cat="Home">Home &amp; Kitchen</Link>
            <Link href="#" className="footer-cat" data-cat="Grocery">Grocery</Link>
            <Link href="#" className="footer-cat" data-cat="Beauty">Beauty</Link>
          </div>
          <div className="col-md-3 col-6">
            <h6>Support</h6>
            <Link href="/track-order">Track your order</Link>
            <Link href="/refunds">Returns &amp; refunds</Link>
            <Link href="/shipping">Shipping info</Link>
            <Link href="/contact">Contact us</Link>
            <Link href="/about">About us</Link>
            <Link href="/help">FAQs</Link>
          </div>
          <div className="col-md-3">
            <h6>Get the app</h6>
            <div className="app-badges">
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" />
            </div>
            <div className="app-badges mt-2">
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" />
            </div>
          </div>
        </div>
        <div className="footer-bottom d-flex justify-content-between flex-wrap gap-2">
          <div>© 2026 Swcart. All rights reserved.</div>
          <div className="d-flex flex-wrap gap-3">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/cookie-policy">Cookie Policy</Link>
            <Link href="/dmca">DMCA</Link>
            <Link href="/disclaimer">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
