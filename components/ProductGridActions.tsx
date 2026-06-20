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
    <div style={{padding: "0 20px 20px", display: "flex", gap: "8px", alignItems: "center"}}>
      <button className="prod-add" onClick={handleAddToCart} disabled={isPending} style={{flex: 1, marginTop: 0}}>
        {isPending ? "..." : "Add to cart"}
      </button>
      <button className="wish-btn-inline" onClick={handleAddToWishlist} disabled={isPending} style={{width: "40px", height: "40px", borderRadius: "12px", border: "2px solid var(--line)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink)", fontSize: "1.1rem", transition: ".2s", cursor: "pointer", flexShrink: 0}}>
        <i className="bi bi-heart"></i>
      </button>
    </div>
  );
}
