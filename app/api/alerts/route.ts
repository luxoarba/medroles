import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { email, specialty, grade, region } = body as Record<string, string>;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("job_alerts").insert({
    email: email.toLowerCase().trim(),
    specialty: specialty || null,
    grade: grade || null,
    region: region || null,
  });

  if (error) {
    console.error("job_alerts insert error:", error);
    return NextResponse.json({ error: "Failed to save alert" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
