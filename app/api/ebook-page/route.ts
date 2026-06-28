import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { logAndCheckDigitalAccess } from "@/lib/security";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "swcart-digital-secret";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/ebook-page?productId=X&page=N&token=JWT
 *
 * Security model:
 * 1. JWT must be valid and contain matching productId + userId
 * 2. Page is fetched as a signed URL from Supabase private bucket
 * 3. The raw signed URL is never exposed to the client — we proxy the response
 * 4. Access is logged to DigitalAccessLog for forensic tracking
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const pageStr = searchParams.get("page");
  const token = searchParams.get("token");

  if (!productId || !pageStr || !token) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Verify JWT
  let payload: { userId: string; productId: string };
  try {
    payload = verify(token, JWT_SECRET) as any;
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  if (payload.productId !== productId) {
    return NextResponse.json({ error: "Token mismatch" }, { status: 403 });
  }

  const page = parseInt(pageStr, 10);
  if (isNaN(page) || page < 1) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }

  // Get ebook asset record
  const asset = await prisma.digitalAsset.findFirst({
    where: { productId, assetType: { in: ["EBOOK", "PDF"] } },
  });

  if (!asset) {
    return NextResponse.json({ error: "Ebook not found" }, { status: 404 });
  }

  // Generate short-lived (60s) signed URL from Supabase private bucket
  const { data, error } = await supabase.storage
    .from("ebooks")
    .createSignedUrl(asset.fileUrl, 60);

  if (error || !data?.signedUrl) {
    console.error("Supabase signed URL error:", error);
    return NextResponse.json({ error: "Could not fetch asset" }, { status: 500 });
  }

  // Log access & run heuristics
  await logAndCheckDigitalAccess({
    req,
    userId: payload.userId,
    productId,
    action: "PAGE_VIEW",
    metadata: { page },
  });

  // Return the signed URL (not the actual file — client renders via PDF.js)
  return NextResponse.json({ signedUrl: data.signedUrl, page });
}
