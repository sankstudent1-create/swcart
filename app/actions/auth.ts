"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabaseClient";

export async function registerAction(formData: FormData): Promise<{ error?: string }> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "Please fill in all fields." };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "An account with this email already exists." };
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
          create: { roleId: role.id }
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
  } catch (err: any) {
    console.error("Register error:", err);
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/");
}

export async function loginAction(formData: FormData): Promise<{ error?: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  let isSuperAdmin = false;

  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { roles: { include: { role: true } } }
    });

    if (!user) {
      return { error: "No account found with this email address." };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return { error: "Incorrect password. Please try again." };
    }

    const cookieStore = await cookies();
    cookieStore.set("swcart_session", user.id, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    isSuperAdmin = user.roles.some((ur: any) => ur.role.name === "SUPER_ADMIN");
  } catch (err: any) {
    console.error("Login error:", err);
    return { error: "A server error occurred. Please try again shortly." };
  }

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
  const token = cookieStore.get("swcart_session")?.value;
  if (!token) return null;

  // Check if it is a Supabase JWT (contains dots)
  if (token.includes(".")) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) return null;
      return data.user.id;
    } catch (err) {
      return null;
    }
  }

  // Otherwise, it's a legacy CUID/UUID session
  return token;
}

export async function checkSuperAdmin() {
  const userId = await getSessionUserId();
  if (!userId) return false;

  const userRole = await prisma.userRole.findFirst({
    where: {
      userId,
      role: { name: "SUPER_ADMIN" }
    }
  });

  return !!userRole;
}
