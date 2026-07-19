import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required." }, { status: 400 });
  }

  const target = url.startsWith("http") ? url : `https://${url}`;
  const issues: string[] = [];
  let score = 100;

  const start = Date.now();

  try {
    const res = await fetch(target, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 (LeadForgeBot)" },
    });

    const elapsedMs = Date.now() - start;
    const html = await res.text();

    // Site unreachable or erroring
    if (!res.ok) {
      issues.push(`Site returned an error (status ${res.status})`);
      score -= 40;
    }

    // HTTPS check
    if (!target.startsWith("https://")) {
      issues.push("Not using HTTPS");
      score -= 15;
    }

    // Mobile-friendly check
    const hasViewportMeta = /<meta[^>]+name=["']viewport["']/i.test(html);
    if (!hasViewportMeta) {
      issues.push("No mobile viewport tag — likely not mobile-friendly");
      score -= 20;
    }

    // Load speed check
    if (elapsedMs > 4000) {
      issues.push(`Slow to load (${(elapsedMs / 1000).toFixed(1)}s)`);
      score -= 15;
    } else if (elapsedMs > 2000) {
      issues.push(`Somewhat slow (${(elapsedMs / 1000).toFixed(1)}s)`);
      score -= 5;
    }

    // Basic staleness signal: no title tag at all is a bad sign
    if (!/<title>/i.test(html)) {
      issues.push("Missing page title");
      score -= 10;
    }

    score = Math.max(0, Math.min(100, score));

    return NextResponse.json({ score, issues, reachable: true });
  } catch (err) {
    // Site didn't respond at all — dead or broken link
    return NextResponse.json({
      score: 0,
      issues: ["Site did not respond — likely dead or broken"],
      reachable: false,
    });
  }
}
