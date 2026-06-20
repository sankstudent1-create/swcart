"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SellerNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/seller/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
    { href: "/seller/products", label: "Products", icon: "bi-box-seam" },
    { href: "/seller/orders", label: "Orders", icon: "bi-receipt" },
    { href: "/seller/settings", label: "Settings", icon: "bi-gear" },
  ];

  return (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 
            ${pathname === item.href ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"} 
            backdrop-blur-sm`}
        >
          <i className={`bi ${item.icon}`} />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
