import { NextRequest, NextResponse } from "next/server";

const GEOAPIFY_KEY = process.env.GEOAPIFY_API_KEY;
const SERPAPI_KEY = process.env.SERPAPI_KEY;

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

const CATEGORY_SEARCH_TERM: Record<string, string> = {
  restaurants: "restaurants",
  cafes: "cafes",
  salons: "salons beauty",
  mechanics: "mechanics auto repair",
  clinics: "clinics",
  pharmacies: "pharmacies",
  hotels: "hotels",
  retail_shops: "shops retail",
  law_firms: "law firms",
  real_estate: "real estate agents",
};

type Business = {
  business_name: string;
  category: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  has_website: boolean;
};

function normalizeName(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

async function searchSerpApi(location: string, category: string): Promise<Business[]> {
  if (!SERPAPI_KEY) return [];

  const term = CATEGORY_SEARCH_TERM[category] ?? category;
  const query = `${term} in ${location}`;

  try {
    const res = await fetch(
      `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(
        query
      )}&type=search&api_key=${SERPAPI_KEY}`
    );
    const data = await res.json();

    const results = data?.local_results ?? [];

    return results.map((r: any) => ({
      business_name: r.title || "Unnamed business",
      category: r.type || category,
      address: r.address || null,
      phone: r.phone || null,
      email: null,
      website_url: r.website || null,
      has_website: !!r.website,
    }));
  } catch (err) {
    console.error("SerpApi search failed:", err);
    return [];
  }
}

async function searchGeoapify(location: string, category: string): Promise<Business[]> {
  if (!GEOAPIFY_KEY) return [];

  const categoryCode = CATEGORY_MAP[category] ?? category;

  try {
    const geoRes = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        location
      )}&limit=1&apiKey=${GEOAPIFY_KEY}`
    );
    const geoData = await geoRes.json();

    const coords = geoData?.features?.[0]?.geometry?.coordinates;
    if (!coords) return [];
    const [lon, lat] = coords;

    const placesRes = await fetch(
      `https://api.geoapify.com/v2/places?categories=${categoryCode}&filter=circle:${lon},${lat},5000&limit=30&apiKey=${GEOAPIFY_KEY}`
    );
    const placesData = await placesRes.json();

    const businesses = (placesData?.features ?? []).map((f: any) => {
      const p = f.properties;
      const raw = p.datasource?.raw || {};

      const website = p.website || raw.website || raw["contact:website"] || null;
      const phone =
        p.contact?.phone ||
        raw.phone ||
        raw["contact:phone"] ||
        raw.mobile ||
        raw["contact:mobile"] ||
        null;
      const email = raw.email || raw["contact:email"] || null;

      const categories: string[] = p.categories || [];
      const specific = categories.filter((c) => c.includes(".")).pop();
      const categoryLabel = specific ? specific.split(".").pop() : category;

      return {
        business_name: p.name || "Unnamed business",
        category: categoryLabel || category,
        address: p.formatted || null,
        phone,
        email,
        website_url: website,
        has_website: !!website,
      };
    });

    return businesses.filter((b: any) => b.business_name !== "Unnamed business");
  } catch (err) {
    console.error("Geoapify search failed:", err);
    return [];
  }
}

function mergeResults(a: Business[], b: Business[]): Business[] {
  const merged: Business[] = [...a];
  const seenNames = new Set(a.map((biz) => normalizeName(biz.business_name)));

  for (const biz of b) {
    const key = normalizeName(biz.business_name);

    if (seenNames.has(key)) {
      // Fill in any missing fields on the existing entry from this source
      const existing = merged.find((m) => normalizeName(m.business_name) === key);
      if (existing) {
        existing.phone = existing.phone || biz.phone;
        existing.email = existing.email || biz.email;
        existing.address = existing.address || biz.address;
        if (!existing.website_url && biz.website_url) {
          existing.website_url = biz.website_url;
          existing.has_website = true;
        }
      }
    } else {
      merged.push(biz);
      seenNames.add(key);
    }
  }

  return merged;
}

export async function POST(request: NextRequest) {
  const { location, category } = await request.json();

  if (!location || !category) {
    return NextResponse.json(
      { error: "Location and category are required." },
      { status: 400 }
    );
  }

  if (!GEOAPIFY_KEY && !SERPAPI_KEY) {
    return NextResponse.json(
      { error: "No search providers are configured on the server." },
      { status: 500 }
    );
  }

  try {
    const [serpResults, geoResults] = await Promise.all([
      searchSerpApi(location, category),
      searchGeoapify(location, category),
    ]);

    if (serpResults.length === 0 && geoResults.length === 0) {
      return NextResponse.json(
        { error: `No results found for "${category}" near "${location}".` },
        { status: 404 }
      );
    }

    // SerpApi tends to have better contact data; Geoapify fills gaps
    // and adds businesses SerpApi missed
    const combined = mergeResults(serpResults, geoResults);

    return NextResponse.json({ businesses: combined });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong while searching. Try again." },
      { status: 500 }
    );
  }
}
