import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });

  const { trust_id, specialty, grade, format, questions_asked, difficulty, got_offer } = body;

  if (!trust_id || !specialty) {
    return NextResponse.json({ error: "trust_id and specialty are required." }, { status: 400 });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trust_id)) {
    return NextResponse.json({ error: "Invalid trust_id." }, { status: 400 });
  }
  if (difficulty != null && ![1, 2, 3, 4, 5].includes(difficulty)) {
    return NextResponse.json({ error: "difficulty must be 1–5." }, { status: 400 });
  }
  if (questions_asked && questions_asked.length > 2000) {
    return NextResponse.json({ error: "questions_asked must be 2000 characters or fewer." }, { status: 400 });
  }

  const { error } = await supabase.from("interview_insights").insert({
    trust_id,
    specialty,
    grade: grade ?? null,
    format: format ?? null,
    questions_asked: questions_asked ?? null,
    difficulty: difficulty ?? null,
    got_offer: got_offer ?? null,
  });

  if (error) {
    console.error("interview_insights insert error:", error);
    return NextResponse.json({ error: "Failed to save insight." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
