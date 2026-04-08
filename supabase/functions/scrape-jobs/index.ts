import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const BASE_URL = "https://www.jobs.nhs.uk";
const SEARCH_PATH = "/candidate/search/results";
const MAX_PAGES = 15; // 300 jobs per run — stay well within 150s timeout
const DELAY_MS = 150;

interface ParsedJob {
  vacancyId: string;
  title: string;
  trustName: string;
  location: string | null;
  salaryText: string | null;
  closingDateText: string | null;
  postedDateText: string | null;
  contractTypeText: string | null;
  externalUrl: string;
}

// --- HTML parsing helpers ---

function extractText(html: string, dataTest: string): string | null {
  const re = new RegExp(
    `data-test="${dataTest}"[\\s\\S]*?<strong[^>]*>([\\s\\S]*?)<\\/strong>`,
    "i",
  );
  const m = html.match(re);
  return m ? m[1].trim().replace(/\s+/g, " ") : null;
}

function parseJobCards(html: string): ParsedJob[] {
  const jobs: ParsedJob[] = [];

  // Split into individual job card strings on the opening li tag
  const cardRegex = /<li[^>]*data-test="search-result"[^>]*>([\s\S]*?)(?=<li[^>]*data-test="search-result"|<\/ul>)/g;
  let match: RegExpExecArray | null;

  while ((match = cardRegex.exec(html)) !== null) {
    const card = match[1];

    // Extract vacancy ID and title from the job title link
    const titleLinkMatch = card.match(
      /\/candidate\/jobadvert\/([^?"'\s]+)[^>]*data-test="search-result-job-title"[^>]*>\s*([\s\S]*?)\s*<\/a>/,
    ) ?? card.match(
      /data-test="search-result-job-title"[^>]*href="\/candidate\/jobadvert\/([^?"'\s]+)[^>]*>\s*([\s\S]*?)\s*<\/a>/,
    ) ?? card.match(
      /href="\/candidate\/jobadvert\/([^?"'\s]+)[\s\S]*?data-test="search-result-job-title"[^>]*>\s*([\s\S]*?)\s*<\/a>/,
    );

    if (!titleLinkMatch) continue;

    const vacancyId = titleLinkMatch[1];
    const title = titleLinkMatch[2].replace(/\s+/g, " ").trim();

    // Extract trust name: first text node inside <h3> inside [data-test="search-result-location"]
    const locationBlockMatch = card.match(
      /data-test="search-result-location"[\s\S]*?<h3[^>]*>\s*([\s\S]*?)<div/,
    );
    const trustName = locationBlockMatch
      ? locationBlockMatch[1].replace(/\s+/g, " ").trim()
      : "NHS Trust";

    // Extract location text from .location-font-size
    const locationMatch = card.match(/location-font-size"[^>]*>\s*([\s\S]*?)\s*<\/div>/);
    const location = locationMatch
      ? locationMatch[1].replace(/\s+/g, " ").trim() || null
      : null;

    jobs.push({
      vacancyId,
      title,
      trustName,
      location,
      salaryText: extractText(card, "search-result-salary"),
      closingDateText: extractText(card, "search-result-closingDate"),
      postedDateText: extractText(card, "search-result-publicationDate"),
      contractTypeText: extractText(card, "search-result-jobType"),
      externalUrl: `${BASE_URL}/candidate/jobadvert/${vacancyId}`,
    });
  }

  return jobs;
}

function parseTotalPages(html: string): number {
  const m = html.match(/([\d,]+)\s+jobs?\s+found/i);
  if (!m) return 1;
  const total = parseInt(m[1].replace(/,/g, ""), 10);
  return Math.min(Math.ceil(total / 20), MAX_PAGES);
}

// --- Data transformation helpers ---

const MONTHS: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04",
  may: "05", june: "06", july: "07", august: "08",
  september: "09", october: "10", november: "11", december: "12",
};

function parseDate(text: string | null): string | null {
  if (!text) return null;
  const m = text.trim().match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (!m) return null;
  const month = MONTHS[m[2].toLowerCase()];
  if (!month) return null;
  return `${m[3]}-${month}-${m[1].padStart(2, "0")}`;
}

function parseSalary(text: string | null): { min: number | null; max: number | null } {
  if (!text) return { min: null, max: null };
  // Skip hourly rates — not comparable with annual salary
  if (/an hour|per hour/i.test(text)) return { min: null, max: null };
  const nums = [...text.matchAll(/£([\d,]+(?:\.\d+)?)/g)].map(
    (m) => Math.round(parseFloat(m[1].replace(/,/g, ""))),
  );
  if (nums.length === 0) return { min: null, max: null };
  return { min: nums[0], max: nums[1] ?? nums[0] };
}

function mapContractType(text: string | null): string | null {
  if (!text) return null;
  const t = text.toLowerCase();
  if (t.includes("permanent")) return "Permanent";
  if (t.includes("fixed")) return "Fixed Term";
  if (t.includes("locum")) return "Locum";
  if (/\bpart[\s-]?time\b/.test(t)) return "Part-time";
  return null;
}

function inferGrade(title: string): string | null {
  const t = title.toLowerCase();
  if (/\bfy1\b|foundation year 1/.test(t)) return "FY1";
  if (/\bfy2\b|foundation year 2/.test(t)) return "FY2";
  if (/\bct1\b|core trainee 1/.test(t)) return "CT1";
  if (/\bct2\b|core trainee 2/.test(t)) return "CT2";
  if (/\bst3\b/.test(t)) return "ST3";
  if (/\bst4\b/.test(t)) return "ST4";
  if (/\bst5\b/.test(t)) return "ST5";
  if (/\bst6\b/.test(t)) return "ST6";
  if (/\bsas\b|associate specialist|staff grade/.test(t)) return "SAS";
  if (/\bconsultant\b/.test(t)) return "Consultant";
  return null;
}

const SPECIALTIES: [RegExp, string][] = [
  [/anaesth/i, "Anaesthetics"],
  [/cardiol/i, "Cardiology"],
  [/dermatol/i, "Dermatology"],
  [/emergency|a&e/i, "Emergency Medicine"],
  [/general pract|gp\b/i, "General Practice"],
  [/general surg/i, "General Surgery"],
  [/orthopaed/i, "Orthopaedics"],
  [/paediatr|pediatr/i, "Paediatrics"],
  [/psych/i, "Psychiatry"],
  [/radiol/i, "Radiology"],
];

function inferSpecialty(title: string): string | null {
  for (const [re, name] of SPECIALTIES) {
    if (re.test(title)) return name;
  }
  return null;
}

// --- DB helpers ---

async function resolveTrusts(
  names: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(names)];
  const nameToId = new Map<string, string>();

  // Fetch all existing trusts in one query
  const { data: existing } = await supabase
    .from("trusts")
    .select("id, name")
    .in("name", unique);

  for (const row of existing ?? []) {
    nameToId.set(row.name, row.id);
  }

  // Create missing trusts in one batch upsert
  const missing = unique.filter((n) => !nameToId.has(n));
  if (missing.length > 0) {
    const { data: created } = await supabase
      .from("trusts")
      .upsert(
        missing.map((name) => ({ name })),
        { onConflict: "name", ignoreDuplicates: false },
      )
      .select("id, name");

    for (const row of created ?? []) {
      nameToId.set(row.name, row.id);
    }
  }

  return nameToId;
}

// --- Fetch ---

async function fetchPage(page: number): Promise<string> {
  const url = new URL(`${BASE_URL}${SEARCH_PATH}`);
  url.searchParams.set("keyword", "");
  url.searchParams.set("category", "medical-and-dental");
  url.searchParams.set("page", String(page));

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; MedRoles/1.0; +https://medroles.co.uk)",
      Accept: "text/html",
    },
  });

  if (!res.ok) throw new Error(`NHS Jobs page ${page} returned ${res.status}`);
  return res.text();
}

// --- Main ---

Deno.serve(async () => {
  const stats = { upserted: 0, deleted: 0, errors: 0 };

  try {
    const firstHtml = await fetchPage(1);
    const totalPages = parseTotalPages(firstHtml);
    const allParsed: ParsedJob[] = parseJobCards(firstHtml);

    for (let page = 2; page <= totalPages; page++) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
      try {
        const html = await fetchPage(page);
        allParsed.push(...parseJobCards(html));
      } catch (e) {
        stats.errors++;
        console.error(`page ${page} fetch error:`, e);
      }
    }

    if (allParsed.length === 0) {
      return new Response(
        JSON.stringify({ ...stats, warning: "No jobs parsed from HTML" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Resolve all trusts in two DB calls (not one per job)
    const trustNames = allParsed.map((j) => j.trustName);
    const trustMap = await resolveTrusts(trustNames);

    // Build upsert rows
    const rows = allParsed.map((job) => {
      const { min, max } = parseSalary(job.salaryText);
      return {
        title: job.title,
        trust_id: trustMap.get(job.trustName) ?? null,
        region: job.location,
        grade: inferGrade(job.title),
        specialty: inferSpecialty(job.title),
        contract_type: mapContractType(job.contractTypeText),
        salary_min: min,
        salary_max: max,
        closes_at: parseDate(job.closingDateText),
        posted_at: parseDate(job.postedDateText),
        external_url: job.externalUrl,
        source: "NHS Jobs",
        category: "Medical and Dental",
        pay_band: null,
        on_call: null,
        training_post: null,
      };
    });

    // Batch upsert
    const { error: upsertError } = await supabase
      .from("job_listings")
      .upsert(rows, { onConflict: "external_url", ignoreDuplicates: false });

    if (upsertError) {
      stats.errors++;
      console.error("batch upsert error:", upsertError.message);
    } else {
      stats.upserted = rows.length;
    }

    // Delete expired jobs from this source only
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 1);
    const { count } = await supabase
      .from("job_listings")
      .delete({ count: "exact" })
      .eq("category", "Medical and Dental")
      .lt("closes_at", cutoff.toISOString().slice(0, 10));

    stats.deleted = count ?? 0;
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(stats), {
    headers: { "Content-Type": "application/json" },
  });
});
