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
