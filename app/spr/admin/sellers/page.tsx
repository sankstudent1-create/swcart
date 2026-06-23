import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import SellerManager from "./SellerManager";

export default async function SellersPage() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const sellers = await prisma.seller.findMany({
    include: { user: true },
    orderBy: { user: { createdAt: "desc" } }
  });

  return <SellerManager sellers={sellers} />;
}
