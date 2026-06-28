import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/app/actions/auth";
import { sign } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "swcart-digital-secret";

/**
 * POST /api/digital-token
 * Returns a short-lived signed JWT proving the current user owns a digital product.
 * This token is used by /api/ebook-page to serve signed PDF pages.
 */
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { productId } = await req.json();
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  // Verify ownership — user must have an enrollment record
  const enrollment = await prisma.userCourseEnrollment.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (!enrollment) {
    // Also check via completed paid order (for eBooks without an enrollment row)
    const order = await prisma.order.findFirst({
      where: {
        userId,
        status: { in: ["DELIVERED", "COMPLETED"] },
        sellerOrders: {
          some: {
            items: {
              some: {
                variant: { product: { id: productId, productType: { in: ["DIGITAL", "EBOOK"] } } },
              },
            },
          },
        },
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  // Sign a 6-minute JWT — enough time to fetch all pages of a chapter
  const token = sign(
    { userId, productId, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: "6m" }
  );

  return NextResponse.json({ token });
}
