"use client";

import { useTransition } from "react";
import { addToCartAction, addToWishlistAction } from "@/app/actions/shop";
import { toast } from "sonner";

export default function ProductGridActions({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = await addToCartAction(productId, 1);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = await addToWishlistAction(productId);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <>
      {/* Absolute Wishlist Button */}
      <button 
        className="wishlist-overlay-btn" 
        onClick={handleAddToWishlist} 
        disabled={isPending}
        title="Add to Wishlist"
        aria-label="Add to Wishlist"
      >
        <i className="bi bi-heart"></i>
      </button>

      {/* Add to Cart Button Container */}
      <div className="prod-action-container">
        <button className="prod-add-btn" onClick={handleAddToCart} disabled={isPending}>
          {isPending ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : (
            <>
              <i className="bi bi-bag-plus"></i> Add to Cart
            </>
          )}
        </button>
      </div>

      <style>{`
        .wishlist-overlay-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 10;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ink);
          font-size: 1.05rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .wishlist-overlay-btn:hover {
          background: var(--red);
          color: #fff;
          border-color: var(--red);
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 8px 16px rgba(232, 71, 42, 0.3);
        }
        .prod-action-container {
          padding: 0 16px 16px;
          margin-top: auto;
        }
        .prod-add-btn {
          border: none;
          background: var(--ink);
          color: #fff;
          border-radius: 12px;
          padding: 10px 16px;
          font-size: 0.85rem;
          font-weight: 700;
          width: 100%;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          letter-spacing: 0.2px;
        }
        .prod-add-btn:hover {
          background: var(--red);
          color: #fff;
          box-shadow: 0 8px 20px rgba(232, 71, 42, 0.25);
          transform: translateY(-2px);
        }
        .prod-add-btn:active {
          transform: translateY(0);
        }
        @media (max-width: 575px) {
          .prod-add-btn {
            padding: 8px 8px;
            font-size: 0.78rem;
            gap: 4px;
            border-radius: 10px;
          }
          .prod-action-container {
            padding: 0 10px 10px;
          }
          .wishlist-overlay-btn {
            top: 10px;
            right: 10px;
            width: 32px;
            height: 32px;
            font-size: 0.95rem;
          }
        }
      `}</style>
    </>
  );
}
