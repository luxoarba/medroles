import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const XML_API = "https://www.jobs.nhs.uk/api/v1/search_xml";
const SAFETY_PAGE_CAP = 500;
const PAGE_BATCH_SIZE = 10;
const DELAY_MS = 100;
const DETAIL_BATCH_SIZE = 10;
const DETAIL_DELAY_MS = 250;
const MAX_DETAIL_FETCHES = 600; // per run — prioritises jobs not yet enriched

const DOCTOR_KEYWORDS = [
  "consultant",
  "registrar",
  "resident doctor",
  "foundation doctor",
  "clinical fellow",
  "core trainee",
  "specialty trainee",
  "trust grade",
  "associate specialist",
  "specialty doctor",
  "GP registrar",
  "SHO",
];

interface ParsedJob {
  id: string;
  title: string;
  employer: string;
  description: string | null;
  requirements: string[] | null;
  benefits: string[] | null;
  type: string | null;
  salary: string | null;
  closeDate: string | null;
  postDate: string | null;
  url: string;
  location: string | null;
}

// --- XML parsing ---

function getTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!m) return null;
  let val = m[1];
  // Strip CDATA wrapper if present
  const cdata = val.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdata) val = cdata[1];
  return val
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .trim();
}

function parseXmlPage(xml: string): { jobs: ParsedJob[]; totalPages: number } {
  const totalPagesMatch = xml.match(/<totalPages>(\d+)<\/totalPages>/);
  const totalPages = Math.min(
    parseInt(totalPagesMatch?.[1] ?? "1", 10),
    SAFETY_PAGE_CAP,
  );

  const jobs: ParsedJob[] = [];
  const vacancyRegex = /<vacancyDetails>([\s\S]*?)<\/vacancyDetails>/g;
  let match: RegExpExecArray | null;

  while ((match = vacancyRegex.exec(xml)) !== null) {
    const el = match[1];
    const id = getTag(el, "id");
    const url = getTag(el, "url");
    if (!id || !url) continue;

    // Location format: "City, Postcode" — take city portion.
    // Strip CDATA blocks first to avoid matching <location> text that appears
    // as literal HTML inside a description or other CDATA-wrapped field.
    const elStripped = el.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "");
    const locationRaw =
      elStripped.match(/<location[^>]*>([\s\S]*?)<\/location>/)?.[1]?.trim() ?? null;
    const location = locationRaw
      ? locationRaw.split(",")[0].trim() || null
      : null;

    const postDateRaw = getTag(el, "postDate");

    // Description may contain HTML markup — strip tags to plain text
    const rawDesc = getTag(el, "description");
    const description = rawDesc
      ? rawDesc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || null
      : null;

    jobs.push({
      id,
      title: getTag(el, "title") ?? "",
      employer: getTag(el, "employer") ?? "NHS Trust",
      description,
      requirements: null,
      benefits: null,
      type: getTag(el, "type"),
      salary: getTag(el, "salary"),
      closeDate: getTag(el, "closeDate"),
      postDate: postDateRaw ? postDateRaw.slice(0, 10) : null,
      url,
      location,
    });
  }

  return { jobs, totalPages };
}

// --- Fetch ---

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; MedRoles/1.0; +https://medroles.co.uk)",
  Accept: "application/xml,text/xml,text/html",
};

async function fetchXmlPage(keyword: string, page: number): Promise<string> {
  const url = new URL(XML_API);
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("page", String(page));
  const res = await fetch(url.toString(), { headers: HEADERS });
  if (!res.ok) {
    throw new Error(
      `NHS Jobs XML keyword="${keyword}" page=${page} → ${res.status}`,
    );
  }
  return res.text();
}

async function fetchAllForKeyword(keyword: string): Promise<ParsedJob[]> {
  const firstXml = await fetchXmlPage(keyword, 1);
  const { jobs: firstJobs, totalPages } = parseXmlPage(firstXml);
  const allJobs = [...firstJobs];

  for (let i = 2; i <= totalPages; i += PAGE_BATCH_SIZE) {
    await new Promise((r) => setTimeout(r, DELAY_MS));
    const batch = Array.from(
      { length: Math.min(PAGE_BATCH_SIZE, totalPages - i + 1) },
      (_, j) => i + j,
    );
    const results = await Promise.all(
      batch.map(async (page) => {
        try {
          return parseXmlPage(await fetchXmlPage(keyword, page)).jobs;
        } catch (e) {
          console.error(`keyword "${keyword}" page ${page} error:`, e);
          return [];
        }
      }),
    );
    for (const r of results) allJobs.push(...r);
  }

  return allJobs;
}

// --- Vacancy detail page scraping ---
// The NHS Jobs XML search API only returns a brief "Job overview" snippet.
// The full description, main duties, person spec and salary live on the HTML page.
// The page uses stable element IDs we can reliably target.

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

function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|li|div|h[1-6]|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extract text content of a <p id="..."> element.
 * These elements often contain nested <p> tags so we grab everything
 * from the opening tag until the next sibling <h3> or section boundary.
 */
function extractById(html: string, id: string): string | null {
  const idx = html.indexOf(`id="${id}"`);
  if (idx < 0) return null;
  const tagEnd = html.indexOf(">", idx) + 1;
  // Grab up to the next block-level sibling (h3, details, div.hide-mobile end, etc.)
  const chunk = html.slice(tagEnd, tagEnd + 8000);
  const endMatch = chunk.search(/<(?:h[23]|details|\/div)[^>]*>/i);
  const content = endMatch >= 0 ? chunk.slice(0, endMatch) : chunk;
  const text = htmlToText(content);
  return text.length > 10 ? text : null;
}

/**
 * Extract all <li id="essential_skill_*"> or <li id="desirable_skill_*"> items.
 * The page renders both a desktop and mobile copy, so deduplicate by text.
 */
function extractCriteriaById(html: string, prefix: "essential" | "desirable"): string[] {
  const seen = new Set<string>();
  // Criteria <li> elements contain plain text — use [^<]* to avoid backslash/template-literal issues
  const re = new RegExp(
    `<li[^>]+id="${prefix}_skill_[^"]*"[^>]*>([^<]*)`,
    "gi",
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = decodeEntities(m[1]).replace(/\s+/g, " ").trim();
    if (text.length > 3) seen.add(text);
  }
  return [...seen];
}

async function fetchVacancyDetail(job: ParsedJob): Promise<void> {
  try {
    // job.url is the canonical URL e.g. https://beta.jobs.nhs.uk/candidate/jobadvert/C9411-26-0065
    const res = await fetch(job.url, {
      headers: { ...HEADERS, Accept: "text/html,application/xhtml+xml" },
    });
    if (!res.ok) return;
    const html = await res.text();

    // Build description: overview + main duties + about the organisation
    const overview = extractById(html, "job_overview");
    const mainDuties = extractById(html, "job_description");
    const aboutOrg = extractById(html, "about_organisation");

    const parts = [overview, mainDuties, aboutOrg].filter(Boolean) as string[];
    if (parts.length > 0) {
      job.description = parts.join("\n\n");
    }

    // Essential criteria → requirements
    const essential = extractCriteriaById(html, "essential");
    if (essential.length > 0) job.requirements = essential;

    // Desirable criteria → benefits (repurposing the benefits column)
    const desirable = extractCriteriaById(html, "desirable");
    if (desirable.length > 0) job.benefits = desirable;

    // Salary from page if XML didn't have it
    if (!job.salary) {
      const salaryText = extractById(html, "fixed_salary");
      if (salaryText) job.salary = salaryText;
    }
  } catch (e) {
    console.error(`detail fetch failed for ${job.url}:`, e);
  }
}

// --- Data transformation ---

function parseSalary(
  text: string | null,
): { min: number | null; max: number | null } {
  if (!text) return { min: null, max: null };
  if (/an hour|per hour/i.test(text)) return { min: null, max: null };
  const nums = [...text.matchAll(/£([\d,]+(?:\.\d+)?)/g)].map((m) =>
    Math.round(parseFloat(m[1].replace(/,/g, "")))
  );
  if (nums.length === 0) return { min: null, max: null };
  return { min: nums[0], max: nums[1] ?? nums[0] };
}

function mapContractType(text: string | null): string | null {
  if (!text) return null;
  const t = text.toLowerCase();
  if (t.includes("permanent")) return "Permanent";
  if (t.includes("fixed")) return "Fixed Term";
  if (t.includes("locum") || t.includes("bank")) return "Locum";
  if (/\bpart[\s-]?time\b/.test(t)) return "Part-time";
  return null;
}

function inferGrade(title: string): string | null {
  const t = title.toLowerCase();
  if (
    /\bfy1\b|foundation year 1|foundation doctor 1|resident doctor year 1/.test(t)
  ) return "FY1";
  if (
    /\bfy2\b|foundation year 2|foundation doctor 2|resident doctor year 2/.test(t)
  ) return "FY2";
  if (
    /\bct1\b|core trainee 1|core surgical trainee 1|core medical trainee 1/.test(
      t,
    )
  ) return "CT1";
  if (
    /\bct2\b|core trainee 2|core surgical trainee 2|core medical trainee 2/.test(
      t,
    )
  ) return "CT2";
  if (/\bst3\b|specialty registrar.{0,6}st3/.test(t)) return "ST3";
  if (/\bst4\b|specialty registrar.{0,6}st4/.test(t)) return "ST4";
  if (/\bst5\b|specialty registrar.{0,6}st5/.test(t)) return "ST5";
  if (/\bst6\b|specialty registrar.{0,6}st6/.test(t)) return "ST6";
  if (/\bst[78]\b/.test(t)) return "ST6";
  if (
    /\bsas\b|associate specialist|staff grade|specialty doctor|specialty grade doctor|trust grade doctor/.test(
      t,
    )
  ) return "SAS";
  if (/\bconsultant\b/.test(t)) return "Consultant";
  if (/senior clinical fellow/.test(t)) return "Senior Clinical Fellow";
  if (/\bclinical fellow\b/.test(t)) return "Junior Clinical Fellow";
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

function inferTrainingPost(grade: string | null): boolean | null {
  if (!grade) return null;
  if (/^(FY1|FY2|CT1|CT2|ST[3-9])$/.test(grade)) return true;
  if (/^(SAS|Consultant)$/.test(grade)) return false;
  return null;
}

function inferTrustType(name: string): string | null {
  const n = name.toLowerCase();
  if (/mental health/.test(n)) return "Mental Health";
  if (/community/.test(n)) return "Community";
  if (/university|teaching|academic/.test(n)) return "Teaching";
  if (/foundation/.test(n)) return "Foundation";
  return "Acute";
}

// --- DB helpers ---

async function resolveTrusts(
  names: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(names)];
  const nameToId = new Map<string, string>();

  const { data: existing } = await supabase
    .from("trusts")
    .select("id, name, type")
    .in("name", unique);

  const needsTypeUpdate: { id: string; type: string }[] = [];

  for (const row of existing ?? []) {
    nameToId.set(row.name, row.id);
    // Backfill type for existing trusts that don't have one
    if (!row.type) {
      const inferred = inferTrustType(row.name);
      if (inferred) needsTypeUpdate.push({ id: row.id, type: inferred });
    }
  }

  // Backfill types in background (best-effort, no await needed for main flow)
  for (const { id, type } of needsTypeUpdate) {
    supabase.from("trusts").update({ type }).eq("id", id).then(() => {});
  }

  const missing = unique.filter((n) => !nameToId.has(n));
  if (missing.length > 0) {
    const { data: created } = await supabase
      .from("trusts")
      .upsert(
        missing.map((name) => ({ name, type: inferTrustType(name) })),
        { onConflict: "name", ignoreDuplicates: false },
      )
      .select("id, name");
    for (const row of created ?? []) nameToId.set(row.name, row.id);
  }

  return nameToId;
}

// --- Main ---

Deno.serve(async () => {
  const stats = {
    upserted: 0,
    deleted: 0,
    errors: 0,
    enriched: 0,
    keywords: {} as Record<string, number>,
  };

  try {
    // Run all keyword chains in parallel
    const keywordResults = await Promise.all(
      DOCTOR_KEYWORDS.map(async (kw) => {
        try {
          const jobs = await fetchAllForKeyword(kw);
          stats.keywords[kw] = jobs.length;
          return jobs;
        } catch (e) {
          stats.errors++;
          console.error(`keyword "${kw}" failed:`, e);
          return [];
        }
      }),
    );

    // Flatten and deduplicate by vacancy id
    const seen = new Set<string>();
    const allJobs: ParsedJob[] = [];
    for (const jobs of keywordResults) {
      for (const job of jobs) {
        if (!seen.has(job.id)) {
          seen.add(job.id);
          allJobs.push(job);
        }
      }
    }

    // Filter to doctor/dentist roles
    const doctorJobs = allJobs.filter((j) => isDoctorRole(j.title));

    if (doctorJobs.length === 0) {
      return new Response(
        JSON.stringify({ ...stats, warning: "No doctor jobs found" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Enrich by fetching the full NHS Jobs vacancy page.
    // The XML never contains requirements/desirable criteria — those only exist on the HTML page.
    // Prioritise jobs not yet enriched in DB; skip ones that already have requirements.
    const { data: alreadyEnriched } = await supabase
      .from("job_listings")
      .select("external_url")
      .eq("source", "NHS Jobs")
      .not("requirements", "is", null);
    const enrichedUrls = new Set(
      (alreadyEnriched ?? []).map((r) => r.external_url),
    );

    // Jobs missing requirements come first; already-enriched ones at end as fallback
    const toEnrich = [
      ...doctorJobs.filter((j) => !enrichedUrls.has(j.url)),
      ...doctorJobs.filter((j) => enrichedUrls.has(j.url)),
    ].slice(0, MAX_DETAIL_FETCHES);

    for (let i = 0; i < toEnrich.length; i += DETAIL_BATCH_SIZE) {
      await new Promise((r) => setTimeout(r, DETAIL_DELAY_MS));
      await Promise.all(
        toEnrich.slice(i, i + DETAIL_BATCH_SIZE).map(fetchVacancyDetail),
      );
    }
    stats.enriched = toEnrich.length;

    // Resolve trusts (creates any missing ones with inferred type)
    const trustMap = await resolveTrusts(doctorJobs.map((j) => j.employer));

    // Phase 1: upsert basic listing data for ALL jobs.
    // description/requirements/benefits are intentionally excluded so that
    // previously enriched content is never overwritten by a null value when
    // a job falls outside the per-run enrichment cap.
    const basicRows = doctorJobs.map((job) => {
      const { min, max } = parseSalary(job.salary);
      const grade = inferGrade(job.title);
      return {
        title: job.title,
        trust_id: trustMap.get(job.employer) ?? null,
        region: job.location?.replace(/<[^>]+>/g, "").trim() || null,
        grade,
        specialty: inferSpecialty(job.title),
        contract_type: mapContractType(job.type),
        salary_min: min,
        salary_max: max,
        closes_at: job.closeDate,
        posted_at: job.postDate,
        external_url: job.url,
        source: "NHS Jobs",
        category: "Medical and Dental",
        pay_band: null,
        on_call: null,
        training_post: inferTrainingPost(grade),
        is_active: true,
        cesr_support: false,
      };
    });

    const { error: upsertError } = await supabase
      .from("job_listings")
      .upsert(basicRows, { onConflict: "external_url", ignoreDuplicates: false });

    if (upsertError) {
      stats.errors++;
      console.error("batch upsert error:", upsertError.message);
    } else {
      stats.upserted = basicRows.length;
    }

    // Phase 2: write enriched content only for jobs that succeeded in this run.
    const enrichedJobs = toEnrich.filter(
      (j) => j.requirements !== null || j.benefits !== null || j.description !== null,
    );
    if (enrichedJobs.length > 0) {
      const enrichedRows = enrichedJobs.map((job) => {
        const { min, max } = parseSalary(job.salary);
        const grade = inferGrade(job.title);
        return {
          title: job.title,
          trust_id: trustMap.get(job.employer) ?? null,
          region: job.location?.replace(/<[^>]+>/g, "").trim() || null,
          grade,
          specialty: inferSpecialty(job.title),
          contract_type: mapContractType(job.type),
          salary_min: min,
          salary_max: max,
          closes_at: job.closeDate,
          posted_at: job.postDate,
          description: job.description,
          requirements: job.requirements,
          benefits: job.benefits,
          external_url: job.url,
          source: "NHS Jobs",
          category: "Medical and Dental",
          pay_band: null,
          on_call: null,
          training_post: inferTrainingPost(grade),
          is_active: true,
          cesr_support: false,
        };
      });

      const { error: enrichError } = await supabase
        .from("job_listings")
        .upsert(enrichedRows, { onConflict: "external_url", ignoreDuplicates: false });

      if (enrichError) {
        stats.errors++;
        console.error("enriched upsert error:", enrichError.message);
      } else {
        stats.enriched = enrichedRows.length;
      }
    }

    // Delete expired NHS Jobs listings
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 1);
    const { count } = await supabase
      .from("job_listings")
      .delete({ count: "exact" })
      .eq("source", "NHS Jobs")
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
