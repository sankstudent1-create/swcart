// app/api/referral-click/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/referral-click?code=XXXX
 * Records a click on an affiliate link and redirects to home.
 * This is called server-side from layout so we can track without JS.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (code) {
    try {
      const link = await prisma.affiliateLink.findUnique({ where: { code } });
      if (link) {
        const ip =
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          req.headers.get("x-real-ip") ||
          "unknown";

        await prisma.affiliateClick.create({
          data: { linkId: link.id, ipAddress: ip },
        });
      }
    } catch {
      // Non-fatal – don't block the redirect
    }
  }

  // Redirect to homepage stripping the tracking param
  const redirectUrl = new URL("/", req.url);
  const res = NextResponse.redirect(redirectUrl);

  if (code) {
    res.cookies.set("swcart_ref", code, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false, // needs to be readable by client-side JS too
    });
  }

  return res;
}
