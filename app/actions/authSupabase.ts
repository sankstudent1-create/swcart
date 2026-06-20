"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase, supabaseAdmin } from "@/lib/supabaseClient";

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
