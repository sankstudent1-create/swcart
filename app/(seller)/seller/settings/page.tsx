import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import SellerSettingsForm from "./SellerSettingsForm";

export default async function SellerSettingsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const seller = await prisma.seller.findUnique({
    where: { userId }
  });

  if (!seller) {
    redirect("/sell");
  }

  // Client serialization
  const serializedSeller = JSON.parse(JSON.stringify(seller));

  return (
    <SellerSettingsForm seller={serializedSeller} />
  );
}
