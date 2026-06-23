import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import OfferManager from "./OfferManager";

export default async function OffersPage() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const offers = await prisma.offer.findMany({
    orderBy: { validUntil: "desc" }
  });

  return <OfferManager offers={offers} />;
}
