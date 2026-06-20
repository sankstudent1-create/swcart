"use client";

import { ReactNode } from "react";
import SuperAdminNav from "@/components/SuperAdminNav";
import { requireSuperAdmin } from "@/lib/roleGuard";
import { redirect } from "next/navigation";

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  try {
    await requireSuperAdmin();
  } catch (e) {
    redirect("/login");
    return null;
  }
  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <aside className="w-64 bg-gray-800 p-4">
        <SuperAdminNav />
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
