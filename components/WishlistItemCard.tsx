"use client";

import { useTransition } from "react";
import { removeWishlistItemAction, addToCartAction } from "@/app/actions/shop";
import { toast } from "sonner";
import { placeholderImg } from "@/lib/mockData";
import Link from "next/link";

interface WishlistProps {
  item: {
    id: string;
    variant: {
      id: string;
      price: number;
      product: {
        id: string;
        name: string;
        cat: string;
      }
    }
  }
}

export default function WishlistItemCard({ item }: WishlistProps) {
  const [isPending, startTransition] = useTransition();
  const p = item.variant.product;

  const handleRemove = () => {
    startTransition(async () => {
      const res = await removeWishlistItemAction(item.id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const handleAddToCart = () => {
    startTransition(async () => {
      const res = await addToCartAction(p.id, 1, item.variant.id);
      if (res.success) toast.success("Moved to cart!");
      else toast.error(res.message);
      
      await removeWishlistItemAction(item.id);
    });
  };

  return (
    <div className="col-6 col-md-4 col-lg-3" style={{ opacity: isPending ? 0.5 : 1 }}>
      <div className="prod-card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Link href={`/product?id=${p.id}`} className="prod-link" style={{ flexGrow: 1 }}>
          <div className="prod-img">
            <img src={placeholderImg(p.id, "")} alt={p.name} />
          </div>
          <div className="prod-body">
            <div className="prod-cat">{p.cat}</div>
            <div className="prod-name">{p.name}</div>
            <div className="prod-price">₹{item.variant.price.toLocaleString('en-IN')}</div>
          </div>
        </Link>
        <div style={{padding: "0 20px 20px", display: "flex", gap: "8px", alignItems: "center"}}>
          <button className="prod-add" onClick={handleAddToCart} disabled={isPending} style={{flex: 1, marginTop: 0}}>Move to Cart</button>
          <button className="wish-btn-inline" onClick={handleRemove} disabled={isPending} style={{width: "40px", height: "40px", borderRadius: "12px", border: "2px solid var(--line)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red)", fontSize: "1.1rem", transition: ".2s", cursor: "pointer", flexShrink: 0}}>
            <i className="bi bi-trash3"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
