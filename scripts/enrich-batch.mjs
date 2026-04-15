// Batch enrichment for NHS Jobs with null requirements
// Usage: node scripts/enrich-batch.mjs [limit]

// Reads from .env.local — run from repo root: node scripts/enrich-batch.mjs [limit]
import { readFileSync } from "fs";
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter(l => l.includes("="))
    .map(l => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()])
);
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const LIMIT = parseInt(process.argv[2] ?? "400", 10);
const CONCURRENCY = 8;

function htmlToText(html) {
  return html
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c, 10)))
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|li|div|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractById(html, id) {
  const re = new RegExp(`id="${id}"[^>]*>([\\s\\S]*?)<\/[^>]+>`, "i");
  const m = html.match(re);
  return m ? htmlToText(m[1]) : null;
}

function extractCriteria(html, prefix) {
  const items = [];
  let n = 1;
  while (true) {
    const id = `${prefix}_criteria_${n}`;
    const re = new RegExp(`id="${id}"[^>]*>([\\s\\S]*?)<\/li>`, "i");
    const m = html.match(re);
    if (!m) break;
    const text = htmlToText(m[1]).trim();
    if (text) items.push(text);
    n++;
  }
  return items;
}

async function enrichJob(job) {
  try {
    const res = await fetch(job.external_url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MedRoles/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { id: job.id, status: `HTTP ${res.status}` };
    const html = await res.text();

    const sections = [
      extractById(html, "job_overview"),
      extractById(html, "job_description"),
      extractById(html, "about_organisation"),
    ].filter(Boolean).join("\n\n").trim() || null;

    const essential = extractCriteria(html, "essential_skill_1");
    const desirable = extractCriteria(html, "desirable_skill_1");

    if (!sections && essential.length === 0) {
      return { id: job.id, status: "no_content" };
    }

    const patch = {};
    if (sections) patch.description = sections;
    if (essential.length > 0) patch.requirements = essential;
    if (desirable.length > 0) patch.benefits = desirable;

    const patchRes = await fetch(
      `${SUPABASE_URL}/rest/v1/job_listings?id=eq.${job.id}`,
      {
        method: "PATCH",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(patch),
      },
    );
    return { id: job.id, status: patchRes.ok ? "ok" : `patch_${patchRes.status}` };
  } catch (e) {
    return { id: job.id, status: `err_${e.message?.slice(0, 30)}` };
  }
}

async function main() {
  // Fetch unenriched NHS Jobs
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/job_listings?select=id,external_url&requirements=is.null&source=eq.NHS+Jobs&limit=${LIMIT}`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    },
  );
  const jobs = await res.json();
  console.log(`Fetched ${jobs.length} unenriched NHS Jobs (limit=${LIMIT})`);

  let done = 0, ok = 0, failed = 0;
  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    const batch = jobs.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(enrichJob));
    for (const r of results) {
      done++;
      if (r.status === "ok") ok++;
      else { failed++; if (failed <= 10) console.log("  fail:", r.id, r.status); }
    }
    if (done % 50 === 0) process.stdout.write(`  ${done}/${jobs.length} (ok=${ok}, fail=${failed})\n`);
  }
  console.log(`Done. ok=${ok} fail=${failed} total=${done}`);
}

main().catch(console.error);
