import React from "react";
import { checkSuperAdmin } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import CommerceHub from "./CommerceHub";

export default async function SuperadCommercePage() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/login?error=unauthorized_god_mode");

  const recentOrders = await prisma.order.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      sellerOrders: { include: { seller: { select: { companyName: true } } } }
    }
  });

  const topProducts = await prisma.product.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      seller: { select: { companyName: true } },
      category: { select: { name: true } }
    }
  });

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 className="fw-bolder text-white mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-cart-check-fill text-danger"></i> Catalog & Orders
          </h2>
          <p className="text-muted small mb-0">High-level view of active orders and product catalog moderation.</p>
        </div>
      </div>

      <CommerceHub initialOrders={recentOrders} initialProducts={topProducts} />
    </div>
  );
}
