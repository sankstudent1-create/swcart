import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/app/actions/auth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "You must be logged in first." });
  }

  try {
    const role = await prisma.role.upsert({
      where: { name: "SUPER_ADMIN" },
      update: {},
      create: { name: "SUPER_ADMIN", description: "Super Administrator" }
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id }
    });

    return NextResponse.json({ 
      success: true, 
      message: "SUPER_ADMIN role granted successfully! You can now access /spr/admin" 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
