"use client";

import { ReactNode } from "react";
import SellerNav from "@/components/SellerNav";
import { requireSeller } from "@/lib/roleGuard";
import { redirect } from "next/navigation";

export default async function SellerLayout({ children }: { children: ReactNode }) {
  try {
    await requireSeller();
  } catch (e) {
    // If not authenticated or not a seller, send to login page
    redirect("/login");
    return null; // unreachable but satisfies TS
  }
  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <aside className="w-64 bg-gray-800 p-4">
        <SellerNav />
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
