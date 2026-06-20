"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function registerAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    throw new Error("Missing required fields");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const role = await prisma.role.upsert({
    where: { name: "CUSTOMER" },
    update: {},
    create: { name: "CUSTOMER", description: "Regular customer" }
  });

  const user = await prisma.user.create({
    data: { 
      name, 
      email, 
      passwordHash,
      roles: {
        create: {
          roleId: role.id
        }
      }
    },
  });

  const cookieStore = await cookies();
  cookieStore.set("swcart_session", user.id, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/");
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    throw new Error("Missing email or password");
  }

  const user = await prisma.user.findUnique({ 
    where: { email },
    include: { roles: { include: { role: true } } }
  });
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  const cookieStore = await cookies();
  cookieStore.set("swcart_session", user.id, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });

  const isSuperAdmin = user.roles.some((ur: any) => ur.role.name === "SUPER_ADMIN");
  if (isSuperAdmin) {
    redirect("/spr/admin");
  } else {
    redirect("/");
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("swcart_session");
  redirect("/");
}

export async function checkSession() {
  const cookieStore = await cookies();
  return cookieStore.has("swcart_session");
}

export async function getSessionUserId() {
  const cookieStore = await cookies();
  return cookieStore.get("swcart_session")?.value || null;
}

export async function checkSuperAdmin() {
  const userId = await getSessionUserId();
  if (!userId) return false;

  const userRole = await prisma.userRole.findFirst({
    where: {
      userId,
      role: {
        name: "SUPER_ADMIN"
      }
    }
  });

  return !!userRole;
}
