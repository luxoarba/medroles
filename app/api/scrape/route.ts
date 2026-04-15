// app/api/scrape/route.ts
import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Edge functions require a JWT bearer token — use the anon key (functions have their own service role internally)
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function callFunction(name: string) {
  return fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
}

const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

// Auto-trigger: fires scrapers in the background if last ingestion is stale.
// Called on page visit — returns immediately so it never blocks rendering.
export async function GET() {
  if (!ANON_KEY) return NextResponse.json({ skipped: true });

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/job_listings?select=created_at&order=created_at.desc&limit=1`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } },
    );
    const [latest] = await res.json();
    if (latest?.created_at) {
      const ageMs = Date.now() - new Date(latest.created_at).getTime();
      if (ageMs < COOLDOWN_MS) {
        return NextResponse.json({ skipped: true });
      }
    }
  } catch {
    // If the check fails just proceed and try to scrape
  }

  // Fire both scrapers without awaiting — don't block the response
  callFunction("scrape-jobs");
  callFunction("scrape-trac");

  return NextResponse.json({ triggered: true });
}

export async function POST() {
  if (!ANON_KEY) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SUPABASE_ANON_KEY not configured" },
      { status: 500 },
    );
  }

  try {
    const [nhsRes, tracRes] = await Promise.all([
      callFunction("scrape-jobs"),
      callFunction("scrape-trac"),
    ]);

    const [nhsData, tracData] = await Promise.all([
      nhsRes.json(),
      tracRes.json(),
    ]);

    const hasError = !nhsRes.ok || !tracRes.ok;

    return NextResponse.json(
      { nhs: nhsData, trac: tracData },
      { status: hasError ? 502 : 200 },
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
