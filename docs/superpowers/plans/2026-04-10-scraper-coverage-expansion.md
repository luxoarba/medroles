# Scraper Coverage Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand doctor job coverage from ~300 to ~3,000–5,000 listings by switching NHS Jobs to its XML API and removing the Trac Jobs page cap.

**Architecture:** Two independent Supabase Edge Function rewrites. `scrape-jobs` is replaced wholesale to use the public NHS Jobs XML API with 12 parallel keyword queries and deduplication by vacancy ID. `scrape-trac` gets a one-line constant change and a `parseTotalPages` update.

**Tech Stack:** Deno, Supabase Edge Functions, `@supabase/supabase-js@2`, NHS Jobs XML API (`jobs.nhs.uk/api/v1/search_xml`), HealthJobsUK HTML scraping.

---

## Files

| File | Change |
|---|---|
| `supabase/functions/scrape-jobs/index.ts` | Full rewrite — replace HTML scraping with XML API |
| `supabase/functions/scrape-trac/index.ts` | Small change — replace `MAX_PAGES` constant with `SAFETY_PAGE_CAP = 500`, update `parseTotalPages` |

---

## Task 1: Remove Trac Jobs page cap

**Files:**
- Modify: `supabase/functions/scrape-trac/index.ts`

- [ ] **Step 1: Replace the `MAX_PAGES` constant**

  In `supabase/functions/scrape-trac/index.ts`, replace line 10:

  ```typescript
  // Before
  const MAX_PAGES = 30; // 1500 raw jobs → ~100–300 doctor roles per run
  ```

  ```typescript
  // After
  const SAFETY_PAGE_CAP = 500; // hard guard against malformed pagination responses
  ```

- [ ] **Step 2: Update `parseTotalPages` to use the new constant**

  Replace the entire `parseTotalPages` function:

  ```typescript
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
  ```

- [ ] **Step 3: Verify no remaining references to `MAX_PAGES`**

  Run:
  ```bash
  grep -n "MAX_PAGES" supabase/functions/scrape-trac/index.ts
  ```
  Expected: no output.

- [ ] **Step 4: Commit**

  ```bash
  git add supabase/functions/scrape-trac/index.ts
  git commit -m "feat(scrape-trac): remove page cap — follow all pages dynamically up to safety ceiling of 500"
  ```

---

## Task 2: Rewrite `scrape-jobs` to use NHS Jobs XML API

**Files:**
- Modify: `supabase/functions/scrape-jobs/index.ts`

- [ ] **Step 1: Replace the entire file contents**

  Overwrite `supabase/functions/scrape-jobs/index.ts` with:

  ```typescript
  import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const XML_API = "https://www.jobs.nhs.uk/api/v1/search_xml";
  const SAFETY_PAGE_CAP = 500;
  const PAGE_BATCH_SIZE = 10;
  const DELAY_MS = 100;

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
    return m
      ? m[1]
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&apos;/g, "'")
          .replace(/&quot;/g, '"')
          .trim()
      : null;
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

      // Location format: "City, Postcode" — take city portion
      const locationRaw =
        el.match(/<location[^>]*>([\s\S]*?)<\/location>/)?.[1]?.trim() ?? null;
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
    Accept: "application/xml,text/xml",
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
      /\bphysician\b/.test(t) ||
      /\bdentist\b|\bdental surgeon\b|\bdental officer\b|\bdental practitioner\b/.test(t)
    );
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

  // --- Main ---

  Deno.serve(async () => {
    const stats = {
      upserted: 0,
      deleted: 0,
      errors: 0,
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

      // Resolve trusts
      const trustMap = await resolveTrusts(doctorJobs.map((j) => j.employer));

      // Build upsert rows
      const rows = doctorJobs.map((job) => {
        const { min, max } = parseSalary(job.salary);
        return {
          title: job.title,
          trust_id: trustMap.get(job.employer) ?? null,
          region: job.location,
          grade: inferGrade(job.title),
          specialty: inferSpecialty(job.title),
          contract_type: mapContractType(job.type),
          salary_min: min,
          salary_max: max,
          closes_at: job.closeDate,
          posted_at: job.postDate,
          description: job.description,
          requirements: null,
          benefits: null,
          external_url: job.url,
          source: "NHS Jobs",
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
  ```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

  Run (from the repo root):
  ```bash
  deno check supabase/functions/scrape-jobs/index.ts
  ```
  Expected: no errors or warnings. If `deno` is not on PATH, skip — the Supabase deploy step will catch type errors.

- [ ] **Step 3: Commit**

  ```bash
  git add supabase/functions/scrape-jobs/index.ts
  git commit -m "feat(scrape-jobs): rewrite to NHS Jobs XML API — multi-keyword parallel strategy, descriptions built-in, dynamic page count"
  ```

---

## Task 3: Deploy and verify

- [ ] **Step 1: Deploy both functions to Supabase**

  ```bash
  npx supabase functions deploy scrape-trac
  npx supabase functions deploy scrape-jobs
  ```

  Expected: both deployments succeed with no errors.

- [ ] **Step 2: Trigger scrape-trac and check result**

  In the Supabase dashboard → Edge Functions → `scrape-trac` → Invoke, or via the app's `/api/scrape` endpoint. Check the response JSON:

  ```json
  { "upserted": <number>, "deleted": <number>, "errors": 0 }
  ```

  `upserted` should now be significantly higher than the previous ~100–300. No `errors`.

- [ ] **Step 3: Trigger scrape-jobs and check result**

  Invoke `scrape-jobs`. Check the response JSON:

  ```json
  {
    "upserted": <number>,
    "deleted": <number>,
    "errors": 0,
    "keywords": {
      "consultant": <number>,
      "registrar": <number>,
      ...
    }
  }
  ```

  `upserted` should be in the range 2,000–5,000. `errors` should be 0. The `keywords` map shows raw hits per keyword before deduplication — useful for debugging.

- [ ] **Step 4: Spot-check the database**

  In Supabase Table Editor, query `job_listings`:

  ```sql
  select source, count(*) from job_listings group by source;
  ```

  Expected: `NHS Jobs` row shows thousands of rows. `Trac Jobs` row shows more than before.

  Also confirm descriptions are populated:
  ```sql
  select count(*) from job_listings
  where source = 'NHS Jobs' and description is not null;
  ```

  Expected: count matches or is close to the upserted total (descriptions come from the XML directly).

- [ ] **Step 5: Commit verification note**

  No code change — just confirm deploy is live. No commit needed.
