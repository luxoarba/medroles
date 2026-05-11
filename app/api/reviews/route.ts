import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Regex: fast free checks before hitting the AI ──────────────────────────
const PROFANITY = [
  "fuck", "fucking", "fucked", "fucker", "fucks",
  "shit", "shitting", "shitter", "bullshit",
  "cunt", "cunts",
  "bastard", "bastards",
  "bitch", "bitches",
  "asshole", "arsehole", "arse",
  "dick", "dicks", "dickhead",
  "cock", "cocks",
  "piss", "pissed", "prick",
  "twat", "twats",
  "wanker", "wankers", "wank",
];

const PROFANITY_RE = new RegExp(
  `\\b(${PROFANITY.join("|")})\\b`,
  "i",
);

const PATTERNS: { re: RegExp; msg: string }[] = [
  { re: PROFANITY_RE, msg: "Please keep your review professional — offensive language isn't allowed." },
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
            content: `You moderate anonymous workplace reviews on an NHS job board for doctors. Your job is to protect patient and colleague privacy.

Flag the text if it contains ANY of the following:
1. Any name used to refer to a patient — this includes first names only ("Mr John"), titles with names ("Dr Smith"), or partial names. Even a single name is enough to flag if it appears to identify a patient.
2. Any name used to refer to a specific colleague, manager, or named individual in a way that could identify them.
3. Patient-identifiable details: dates of birth, hospital numbers, addresses, specific diagnoses linked to a person, case descriptions that could identify someone.
4. Contact details: emails, phone numbers, GMC numbers, NMC numbers.

Do NOT flag:
- General descriptions of working conditions, rota, training, culture
- Mentions of departments, wards, or specialties without naming individuals
- Critical but professional opinions about a trust or department

When in doubt, flag it. Privacy protection is the priority.

Reply with JSON only — no other text.
If acceptable: {"safe":true}
If not: {"safe":false,"reason":"one short sentence telling the user exactly what to remove"}

Text to review:
${text}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "(unreadable)");
      console.error("[moderation] Anthropic API error", res.status, errBody);
      return { safe: true, reason: null };
    }

    const data = await res.json();
    const raw: string = data?.content?.[0]?.text ?? "{}";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      console.error("[moderation] Failed to parse Claude response:", raw);
      return { safe: true, reason: null };
    }
  } catch (err) {
    console.error("[moderation] Fetch failed:", err);
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
