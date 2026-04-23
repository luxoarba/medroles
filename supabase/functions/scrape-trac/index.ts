import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const BASE_URL = "https://www.healthjobsuk.com";
const LIST_PATH = "/job_list/Medical_and_Dental";
const SAFETY_PAGE_CAP = 200; // confirmed 137 pages as of Apr 2026; 200 gives headroom
const LIST_DELAY_MS = 150;
const DETAIL_CONCURRENCY = 8; // fetch detail pages in batches of 8
const MAX_DETAIL_FETCHES = 300; // per run — prioritise unenriched jobs, same pattern as scrape-jobs

interface ParsedJob {
  vacancyId: string;
  title: string;
  trustName: string;
  location: string | null;
  salaryText: string | null;
  externalUrl: string;
}

interface DetailData {
  closingDate: string | null; // ISO YYYY-MM-DD
  contractType: string | null;
  grade: string | null;
  location: string | null; // town from detail page
  salaryText: string | null;
  trustName: string | null;
  description: string | null;
  requirements: string[] | null;
  benefits: string[] | null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, c) => String.fromCharCode(parseInt(c, 16)));
}

// --- HTML parsing: list pages ---

function parseJobCards(html: string): ParsedJob[] {
  const jobs: ParsedJob[] = [];

  const cardRegex =
    /<a\s[^>]*href="(\/job\/[^"]*-v(\d+)[^"]*)"[^>]*>([\s\S]*?)(?=<a\s[^>]*href="\/job\/|<\/ul>|$)/g;

  let match: RegExpExecArray | null;
  while ((match = cardRegex.exec(html)) !== null) {
    const href = match[1];
    const vacancyId = match[2];
    const card = match[3];

    if (!vacancyId) continue;

    // <a title="Job Title"> is the most reliable source; fall back to hj-jobtitle div
    const aTitleMatch = match[0].match(/^<a\s[^>]*title="([^"]+)"/i);
    const titleMatch = aTitleMatch ? null :
      card.match(/<div[^>]*hj-jobtitle[^>]*>([\s\S]*?)<\/div>/i) ??
      card.match(/<h3[^>]*>\s*([\s\S]*?)\s*<\/h3>/i) ??
      card.match(/<p[^>]*>\s*([\s\S]*?)\s*<\/p>/i);
    const title = aTitleMatch
      ? decodeEntities(aTitleMatch[1].trim())
      : titleMatch
        ? decodeEntities(titleMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
        : "";
    if (!title) continue;

    const imgAltMatch = card.match(/<img[^>]*alt="([^"]+)"[^>]*>/i);
    const trustName = imgAltMatch
      ? decodeEntities(imgAltMatch[1].trim())
      : extractTrustFromUrl(href);

    const location = extractLocationFromUrl(href);

    const salaryMatch = card.match(/£[\d,]+(?:\.\d+)?(?:\s*[-–]\s*£[\d,]+(?:\.\d+)?)?[^<">]*/i);
    const salaryText = salaryMatch ? salaryMatch[0].trim() : null;

    const externalUrl = `${BASE_URL}/job/${href.replace(/^\/job\//, "").split("?")[0]}`;

    jobs.push({ vacancyId, title, trustName, location, salaryText, externalUrl });
  }

  return jobs;
}

function extractTrustFromUrl(href: string): string {
  const parts = href.split("?")[0].split("/").filter(Boolean);
  // parts: [job, UK, Region, City, Trust, Specialty, Title-vID]
  return parts.length >= 5 ? parts[4].replace(/_/g, " ") : "NHS Trust";
}

function extractLocationFromUrl(href: string): string | null {
  const parts = href.split("?")[0].split("/").filter(Boolean);
  return parts.length >= 4 ? parts[3].replace(/_/g, " ") || null : null;
}

function parseTotalPages(html: string): number {
  const totalMatch = html.match(/([\d,]+)\s+(?:jobs?|vacancies)\s+found/i);
  if (totalMatch) {
    const total = parseInt(totalMatch[1].replace(/,/g, ""), 10);
    return Math.min(Math.ceil(total / 50), SAFETY_PAGE_CAP);
  }
  const pgMatch = html.match(/_pg=(\d+)[^"]*"[^>]*>Last/i) ??
    html.match(/page=(\d+)[^"]*"[^>]*>\s*(?:Last|last)\s*</i);
  if (pgMatch) return Math.min(parseInt(pgMatch[1], 10), SAFETY_PAGE_CAP);
  return SAFETY_PAGE_CAP;
}

// --- HTML parsing: detail pages ---

// Extract a <dd> value immediately following a <dt> with given label
function extractDt(html: string, label: string): string | null {
  const re = new RegExp(
    `<dt[^>]*>\\s*${label}\\s*<\\/dt>\\s*<dd[^>]*>\\s*([\\s\\S]*?)\\s*<\\/dd>`,
    "i",
  );
  const m = html.match(re);
  return m ? m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : null;
}

function extractLiItems(ulInner: string): string[] | null {
  const items = [...ulInner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) =>
      decodeEntities(m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
    )
    .filter(Boolean);
  return items.length > 0 ? items : null;
}

function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|li|div|h[1-6]|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Extract the raw HTML content of a div/section element with a specific id.
// Returns everything from after the opening tag until the next hj-* id marker
// (which is always the next sibling section on healthjobsuk.com pages).
function extractRawDivById(html: string, id: string): string | null {
  const markerIdx = html.indexOf(`id="${id}"`);
  if (markerIdx < 0) return null;
  const tagEnd = html.indexOf(">", markerIdx) + 1;
  const chunk = html.slice(tagEnd, tagEnd + 20000);
  const nextBoundary = chunk.search(/id="hj-/);
  return nextBoundary > 0 ? chunk.slice(0, nextBoundary) : chunk.slice(0, 8000);
}

// Same as above but converts the raw HTML to plain text before returning.
function extractDivById(html: string, id: string): string | null {
  const raw = extractRawDivById(html, id);
  if (!raw) return null;
  const text = htmlToText(raw);
  return text.length > 10 ? text : null;
}

// Collect all <li> items from every <ul> that immediately follows an <h5> with
// exactly the given heading text. healthjobsuk.com repeats this pattern once per
// person-spec category (Education, Clinical skills, etc.).
function extractCriteriaByHeading(html: string, heading: string): string[] {
  const re = new RegExp(
    `<h5[^>]*>\\s*${heading}\\s*<\\/h5>\\s*<ul[^>]*>([\\s\\S]*?)<\\/ul>`,
    "gi",
  );
  const seen = new Set<string>();
  const items: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    for (const item of extractLiItems(m[1]) ?? []) {
      if (!seen.has(item)) { seen.add(item); items.push(item); }
    }
  }
  return items;
}

// Parse "DD/MM/YYYY HH:MM" → "YYYY-MM-DD"
function parseTracDate(text: string | null): string | null {
  if (!text) return null;
  const m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function parseDetailPage(html: string): DetailData {
  const closingRaw = extractDt(html, "Closing");
  const contractRaw = extractDt(html, "Contract");
  const gradeRaw = extractDt(html, "Grade");
  const townRaw = extractDt(html, "Town");
  const salaryRaw = extractDt(html, "Salary");
  const employerRaw = extractDt(html, "Employer");

  // Description: extract from healthjobsuk.com's stable section IDs, then
  // strip the decorative heading line from the top of each section and join.
  const HEADING_PREFIX = /^(?:Job overview|Main duties of the job|Detailed job description[^\n]*|Working for our organisation)\s*/i;
  const sections = [
    extractDivById(html, "hj-job-advert-overview"),
    extractDivById(html, "hj-job-advert-description"),
    extractDivById(html, "hj-job-description"),
    extractDivById(html, "hj-job-advert-organisation"),
  ]
    .filter((s): s is string => s !== null)
    .map((s) => s.replace(HEADING_PREFIX, "").trim())
    .filter((s) => s.length >= 30);
  const description = sections.length > 0 ? sections.join("\n\n") : null;

  // Person specification: the hj-job-role-requirement section holds all categories.
  // Each category has <h5>Essential criteria</h5> / <h5>Desirable criteria</h5>
  // followed immediately by a <ul>. Collect all items across every category.
  // Must operate on raw HTML (not text) so the <h5>/<ul> tags are present.
  const personSpecHtml = extractRawDivById(html, "hj-job-role-requirement") ?? html;
  const essentialItems = extractCriteriaByHeading(personSpecHtml, "Essential criteria");
  const desirableItems = extractCriteriaByHeading(personSpecHtml, "Desirable criteria");

  return {
    closingDate: parseTracDate(closingRaw),
    contractType: mapContractType(contractRaw),
    grade: normaliseGrade(gradeRaw),
    location: townRaw,
    salaryText: salaryRaw,
    trustName: employerRaw,
    description,
    requirements: essentialItems.length > 0 ? essentialItems : null,
    benefits: desirableItems.length > 0 ? desirableItems : null,
  };
}

// Normalise grade strings from detail page to our standard values
function normaliseGrade(raw: string | null): string | null {
  if (!raw) return null;
  const t = raw.toLowerCase();
  if (/\bfy1\b/.test(t)) return "FY1";
  if (/\bfy2\b/.test(t)) return "FY2";
  if (/\bct1\b/.test(t)) return "CT1";
  if (/\bct2\b/.test(t)) return "CT2";
  if (/\bst[3-9]\b/.test(t)) {
    const m = t.match(/st([3-9])/);
    const n = m ? parseInt(m[1]) : 6;
    return n <= 6 ? `ST${n}` : "ST6";
  }
  if (/consultant/.test(t)) return "Consultant";
  if (/associate specialist|staff grade|specialty doctor|trust grade|sas/.test(t)) return "SAS";
  if (/senior clinical fellow/.test(t)) return "Senior Clinical Fellow";
  if (/clinical fellow/.test(t)) return "Junior Clinical Fellow";
  return null;
}

// --- Data transformation ---

function parseSalary(text: string | null): { min: number | null; max: number | null } {
  if (!text) return { min: null, max: null };
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
  if (/\bfy1\b|foundation year 1|foundation doctor 1|resident doctor year 1/.test(t)) return "FY1";
  if (/\bfy2\b|foundation year 2|foundation doctor 2|resident doctor year 2/.test(t)) return "FY2";
  if (/\bct1\b|core trainee 1/.test(t)) return "CT1";
  if (/\bct2\b|core trainee 2/.test(t)) return "CT2";
  if (/\bst3\b/.test(t)) return "ST3";
  if (/\bst4\b/.test(t)) return "ST4";
  if (/\bst5\b/.test(t)) return "ST5";
  if (/\bst6\b/.test(t)) return "ST6";
  if (/\bst[78]\b/.test(t)) return "ST6";
  if (/\bsas\b|associate specialist|staff grade|specialty doctor|trust grade doctor/.test(t)) return "SAS";
  if (/\bconsultant\b/.test(t)) return "Consultant";
  return null;
}

function isDoctorRole(title: string): boolean {
  const t = title.toLowerCase();
  return (
    /\bconsultant\b/.test(t) ||
    /\bregistrar\b/.test(t) ||
    /\bfy[12]\b|foundation year [12]|foundation doctor|foundation programme doctor/.test(t) ||
    /\bresident doctor\b/.test(t) ||
    /\bjunior doctor\b/.test(t) ||
    /\bct[12]\b|core trainee|core surgical trainee|core medical trainee|core training\b/.test(t) ||
    /\bst[3-9]\b|specialty trainee|specialty registrar/.test(t) ||
    /\bimt\b|internal medicine trainee/.test(t) ||
    /\bassociate specialist\b/.test(t) ||
    /\bstaff grade\b/.test(t) ||
    /\bspecialty doctor\b/.test(t) ||
    /\bsas doctor\b/.test(t) ||
    /\btrust grade\b/.test(t) ||
    /\blocum\b/.test(t) ||
    /\bsenior house officer\b|\bsho\b/.test(t) ||
    /\bhouse officer\b/.test(t) ||
    /\bgp\b|\bgpst\b|\bgeneral practitioner\b/.test(t) ||
    /\bmedical officer\b/.test(t) ||
    /\bclinical fellow\b/.test(t) ||
    /\bmedical fellow\b/.test(t) ||
    /\bphysician\b/.test(t)
  );
}

const SPECIALTIES: [RegExp, string][] = [
  // More specific patterns first to avoid false matches
  [/neurosurg/i, "Neurosurgery"],
  [/vascular surg/i, "Vascular Surgery"],
  [/plastic surg/i, "Plastic Surgery"],
  [/general surg/i, "General Surgery"],
  [/critical care|intensive care|\bicu\b|\bitu\b/i, "Critical Care"],
  [/acute (internal )?med|\baim\b|acute med/i, "Acute Medicine"],
  [/anaesth/i, "Anaesthetics"],
  [/cardiol/i, "Cardiology"],
  [/dermatol/i, "Dermatology"],
  [/emergency|a&e|\baem\b/i, "Emergency Medicine"],
  [/gastroenterol|gastro(?!intestinal surg)/i, "Gastroenterology"],
  [/general pract|\bgp\b/i, "General Practice"],
  [/gynaecol|gynecol|obstet|\bo&g\b|\bo &g\b/i, "Obstetrics & Gynaecology"],
  [/haematol|hematol/i, "Haematology"],
  [/neurolog/i, "Neurology"],
  [/orthopaed|\bt\s*&\s*o\b|\bt&o\b/i, "Orthopaedics"],
  [/paediatr|pediatr/i, "Paediatrics"],
  [/psych/i, "Psychiatry"],
  [/radiol/i, "Radiology"],
  [/urolog/i, "Urology"],
];

function inferSpecialty(title: string): string | null {
  for (const [re, name] of SPECIALTIES) {
    if (re.test(title)) return name;
  }
  return null;
}

// --- DB helpers ---

async function resolveTrusts(names: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(names)];
  const nameToId = new Map<string, string>();

  const { data: existing } = await supabase
    .from("trusts")
    .select("id, name")
    .in("name", unique);

  for (const row of existing ?? []) nameToId.set(row.name, row.id);

  const missing = unique.filter((n) => !nameToId.has(n));
  if (missing.length > 0) {
    const { data: created } = await supabase
      .from("trusts")
      .upsert(
        missing.map((name) => ({ name })),
        { onConflict: "name", ignoreDuplicates: false },
      )
      .select("id, name");

    for (const row of created ?? []) nameToId.set(row.name, row.id);
  }

  return nameToId;
}

// --- Fetch helpers ---

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; MedRoles/1.0; +https://medroles.co.uk)",
  Accept: "text/html",
};

async function fetchPage(page: number): Promise<string> {
  const url = `${BASE_URL}${LIST_PATH}?_pg=${page}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Trac Jobs page ${page} returned ${res.status}`);
  return res.text();
}

async function fetchDetail(url: string): Promise<DetailData | null> {
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    const html = await res.text();
    return parseDetailPage(html);
  } catch {
    return null;
  }
}

// Run promises in batches of `size` concurrently
async function batchMap<T, R>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    results.push(...await Promise.all(batch.map(fn)));
  }
  return results;
}

// --- Main ---

Deno.serve(async () => {
  const stats = { upserted: 0, deleted: 0, errors: 0 };

  try {
    const firstHtml = await fetchPage(1);
    const totalPages = parseTotalPages(firstHtml);
    const allParsed: ParsedJob[] = parseJobCards(firstHtml);

    for (let page = 2; page <= totalPages; page++) {
      await new Promise((r) => setTimeout(r, LIST_DELAY_MS));
      try {
        const html = await fetchPage(page);
        const cards = parseJobCards(html);
        if (cards.length === 0) break;
        allParsed.push(...cards);
      } catch (e) {
        stats.errors++;
        console.error(`page ${page} fetch error:`, e);
      }
    }

    // Deduplicate by vacancyId
    const seen = new Set<string>();
    const unique = allParsed.filter((j) => {
      if (seen.has(j.vacancyId)) return false;
      seen.add(j.vacancyId);
      return true;
    });

    if (unique.length === 0) {
      return new Response(
        JSON.stringify({ ...stats, warning: "No jobs parsed from HTML" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Filter to doctor/dentist roles only
    const doctorJobs = unique.filter((j) => isDoctorRole(j.title));

    // Skip detail fetches for jobs already enriched in DB — same optimisation as scrape-jobs.
    // Unenriched jobs (no requirements) come first; already-enriched ones fill the remainder.
    const { data: alreadyEnriched } = await supabase
      .from("job_listings")
      .select("external_url")
      .eq("source", "Trac Jobs")
      .not("requirements", "is", null);
    const enrichedUrls = new Set((alreadyEnriched ?? []).map((r: { external_url: string }) => r.external_url));

    const toEnrich = [
      ...doctorJobs.filter((j) => !enrichedUrls.has(j.externalUrl)),
      ...doctorJobs.filter((j) => enrichedUrls.has(j.externalUrl)),
    ].slice(0, MAX_DETAIL_FETCHES);

    // Fetch detail pages only for the capped set; null-fill the rest
    const detailMap = new Map<string, DetailData | null>();
    const fetched = await batchMap(toEnrich, DETAIL_CONCURRENCY, (job) => fetchDetail(job.externalUrl));
    for (let i = 0; i < toEnrich.length; i++) detailMap.set(toEnrich[i].externalUrl, fetched[i]);

    const details = doctorJobs.map((j) => detailMap.get(j.externalUrl) ?? null);

    // Resolve trusts (prefer detail page employer name as it's canonical)
    const trustNames = doctorJobs.map((job, i) =>
      details[i]?.trustName ?? job.trustName
    );
    const trustMap = await resolveTrusts(trustNames);

    // Build upsert rows
    const rows = doctorJobs.map((job, i) => {
      const detail = details[i];
      const trustName = detail?.trustName ?? job.trustName;
      const salaryText = detail?.salaryText ?? job.salaryText;
      const { min, max } = parseSalary(salaryText);
      return {
        title: job.title,
        trust_id: trustMap.get(trustName) ?? null,
        region: (detail?.location ?? job.location)?.replace(/<[^>]+>/g, "").trim() || null,
        grade: detail?.grade ?? inferGrade(job.title),
        specialty: inferSpecialty(job.title),
        contract_type: detail?.contractType ?? null,
        salary_min: min,
        salary_max: max,
        closes_at: detail?.closingDate ?? null,
        description: detail?.description ?? null,
        requirements: detail?.requirements ?? null,
        benefits: detail?.benefits ?? null,
        posted_at: null,
        external_url: job.externalUrl,
        source: "Trac Jobs",
        category: "Medical and Dental",
        pay_band: null,
        on_call: null,
        training_post: null,
        is_active: true,
        cesr_support: false,
      };
    });

    const { error: upsertError } = await supabase
      .from("job_listings")
      .upsert(rows, { onConflict: "external_url", ignoreDuplicates: false });

    if (upsertError) {
      stats.errors++;
      console.error("batch upsert error:", upsertError.message);
    } else {
      stats.upserted = rows.length;

      // Delete Trac Jobs listings no longer on the site
      const liveUrls = rows.map((r) => r.external_url);
      const { count } = await supabase
        .from("job_listings")
        .delete({ count: "exact" })
        .eq("source", "Trac Jobs")
        .not("external_url", "in", `(${liveUrls.map((u) => `"${u}"`).join(",")})`);

      stats.deleted = count ?? 0;
    }
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
