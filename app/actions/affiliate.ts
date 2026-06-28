// app/actions/affiliate.ts
"use server";

import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/app/actions/auth";

/** Canonical site origin for referral links — set NEXT_PUBLIC_SITE_URL in env */
function getSiteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://swcart-three.vercel.app"
  );
}

function generateCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/** Create (or fetch) an affiliate link for the logged-in user */
export async function generateAffiliateLink(): Promise<{ link?: string; error?: string }> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "User not authenticated" };

  try {
    // Check if a link already exists
    let affiliateLink = await prisma.affiliateLink.findFirst({ where: { userId } });

    if (!affiliateLink) {
      // Ensure uniqueness of the code
      let code = generateCode();
      while (await prisma.affiliateLink.findUnique({ where: { code } })) {
        code = generateCode();
      }
      affiliateLink = await prisma.affiliateLink.create({
        data: { userId, code },
      });
    }

    return { link: `${getSiteOrigin()}/?ref=${affiliateLink.code}` };
  } catch (e: any) {
    return { error: e.message || "Failed to generate link" };
  }
}

/** Retrieve an existing affiliate link (if any) without creating one */
export async function getAffiliateLink(): Promise<{ link?: string }> {
  const userId = await getSessionUserId();
  if (!userId) return {};

  const affiliateLink = await prisma.affiliateLink.findFirst({ where: { userId } });
  if (!affiliateLink) return {};

  return { link: `${getSiteOrigin()}/?ref=${affiliateLink.code}` };
}

/** Get referral stats for the current user's dashboard */
export async function getReferralStats(): Promise<{
  link?: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalClicks: number;
  totalEarned: number;
  referredUsers: {
    name: string;
    email: string;
    joinedAt: Date;
    status: string;
    hasOrdered: boolean;
  }[];
}> {
  const userId = await getSessionUserId();
  if (!userId) {
    return {
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
      totalClicks: 0,
      totalEarned: 0,
      referredUsers: [],
    };
  }

  const affiliateLink = await prisma.affiliateLink.findFirst({
    where: { userId },
    include: { clicks: true },
  });

  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
    include: {
      referred: {
        include: { orders: { take: 1, orderBy: { createdAt: "asc" } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const walletTxns = await prisma.walletTransaction.findMany({
    where: {
      wallet: { userId },
      type: "CREDIT",
      reason: { contains: "Referral Bonus" },
    },
  });
  const totalEarned = walletTxns.reduce((acc, t) => acc + t.amount, 0);

  return {
    link: affiliateLink ? `${getSiteOrigin()}/?ref=${affiliateLink.code}` : undefined,
    totalReferrals: referrals.length,
    completedReferrals: referrals.filter((r) => r.status === "COMPLETED").length,
    pendingReferrals: referrals.filter((r) => r.status === "PENDING").length,
    totalClicks: affiliateLink?.clicks.length ?? 0,
    totalEarned,
    referredUsers: referrals.map((r) => ({
      name: r.referred.name,
      email: r.referred.email,
      joinedAt: r.createdAt,
      status: r.status,
      hasOrdered: r.referred.orders.length > 0,
    })),
  };
}
