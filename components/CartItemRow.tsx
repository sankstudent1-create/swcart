"use client";

import { useTransition } from "react";
import { updateCartItemAction, removeCartItemAction } from "@/app/actions/shop";
import { toast } from "sonner";
import { placeholderImg } from "@/lib/mockData";
import Link from "next/link";

interface CartItemProps {
  item: {
    id: string;
    quantity: number;
    variant: {
      id: string;
      sku: string;
      size: string;
      price: number;
      product: {
        id: string;
        title: string;
        images: string[];
      }
    }
  }
}

export default function CartItemRow({ item }: CartItemProps) {
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (newQty: number) => {
    if (newQty < 1) return;
    startTransition(async () => {
      const res = await updateCartItemAction(item.id, newQty);
      if (!res.success) toast.error(res.message);
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      const res = await removeCartItemAction(item.id);
      if (res.success) toast.success("Item removed");
      else toast.error(res.message);
    });
  };

  const p = item.variant.product;
  const imageUrl = p.images?.[0] || "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=300&q=80";

  return (
    <div className="cart-item d-flex align-items-center gap-3 py-3 border-bottom" style={{ opacity: isPending ? 0.5 : 1 }}>
      <img src={imageUrl} alt={p.title} style={{width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px"}} />
      <div className="flex-grow-1">
        <Link href={`/product/${p.id}`} className="text-decoration-none text-dark fw-semibold">{p.title}</Link>
        <div className="text-muted small mt-1">SKU: {item.variant.sku}</div>
        {item.variant.size && <div className="text-muted small">Size: {item.variant.size}</div>}
      </div>
      <div className="qty-ctrl" style={{marginBottom: 0}}>
        <button onClick={() => handleUpdate(item.quantity - 1)} disabled={isPending}>-</button>
        <span>{item.quantity}</span>
        <button onClick={() => handleUpdate(item.quantity + 1)} disabled={isPending}>+</button>
      </div>
      <div className="fw-bold ms-3" style={{width: "90px", textAlign: "right"}}>
        ₹{(item.variant.price * item.quantity).toLocaleString("en-IN")}
      </div>
      <button onClick={handleRemove} disabled={isPending} className="btn text-danger ms-2" style={{background: "none", border: "none", padding: "8px"}}>
        <i className="bi bi-trash3"></i>
      </button>
    </div>
  );
}
