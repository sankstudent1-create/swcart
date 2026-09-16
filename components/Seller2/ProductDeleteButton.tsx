"use client";

import { deleteProduct } from "@/app/actions/seller2-products";
import React, { useTransition } from "react";

export function ProductDeleteButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this product?")) {
      startTransition(async () => {
        try {
          await deleteProduct(productId);
        } catch (e) {
          alert("Failed to delete product.");
        }
      });
    }
  };

  return (
    <button 
      onClick={handleDelete} 
      className="btn btn-sm btn-danger rounded-circle shadow-sm" 
      style={{width: 32, height:32}}
      disabled={isPending}
    >
      {isPending ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-trash"></i>}
    </button>
  );
}
