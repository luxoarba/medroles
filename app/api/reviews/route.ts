import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });

  const { trust_id, grade, specialty, overall_rating, training_rating, rota_rating, culture_rating, review_text } = body;

  if (!trust_id || overall_rating == null) {
    return NextResponse.json({ error: "trust_id and overall_rating are required." }, { status: 400 });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trust_id)) {
    return NextResponse.json({ error: "Invalid trust_id." }, { status: 400 });
  }
  if (![1, 2, 3, 4, 5].includes(overall_rating)) {
    return NextResponse.json({ error: "overall_rating must be 1–5." }, { status: 400 });
  }
  if (review_text && review_text.length > 2000) {
    return NextResponse.json({ error: "review_text must be 2000 characters or fewer." }, { status: 400 });
  }

  const { error } = await supabase.from("trust_reviews").insert({
    trust_id,
    grade: grade ?? null,
    specialty: specialty ?? null,
    overall_rating,
    training_rating: training_rating ?? null,
    rota_rating: rota_rating ?? null,
    culture_rating: culture_rating ?? null,
    review_text: review_text ?? null,
    verified: false,
  });

  if (error) {
    console.error("trust_reviews insert error:", error);
    return NextResponse.json({ error: "Failed to save review." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
