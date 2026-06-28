// app/api/mappls-token/route.ts
import { NextResponse } from "next/server";

// Must be dynamic — fetches from external OAuth server at runtime
export const dynamic = "force-dynamic";

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function GET() {
  const clientId = process.env.MAPPLS_CLIENT_ID;
  const clientSecret = process.env.MAPPLS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Mappls credentials not configured" }, { status: 503 });
  }

  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return NextResponse.json({ token: cachedToken });
  }

  try {
    const res = await fetch(
      "https://outpost.mapmyindia.com/api/security/oauth/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
        }),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`Mappls auth failed: ${res.status}`);
    }

    const data = await res.json();
    cachedToken = data.access_token;
    // expires_in is in seconds; subtract 60s buffer
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

    return NextResponse.json({ token: cachedToken });
  } catch (err: any) {
    console.error("Mappls token error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
