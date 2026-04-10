/**
 * CQC ratings import script
 *
 * Fetches all provider listings from the CQC public API, fuzzy-matches them
 * against our trusts table by name, then upserts CQC rating fields.
 *
 * Run from the repo root:
 *   node scripts/import-cqc.mjs
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * You must first run the migration in Supabase SQL editor:
 *   supabase/migrations/20260410000000_add_cqc_fields.sql
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CQC_BASE = "https://api.cqc.org.uk/public/v1";
const PARTNER_CODE = "medroles";
const PER_PAGE = 1000;
const DETAIL_CONCURRENCY = 5;   // parallel provider-detail fetches
const DELAY_MS = 200;           // ms between batches to avoid hammering API
const MATCH_THRESHOLD = 0.45;   // minimum token-overlap score to accept a match

// ---------------------------------------------------------------------------
// Load env from .env.local (no dotenv dep needed)
// ---------------------------------------------------------------------------

function loadEnv() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) process.env[m[1]] ??= m[2].trim();
    }
  } catch {
    // .env.local not found — env vars must already be set
  }
}

// ---------------------------------------------------------------------------
// Name normalisation & fuzzy matching
// ---------------------------------------------------------------------------

function normaliseName(name) {
  return name
    .toLowerCase()
    .replace(/\bnhs\b/g, "")
    .replace(/\bfoundation\b/g, "")
    .replace(/\btrusts?\b/g, "")
    .replace(/\bhospitals?\b/g, "")
    .replace(/\buniversity\b/g, "uni")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(name) {
  return new Set(normaliseName(name).split(" ").filter(Boolean));
}

/** Jaccard-style token overlap score */
function matchScore(a, b) {
  const sa = tokenSet(a);
  const sb = tokenSet(b);
  let intersection = 0;
  for (const t of sa) if (sb.has(t)) intersection++;
  const union = new Set([...sa, ...sb]).size;
  return union === 0 ? 0 : intersection / union;
}

/** Returns the best-matching CQC provider for a trust name, or null */
function bestMatch(trustName, cqcProviders) {
  let best = null;
  let bestScore = 0;
  for (const p of cqcProviders) {
    const score = matchScore(trustName, p.providerName);
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return bestScore >= MATCH_THRESHOLD ? { ...best, score: bestScore } : null;
}

// ---------------------------------------------------------------------------
// CQC API helpers
// ---------------------------------------------------------------------------

async function cqcGet(path) {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${CQC_BASE}${path}${sep}partnerCode=${PARTNER_CODE}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CQC API ${res.status} for ${url}`);
  return res.json();
}

async function fetchAllCqcProviders() {
  console.log("Fetching CQC provider list…");
  const first = await cqcGet(`/providers?page=1&perPage=${PER_PAGE}`);
  const totalPages = first.totalPages;
  console.log(`  ${first.total} total providers across ${totalPages} pages`);

  const all = [...first.providers];
  for (let page = 2; page <= totalPages; page++) {
    process.stdout.write(`  page ${page}/${totalPages}\r`);
    const data = await cqcGet(`/providers?page=${page}&perPage=${PER_PAGE}`);
    all.push(...data.providers);
  }
  console.log(`\nFetched ${all.length} providers`);
  return all;
}

async function fetchProviderDetail(providerId) {
  try {
    return await cqcGet(`/providers/${providerId}`);
  } catch (err) {
    console.warn(`  Could not fetch ${providerId}: ${err.message}`);
    return null;
  }
}

/** Fetch details in small parallel batches */
async function fetchDetailsBatched(providerIds) {
  const results = [];
  for (let i = 0; i < providerIds.length; i += DETAIL_CONCURRENCY) {
    const batch = providerIds.slice(i, i + DETAIL_CONCURRENCY);
    process.stdout.write(`  fetching details ${i + 1}–${Math.min(i + DETAIL_CONCURRENCY, providerIds.length)} of ${providerIds.length}\r`);
    const settled = await Promise.all(batch.map(fetchProviderDetail));
    results.push(...settled.filter(Boolean));
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  console.log("");
  return results;
}

// ---------------------------------------------------------------------------
// Rating extraction
// ---------------------------------------------------------------------------

/** Returns { overall, safe, effective, caring, responsive, wellLed, reportDate } */
function extractRatings(detail) {
  const r = detail?.currentRatings?.overall;
  if (!r) return null;

  const domains = {};
  for (const kq of r.keyQuestionRatings ?? []) {
    domains[kq.name.toLowerCase().replace(/[^a-z]/g, "")] = kq.rating ?? null;
  }

  return {
    cqc_overall:    r.rating ?? null,
    cqc_safe:       domains["safe"] ?? null,
    cqc_effective:  domains["effective"] ?? null,
    cqc_caring:     domains["caring"] ?? null,
    cqc_responsive: domains["responsive"] ?? null,
    cqc_well_led:   domains["wellled"] ?? null,
    cqc_report_date: r.reportDate ?? null,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // 1. Fetch our trusts
  console.log("Loading trusts from Supabase…");
  const { data: trusts, error: trustErr } = await supabase
    .from("trusts")
    .select("id, name");
  if (trustErr) { console.error(trustErr); process.exit(1); }
  console.log(`  ${trusts.length} trusts in DB`);

  // 2. Fetch full CQC provider list (IDs + names only)
  const cqcProviders = await fetchAllCqcProviders();

  // 3. Match each trust to a CQC provider
  console.log("\nMatching trust names to CQC providers…");
  const matched = [];
  const unmatched = [];

  for (const trust of trusts) {
    const hit = bestMatch(trust.name, cqcProviders);
    if (hit) {
      matched.push({ trust, cqcProvider: hit });
    } else {
      unmatched.push(trust.name);
    }
  }

  console.log(`  Matched: ${matched.length}  |  Unmatched: ${unmatched.length}`);
  if (unmatched.length > 0) {
    console.log("  Unmatched trusts:");
    for (const name of unmatched) console.log(`    - ${name}`);
  }

  // 4. Fetch CQC details for matched providers
  console.log("\nFetching CQC provider details for matched trusts…");
  const providerIds = matched.map((m) => m.cqcProvider.providerId);
  const details = await fetchDetailsBatched(providerIds);

  // Build map: providerId → detail
  const detailMap = new Map(details.map((d) => [d.providerId, d]));

  // 5. Upsert ratings into Supabase
  console.log("Upserting CQC ratings into trusts…");
  let updated = 0;
  let noRatings = 0;

  for (const { trust, cqcProvider } of matched) {
    const detail = detailMap.get(cqcProvider.providerId);
    if (!detail) continue;

    // Only import NHS-owned providers (skip independent sector)
    if (detail.ownershipType && !detail.ownershipType.includes("NHS")) {
      continue;
    }

    const ratings = extractRatings(detail);
    if (!ratings || !ratings.cqc_overall) {
      noRatings++;
      continue;
    }

    const { error } = await supabase
      .from("trusts")
      .update({
        cqc_provider_id: cqcProvider.providerId,
        ...ratings,
      })
      .eq("id", trust.id);

    if (error) {
      console.warn(`  Error updating ${trust.name}: ${error.message}`);
    } else {
      console.log(`  ✓ ${trust.name} → ${ratings.cqc_overall} (score: ${cqcProvider.score.toFixed(2)})`);
      updated++;
    }
  }

  console.log(`\nDone. ${updated} trusts updated, ${noRatings} matched but had no CQC rating yet.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
