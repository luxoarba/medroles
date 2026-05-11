import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Regex: fast free checks before hitting the AI ──────────────────────────
const PATTERNS: { re: RegExp; msg: string }[] = [
  { re: /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/, msg: "Please remove NHS numbers from your review." },
  { re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, msg: "Please remove email addresses from your review." },
  { re: /\b(07\d{9}|0[1-9]\d{8,9}|\+44[\s-]?\d{10})\b/, msg: "Please remove phone numbers from your review." },
];

function regexCheck(text: string): string | null {
  for (const { re, msg } of PATTERNS) {
    if (re.test(text)) return msg;
  }
  return null;
}

// ── Claude moderation ───────────────────────────────────────────────────────
async function moderateWithClaude(text: string): Promise<{ safe: boolean; reason: string | null }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { safe: true, reason: null };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 120,
        messages: [
          {
            role: "user",
            content: `You moderate anonymous workplace reviews on an NHS job board for doctors. Check this text for:
1. Full names of specific people (patients, colleagues, managers)
2. Patient-identifiable information (dates of birth, addresses, clinical case details)
3. Profanity or abusive language directed at named individuals
4. Contact details (emails, phone numbers, GMC numbers)

Reply with JSON only — no other text.
If acceptable: {"safe":true}
If not: {"safe":false,"reason":"one short sentence telling the user what to remove"}

Text:
${text}`,
          },
        ],
      }),
    });

    if (!res.ok) return { safe: true, reason: null };

    const data = await res.json();
    const raw: string = data?.content?.[0]?.text ?? "{}";
    return JSON.parse(raw);
  } catch {
    // If moderation fails, let the review through rather than block legitimate submissions
    return { safe: true, reason: null };
  }
}

// ── Route handler ───────────────────────────────────────────────────────────
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

  const text: string = review_text?.trim() ?? "";

  if (text.length > 2000) {
    return NextResponse.json({ error: "Review must be 2000 characters or fewer." }, { status: 400 });
  }

  if (text) {
    // 1. Cheap regex check
    const regexError = regexCheck(text);
    if (regexError) {
      return NextResponse.json({ error: regexError }, { status: 422 });
    }

    // 2. Claude moderation
    const { safe, reason } = await moderateWithClaude(text);
    if (!safe) {
      return NextResponse.json(
        { error: reason ?? "Your review contains content that can't be published. Please remove any names, patient details, or offensive language and try again." },
        { status: 422 },
      );
    }
  }

  const { error } = await supabase.from("trust_reviews").insert({
    trust_id,
    grade: grade ?? null,
    specialty: specialty ?? null,
    overall_rating,
    training_rating: training_rating ?? null,
    rota_rating: rota_rating ?? null,
    culture_rating: culture_rating ?? null,
    review_text: text || null,
    verified: false,
  });

  if (error) {
    console.error("trust_reviews insert error:", error);
    return NextResponse.json({ error: "Failed to save review." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
