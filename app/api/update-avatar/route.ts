// app/api/update-avatar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/app/actions/auth";

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { avatarUrl } = await req.json();
    if (!avatarUrl || typeof avatarUrl !== "string") {
      return NextResponse.json({ error: "Invalid avatar URL" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });

    return NextResponse.json({ success: true, avatarUrl });
  } catch (err: any) {
    console.error("update-avatar error:", err);
    return NextResponse.json({ error: err.message || "Failed to update avatar" }, { status: 500 });
  }
}
