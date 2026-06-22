"use client";

import { useState, useTransition } from "react";
import { addToCartAction, addToWishlistAction } from "@/app/actions/shop";
import { toast } from "sonner";

interface ProductActionsProps {
  productId: string;
  variantId?: string;
  disabled?: boolean;
}

export default function ProductActions({ productId, variantId, disabled = false }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();

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

  return (
    <div className="action-row">
      <div className="qty-ctrl">
        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={isPending || disabled}>-</button>
        <span>{quantity}</span>
        <button onClick={() => setQuantity(quantity + 1)} disabled={isPending || disabled}>+</button>
      </div>
      <button className="btn-add" onClick={handleAddToCart} disabled={isPending || disabled}>
        {disabled ? "Out of Stock" : isPending ? "Adding..." : "Add to Cart"}
      </button>
      <button className="btn-wish" onClick={handleAddToWishlist} disabled={isPending}>
        <i className="bi bi-heart"></i>
      </button>
    </div>
  );
}
