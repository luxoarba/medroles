// app/api/scrape/route.ts
import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function callFunction(name: string) {
  return fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
}

export async function POST() {
  if (!SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not configured" },
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
