import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const GEOAPIFY_KEY = process.env.GEOAPIFY_API_KEY;

// Preset category options mapped to Geoapify's category codes
const CATEGORY_MAP: Record<string, string> = {
  restaurants: "catering.restaurant",
  cafes: "catering.cafe",
  salons: "service.beauty",
  mechanics: "service.vehicle",
  clinics: "healthcare.clinic_or_praxis",
  pharmacies: "healthcare.pharmacy",
  hotels: "accommodation.hotel",
  retail_shops: "commercial.shopping_mall,commercial.marketplace,shop",
  law_firms: "office.lawyer",
  real_estate: "office.estate_agent",
};

export async function POST(request: NextRequest) {
  if (!GEOAPIFY_KEY) {
    return NextResponse.json(
      { error: "Geoapify API key is not configured on the server." },
      { status: 500 }
    );
  }

  const { location, category, radius } = await request.json();

  if (!location || !category) {
    return NextResponse.json(
      { error: "Location and category are required." },
      { status: 400 }
    );
  }

  const categoryCode = CATEGORY_MAP[category] ?? category;
  const searchRadius = radius ?? 5000; // meters, default 5km

  try {
    // Step 1: Geocode the location text into coordinates
    const geoRes = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        location
      )}&limit=1&apiKey=${GEOAPIFY_KEY}`
    );
    const geoData = await geoRes.json();

    const coords = geoData?.features?.[0]?.geometry?.coordinates;
    if (!coords) {
      return NextResponse.json(
        { error: `Could not find location: "${location}"` },
        { status: 404 }
      );
    }
    const [lon, lat] = coords;

    // Step 2: Search Places API within a radius of that point
    const placesRes = await fetch(
      `https://api.geoapify.com/v2/places?categories=${categoryCode}&filter=circle:${lon},${lat},${searchRadius}&limit=30&apiKey=${GEOAPIFY_KEY}`
    );
    const placesData = await placesRes.json();

    const businesses = (placesData?.features ?? []).map((f: any) => {
      const p = f.properties;
      const website =
        p.website ||
        p.datasource?.raw?.website ||
        p.datasource?.raw?.["contact:website"] ||
        null;

      return {
        business_name: p.name || "Unnamed business",
        category: p.categories?.[0]?.split(".").pop() || category,
        address: p.formatted || null,
        phone: p.contact?.phone || p.datasource?.raw?.phone || null,
        website_url: website,
        has_website: !!website,
      };
    });

    // Filter out entries with no name (unusable leads)
    const usable = businesses.filter(
      (b: any) => b.business_name !== "Unnamed business"
    );

    return NextResponse.json({ businesses: usable });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong while searching. Try again." },
      { status: 500 }
    );
  }
}