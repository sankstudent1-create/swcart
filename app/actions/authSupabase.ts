"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase, supabaseAdmin } from "@/lib/supabaseClient";
import { prisma } from "@/lib/db";

/**
 * Register a new user using Supabase Auth.
 * Returns an error object on failure, otherwise redirects to home.
 */
export async function registerSupabase(formData: FormData): Promise<{ error?: string }> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "Please fill in all fields." };
  }

  try {
    // Supabase sign‑up creates the user and returns a session containing the JWT.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (error) {
      console.error("Supabase register error:", error);
      return { error: error.message };
    }

    // Sync to public DB tables if sign-up succeeds
    if (data.user) {
      const role = await prisma.role.upsert({
        where: { name: "CUSTOMER" },
        update: {},
        create: { name: "CUSTOMER", description: "Regular customer" }
      });

      const existingUser = await prisma.user.findUnique({
        where: { id: data.user.id }
      });

      if (!existingUser) {
        const cookieStore = await cookies();
        const refCode = cookieStore.get("swcart_ref")?.value;
        let referrerId: string | null = null;
        let affiliateLinkId: string | null = null;

        if (refCode) {
          const affiliateLink = await prisma.affiliateLink.findUnique({
            where: { code: refCode }
          });
          if (affiliateLink) {
            referrerId = affiliateLink.userId;
            affiliateLinkId = affiliateLink.id;
          } else {
            const directUser = await prisma.user.findUnique({ where: { id: refCode } });
            if (directUser) {
              referrerId = directUser.id;
            }
          }
        }

        await prisma.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              id: data.user!.id,
              name,
              email,
              passwordHash: "",
              roles: {
                create: { roleId: role.id }
              },
              customerProfile: {
                create: {}
              }
            }
          });

          if (referrerId && referrerId !== data.user!.id) {
            const settings = await tx.siteSetting.findUnique({ where: { id: "GLOBAL" } });
            if (settings?.referralEnabled !== false) {
              await tx.referral.create({
                data: {
                  referrerId,
                  referredId: data.user!.id,
                  affiliateLinkId,
                  status: "PENDING"
                }
              });

              if (affiliateLinkId) {
                await tx.affiliateClick.create({
                  data: {
                    linkId: affiliateLinkId,
                    ipAddress: "Registered User"
                  }
                });
              }
            }
          }
        });
      }
    }

    // Store JWT in httpOnly cookie (same name used by the rest of the app).
    const cookieStore = await cookies();
    cookieStore.set("swcart_session", data.session?.access_token ?? "", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
  } catch (err: any) {
    console.error("RegisterSupabase unexpected error:", err);
    return { error: "A server error occurred. Please try again." };
  }

  redirect("/");
}

/**
 * Login an existing user using Supabase Auth.
 */
export async function loginSupabase(formData: FormData): Promise<{ error?: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("Supabase login error:", error);
      return { error: error.message };
    }

    // Sync/Lazily create public DB records on successful login
    if (data.user) {
      const existingUser = await prisma.user.findUnique({
        where: { id: data.user.id }
      });

      if (!existingUser) {
        const role = await prisma.role.upsert({
          where: { name: "CUSTOMER" },
          update: {},
          create: { name: "CUSTOMER", description: "Regular customer" }
        });

        await prisma.user.create({
          data: {
            id: data.user.id,
            name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "User",
            email: data.user.email!,
            passwordHash: "",
            roles: {
              create: { roleId: role.id }
            },
            customerProfile: {
              create: {}
            }
          }
        });
      }
    }

    const cookieStore = await cookies();
    cookieStore.set("swcart_session", data.session?.access_token ?? "", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch (err: any) {
    console.error("LoginSupabase unexpected error:", err);
    return { error: "A server error occurred. Please try again." };
  }

  redirect("/");
}
