"use client";

import { ReactNode } from "react";
import SellerNav from "@/components/SellerNav";
import { requireSeller } from "@/lib/roleGuard";

export default async function SellerLayout({ children }: { children: ReactNode }) {
  // Ensure the user is a seller; redirects if not
  await requireSeller();
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
