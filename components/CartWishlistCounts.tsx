/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CartWishlistCounts() {
  const [cartCount, setCartCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);

  const fetchCounts = async () => {
    try {
      const res = await fetch("/api/cart-count", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setCartCount(data.cartCount || 0);
      setWishCount(data.wishCount || 0);
    } catch (e) {
      console.error("Failed to fetch cart/wishlist counts", e);
    }
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Link href="/wishlist" className="header-icon-btn">
        <span className="icon-wrap">
          <i className="bi bi-heart"></i>
          {wishCount > 0 && (
            <span className="badge-count" id="wishCount">
              {wishCount}
            </span>
          )}
        </span>
        <span className="d-none d-md-inline">Wishlist</span>
      </Link>
      <Link href="/cart" className="header-icon-btn">
        <span className="icon-wrap">
          <i className="bi bi-cart3"></i>
          {cartCount > 0 && (
            <span className="badge-count" id="globalCartCount">
              {cartCount}
            </span>
          )}
        </span>
        <span className="d-none d-md-inline">Cart</span>
      </Link>
    </>
  );
}
