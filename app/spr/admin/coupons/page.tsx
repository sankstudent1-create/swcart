import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import CouponManager from "./CouponManager";

export default async function CouponsPage() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const coupons = await prisma.coupon.findMany({
    orderBy: { validUntil: "desc" }
  });

  return <CouponManager coupons={coupons} />;
}
