import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/geocode?q=Bangalore+Karnataka+India
 * Wraps the free Nominatim (OpenStreetMap) geocoding API.
 * No API key required. Complies with Nominatim usage policy:
 *  - Max 1 request/second
 *  - Identifies itself via User-Agent
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ error: "q param required" }, { status: 400 });

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "SwCart/1.0 (contact@swcart.in)",
        "Accept-Language": "en",
      },
      next: { revalidate: 3600 }, // cache 1hr
    });

    if (!res.ok) throw new Error("Nominatim error");
    const data = await res.json();

    if (data && data.length > 0) {
      return NextResponse.json({
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        display: data[0].display_name,
      });
    }
    return NextResponse.json({ lat: null, lng: null });
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
