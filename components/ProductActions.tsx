"use client";

import { useState, useTransition } from "react";
import { addToCartAction, addToWishlistAction } from "@/app/actions/shop";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProductActionsProps {
  productId: string;
  variantId?: string;
  disabled?: boolean;
  isDigital?: boolean;
}

export default function ProductActions({ productId, variantId, disabled = false, isDigital = false }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAddToCart = () => {
    startTransition(async () => {
      const res = await addToCartAction(productId, quantity);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleAddToWishlist = () => {
    startTransition(async () => {
      const res = await addToWishlistAction(productId);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleBuyNow = () => {
    startTransition(async () => {
      const res = await addToCartAction(productId, quantity);
      if (res.success) {
        router.push("/cart");
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="action-row flex-wrap gap-2 d-flex align-items-center">
      {!isDigital && (
        <div className="qty-ctrl">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={isPending || disabled}>-</button>
          <span>{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)} disabled={isPending || disabled}>+</button>
        </div>
      )}
      {!isDigital && (
        <button className="btn-add" onClick={handleAddToCart} disabled={isPending || disabled}>
          {disabled ? "Out of Stock" : isPending ? "Adding..." : "Add to Cart"}
        </button>
      )}
      <button className={`btn btn-danger rounded-pill fw-bold px-4 py-2.5 shadow-sm transition-all hover-scale ${isDigital ? 'w-100' : ''}`} onClick={handleBuyNow} disabled={isPending || disabled} style={{ background: "linear-gradient(135deg, #e63946 0%, #c1121f 100%)", border: "none" }}>
        {disabled && !isDigital ? "Out of Stock" : isPending ? "Redirecting..." : (isDigital ? "Enroll Now" : "Buy Now")}
      </button>
      <button className="btn-wish" onClick={handleAddToWishlist} title="Add to Wishlist" disabled={isPending}>
        <i className="bi bi-heart"></i>
      </button>
      <button className="btn-wish" onClick={() => toast.success("Added to Compare list!")} title="Compare" disabled={isPending}>
        <i className="bi bi-bar-chart"></i>
      </button>
    </div>
  );
}
