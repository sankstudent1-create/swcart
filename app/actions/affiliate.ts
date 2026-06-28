// app/actions/affiliate.ts
"use server";

import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/app/actions/auth";
import { cookies } from "next/headers";

/** Generate a unique affiliate code */
function generateCode(): string {
  // Simple short code – you can replace with a more robust generator
  return Math.random().toString(36).substring(2, 10);
}

/** Create (or fetch) an affiliate link for the logged‑in user */
export async function generateAffiliateLink(): Promise<{ link: string }> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("User not authenticated");

  // Check if a link already exists
  let link = await prisma.affiliateLink.findFirst({ where: { userId } });
  if (!link) {
    // Ensure uniqueness of the code
    let code = generateCode();
    while (await prisma.affiliateLink.findUnique({ where: { code } })) {
      code = generateCode();
    }
    link = await prisma.affiliateLink.create({
      data: { userId, code },
    });
  }

  // Store the code in a cookie for later referral tracking (optional)
  const cookieStore = await cookies();
  cookieStore.set("swcart_ref", link.code, { path: "/", maxAge: 60 * 60 * 24 * 30 });

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  return { link: `${origin}/?ref=${link.code}` };
}

/** Retrieve an existing affiliate link (if any) */
export async function getAffiliateLink(): Promise<{ link?: string }> {
  const userId = await getSessionUserId();
  if (!userId) return {};
  const link = await prisma.affiliateLink.findFirst({ where: { userId } });
  if (!link) return {};
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  return { link: `${origin}/?ref=${link.code}` };
}
