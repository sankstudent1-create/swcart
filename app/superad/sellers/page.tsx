import React from "react";
import { checkSuperAdmin } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import SellerTable from "./SellerTable";

export default async function SuperadSellersPage() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/login?error=unauthorized_god_mode");

  const sellers = await prisma.seller.findMany({
    take: 100,
    include: {
      user: true,
      _count: {
        select: { products: true, sellerOrders: true }
      }
    }
  });

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 className="fw-bolder text-white mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-shop-window text-success"></i> Vendor Command Center
          </h2>
          <p className="text-muted small mb-0">Monitor active sellers, process KYC, and prune vendor catalogs.</p>
        </div>
      </div>

      <div className="rounded-4 overflow-hidden border border-secondary border-opacity-25 bg-dark bg-opacity-50">
        <SellerTable initialSellers={sellers} />
      </div>
    </div>
  );
}
