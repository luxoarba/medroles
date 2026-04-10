/**
 * CQC ratings import script
 *
 * Downloads the CQC "Care directory with ratings" ODS file, streams the
 * Providers sheet from the ZIP, and SAX-parses it in tall format:
 *   one row per (provider, domain) — e.g. "Overall", "Safe", "Effective" …
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

import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { createClient } from "@supabase/supabase-js";
import yauzl from "yauzl";
import sax from "sax";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CQC_ODS_URL =
  "https://www.cqc.org.uk/sites/default/files/2026-04/01_April_2026_Latest_ratings.ods";

const MATCH_THRESHOLD = 0.40;

// NHS trust provider types to include (exclude care homes, dentists, GPs etc.)
const NHS_TYPES = new Set([
  "NHS Trust",
  "NHS Foundation Trust",
  "NHS Healthcare Organisation",
  "NHS Independent Sector",
]);

// ---------------------------------------------------------------------------
// Env loading
// ---------------------------------------------------------------------------

function loadEnv() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) process.env[m[1]] ??= m[2].trim();
    }
  } catch { /* already set */ }
}

// ---------------------------------------------------------------------------
// Fuzzy name matching
// ---------------------------------------------------------------------------

function normaliseName(name) {
  return String(name ?? "")
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

function matchScore(a, b) {
  const sa = tokenSet(a);
  const sb = tokenSet(b);
  if (!sa.size || !sb.size) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  return inter / new Set([...sa, ...sb]).size;
}

function bestMatch(trustName, cqcProviders) {
  let best = null, bestScore = 0;
  for (const p of cqcProviders) {
    const s = matchScore(trustName, p.providerName);
    if (s > bestScore) { bestScore = s; best = p; }
  }
  return bestScore >= MATCH_THRESHOLD ? { ...best, score: bestScore } : null;
}

// ---------------------------------------------------------------------------
// Download ODS to temp file
// ---------------------------------------------------------------------------

async function downloadToFile() {
  console.log("Downloading CQC ratings file (24 MB)…");
  const res = await fetch(CQC_ODS_URL, {
    headers: { "User-Agent": "MedRoles/1.0 (NHS job board)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const tmp = join(tmpdir(), "cqc_ratings.ods");
  writeFileSync(tmp, buf);
  console.log(`  ${(buf.length / 1024 / 1024).toFixed(1)} MB → ${tmp}`);
  return tmp;
}

// ---------------------------------------------------------------------------
// Stream-parse the Providers sheet from the ODS ZIP
//
// The Providers sheet is TALL format — one row per (provider, domain):
//
//   Provider ID | Provider Name | Provider Type | … | Domain       | Latest Rating
//   1-xxx       | Foo NHS Trust | NHS Trust     | … | Overall      | Good
//   1-xxx       | Foo NHS Trust | NHS Trust     | … | Safe         | Good
//   1-xxx       | Foo NHS Trust | NHS Trust     | … | Effective    | Outstanding
//   …
//
// We collect all domain rows per Provider ID, then pivot to wide format.
// ---------------------------------------------------------------------------

async function parseProvidersSheet(filePath) {
  return new Promise((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true }, (err, zip) => {
      if (err) return reject(err);
      zip.readEntry();

      zip.on("entry", (entry) => {
        if (entry.fileName !== "content.xml") return zip.readEntry();

        zip.openReadStream(entry, (err2, stream) => {
          if (err2) return reject(err2);

          const parser = sax.createStream(true, {});

          let currentTable = null;
          let inProviders = false;
          let headers = null;
          let rowIdx = 0;

          let cells = [], inText = false, cellText = "", repeatCount = 1;

          // tall: providerId → { providerName, providerType, domains: Map<domain→{rating,reportDate}> }
          const providerMap = new Map();

          // Column indices (resolved once we see the header)
          let CI = null;

          parser.on("opentag", (node) => {
            if (node.name === "table:table") {
              currentTable = node.attributes["table:name"];
              inProviders = currentTable === "Providers";
              rowIdx = 0;
              headers = null;
              CI = null;
              return;
            }
            if (!inProviders) return;

            if (node.name === "table:table-row") {
              cells = [];
            } else if (node.name === "table:table-cell" || node.name === "table:covered-table-cell") {
              repeatCount = parseInt(node.attributes["table:number-columns-repeated"] ?? "1", 10);
              // Date cells: prefer office:date-value attribute if present
              const dateVal = node.attributes["office:date-value"] ?? null;
              cellText = dateVal ?? "";
              inText = dateVal ? false : false; // will be overwritten by text:p if no date attr
              if (!dateVal) { cellText = ""; inText = false; }
            } else if (node.name === "text:p") {
              if (!cellText) inText = true; // only read text if no date attr already set
            }
          });

          parser.on("text", (t) => {
            if (inText && inProviders) cellText += t;
          });

          parser.on("closetag", (n) => {
            if (!inProviders) return;

            if (n === "text:p") {
              inText = false;
            } else if (n === "table:table-cell" || n === "table:covered-table-cell") {
              for (let i = 0; i < repeatCount; i++) cells.push(cellText);
              cellText = "";
              repeatCount = 1;
            } else if (n === "table:table-row") {
              if (rowIdx === 0) {
                // Header row
                headers = cells.map((c) => c.trim());
                const fi = (candidates) => {
                  for (const c of candidates) {
                    const i = headers.indexOf(c);
                    if (i !== -1) return i;
                  }
                  const low = headers.map((h) => h.toLowerCase());
                  for (const c of candidates) {
                    const i = low.indexOf(c.toLowerCase());
                    if (i !== -1) return i;
                  }
                  return -1;
                };
                CI = {
                  providerId:   fi(["Provider ID"]),
                  providerName: fi(["Provider Name"]),
                  providerType: fi(["Provider Type"]),
                  domain:       fi(["Domain"]),
                  rating:       fi(["Latest Rating"]),
                  reportDate:   fi(["Latest Rating (when published)", "Publication Date", "Report Date", "Latest Published Date"]),
                };
                console.log("  Providers sheet headers:", headers.slice(0, 16).join(" | "));
                console.log("  Column indices:", JSON.stringify(CI));
              } else if (CI && cells.length > CI.providerId) {
                const id   = cells[CI.providerId]?.trim();
                const name = cells[CI.providerName]?.trim();
                const type = cells[CI.providerType]?.trim() ?? "";
                const domain  = cells[CI.domain]?.trim()  ?? "";
                const rating  = cells[CI.rating]?.trim()  ?? "";
                const repDate = CI.reportDate >= 0 ? (cells[CI.reportDate]?.trim() ?? "") : "";

                if (id && name) {
                  if (!providerMap.has(id)) {
                    providerMap.set(id, { providerId: id, providerName: name, providerType: type, domains: new Map() });
                  }
                  if (domain && rating) {
                    providerMap.get(id).domains.set(domain.toLowerCase(), { rating, reportDate: repDate });
                  }
                }

                if (rowIdx % 20000 === 0) {
                  process.stdout.write(`  parsed ${rowIdx} rows, ${providerMap.size} providers\r`);
                }
              }

              rowIdx++;
            }
          });

          parser.on("end", () => {
            console.log(`\n  Providers sheet: ${rowIdx} rows, ${providerMap.size} unique providers`);

            // Pivot to wide format, filter to NHS trusts
            const results = [];
            for (const p of providerMap.values()) {
              const type = p.providerType.toLowerCase();
              const isNhs = type.includes("nhs") || type.includes("nhs trust") || type.includes("foundation trust");

              // Also include based on having domains — some NHS entries may have generic types
              const overall = p.domains.get("overall");
              if (!overall?.rating) continue; // skip unrated
              if (!isNhs) continue;

              results.push({
                providerId:   p.providerId,
                providerName: p.providerName,
                overall:      overall.rating,
                reportDate:   overall.reportDate ?? "",
                safe:         p.domains.get("safe")?.rating        ?? null,
                effective:    p.domains.get("effective")?.rating   ?? null,
                caring:       p.domains.get("caring")?.rating      ?? null,
                responsive:   p.domains.get("responsive")?.rating  ?? null,
                wellLed:      p.domains.get("well-led")?.rating    ?? null,
              });
            }

            console.log(`  Retained ${results.length} rated NHS providers`);
            resolve(results);
          });

          parser.on("error", reject);
          stream.pipe(parser);
        });
      });

      zip.on("error", reject);
    });
  });
}

// ---------------------------------------------------------------------------
// Date normalisation
// ---------------------------------------------------------------------------

function normaliseDate(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  const parts = String(raw).split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return null;
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

  // 1. Our trusts
  console.log("Loading trusts from Supabase…");
  const { data: trusts, error: trustErr } = await supabase.from("trusts").select("id, name");
  if (trustErr) { console.error(trustErr); process.exit(1); }
  console.log(`  ${trusts.length} trusts in DB`);

  // 2. Download + parse
  const tmpFile = await downloadToFile();
  let cqcProviders;
  try {
    cqcProviders = await parseProvidersSheet(tmpFile);
  } finally {
    if (existsSync(tmpFile)) unlinkSync(tmpFile);
  }

  if (!cqcProviders.length) {
    console.error("No rated NHS providers found — check debug output above");
    process.exit(1);
  }

  // 3. Match
  console.log("\nMatching trust names…");
  const matched = [], unmatched = [];
  for (const trust of trusts) {
    const hit = bestMatch(trust.name, cqcProviders);
    if (hit) matched.push({ trust, hit });
    else unmatched.push(trust.name);
  }
  console.log(`  Matched: ${matched.length}  |  Unmatched: ${unmatched.length}`);
  if (unmatched.length <= 30) {
    for (const n of unmatched) console.log(`  Unmatched: ${n}`);
  }

  // 4. Upsert
  console.log("\nUpserting CQC ratings…");
  let updated = 0;

  for (const { trust, hit } of matched) {
    const { error } = await supabase.from("trusts").update({
      cqc_provider_id: hit.providerId,
      cqc_overall:     hit.overall,
      cqc_safe:        hit.safe,
      cqc_effective:   hit.effective,
      cqc_caring:      hit.caring,
      cqc_responsive:  hit.responsive,
      cqc_well_led:    hit.wellLed,
      cqc_report_date: normaliseDate(hit.reportDate),
    }).eq("id", trust.id);

    if (error) {
      console.warn(`  Error ${trust.name}: ${error.message}`);
    } else {
      console.log(`  ✓ ${trust.name} → ${hit.overall} (score: ${hit.score.toFixed(2)})`);
      updated++;
    }
  }

  console.log(`\nDone. ${updated}/${trusts.length} trusts updated with CQC ratings.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
