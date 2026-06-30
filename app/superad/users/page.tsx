import React from "react";
import { checkSuperAdmin } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import UserTable from "./UserTable";

export default async function SuperadUsersPage() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/login?error=unauthorized_god_mode");

  const users = await prisma.user.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      roles: { include: { role: true } },
      sellerProfile: true,
      deliveryProfile: true
    }
  });

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 className="fw-bolder text-white mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-people-fill text-info"></i> Identity & Access Hub
          </h2>
          <p className="text-muted small mb-0">Manage global user identities, roles, and suspension macros.</p>
        </div>
      </div>

      <div className="rounded-4 overflow-hidden border border-secondary border-opacity-25 bg-dark bg-opacity-50">
        <UserTable initialUsers={users} />
      </div>
    </div>
  );
}
