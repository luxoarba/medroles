import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const NHS_JOBS_URL = "https://www.jobs.nhs.uk/api/v1/search_jobs";
const PAGE_SIZE = 20;
const DELAY_MS = 200;

interface NHSJob {
  vacancyTitle?: string;
  title?: string;
  employerName?: string;
  organisationName?: string;
  location?: string;
  locationName?: string;
  salaryFrom?: number;
  salaryTo?: number;
  closingDate?: string;
  expiryDate?: string;
  publishedDate?: string;
  datePosted?: string;
  vacancyId?: string;
  id?: string;
  jobUrl?: string;
  contractType?: string;
  contractTypeName?: string;
}

interface NHSJobsResponse {
  jobs?: NHSJob[];
  vacancies?: NHSJob[];
  results?: NHSJob[];
  totalJobs?: number;
  totalCount?: number;
  count?: number;
  total?: number;
}

function getJobs(res: NHSJobsResponse): NHSJob[] {
  return res.jobs ?? res.vacancies ?? res.results ?? [];
}

// `count` is third — it may mean "results on this page" on some API versions,
// so prefer totalJobs/totalCount first.
function getTotal(res: NHSJobsResponse): number {
  return res.totalJobs ?? res.totalCount ?? res.count ?? res.total ?? 0;
}

function getTitle(job: NHSJob): string {
  return job.vacancyTitle ?? job.title ?? "Untitled role";
}

function getEmployer(job: NHSJob): string {
  return job.employerName ?? job.organisationName ?? "NHS Trust";
}

function getLocation(job: NHSJob): string | null {
  return job.location ?? job.locationName ?? null;
}

function getSalaryMin(job: NHSJob): number | null {
  return job.salaryFrom ?? null;
}

function getSalaryMax(job: NHSJob): number | null {
  return job.salaryTo ?? null;
}

function getClosingDate(job: NHSJob): string | null {
  return job.closingDate ?? job.expiryDate ?? null;
}

function getPostedDate(job: NHSJob): string | null {
  return job.publishedDate ?? job.datePosted ?? null;
}

function getExternalUrl(job: NHSJob): string | null {
  const id = job.vacancyId ?? job.id;
  if (id) return `https://www.jobs.nhs.uk/candidate/jobadvert/${id}`;
  return job.jobUrl ?? null;
}

function getContractType(job: NHSJob): string | null {
  const raw = (job.contractType ?? job.contractTypeName ?? "").toLowerCase();
  if (raw.includes("permanent")) return "Permanent";
  if (raw.includes("fixed")) return "Fixed Term";
  if (raw.includes("locum")) return "Locum";
  if (/\bpart[\s-]?time\b/.test(raw)) return "Part-time";
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

async function getOrCreateTrust(name: string): Promise<string | null> {
  const { data: created } = await supabase
    .from("trusts")
    .upsert({ name }, { onConflict: "name", ignoreDuplicates: false })
    .select("id")
    .single();

  return created?.id ?? null;
}

async function fetchPage(page: number): Promise<NHSJobsResponse> {
  const url = new URL(NHS_JOBS_URL);
  url.searchParams.set("keyword", "");
  url.searchParams.set("category", "medical-and-dental");
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(PAGE_SIZE));
  url.searchParams.set("orderBy", "closingDate");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "MedRoles/1.0 (medroles.co.uk)",
    },
  });

  if (!res.ok) throw new Error(`NHS Jobs API ${res.status}: ${await res.text()}`);
  return res.json();
}

Deno.serve(async () => {
  const stats = { upserted: 0, deleted: 0, errors: 0 };

  try {
    const first = await fetchPage(1);
    const total = getTotal(first);
    const totalPages = Math.min(Math.ceil(total / PAGE_SIZE), 500);
    const allJobs: NHSJob[] = [...getJobs(first)];

    for (let page = 2; page <= totalPages; page++) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
      const data = await fetchPage(page);
      allJobs.push(...getJobs(data));
    }

    for (const job of allJobs) {
      try {
        const externalUrl = getExternalUrl(job);
        if (!externalUrl) {
          stats.errors++;
          continue;
        }

        const title = getTitle(job);
        const trustId = await getOrCreateTrust(getEmployer(job));

        const { error } = await supabase.from("job_listings").upsert(
          {
            title,
            trust_id: trustId,
            region: getLocation(job),
            grade: inferGrade(title),
            specialty: inferSpecialty(title),
            contract_type: getContractType(job),
            salary_min: getSalaryMin(job),
            salary_max: getSalaryMax(job),
            closes_at: getClosingDate(job),
            posted_at: getPostedDate(job),
            external_url: externalUrl,
            source: "NHS Jobs",
            category: "Medical and Dental",
            pay_band: null,
            on_call: null,
            training_post: null,
          },
          { onConflict: "external_url", ignoreDuplicates: false },
        );

        if (error) {
          stats.errors++;
          console.error("upsert error:", error.message);
        } else {
          stats.upserted++;
        }
      } catch (e) {
        stats.errors++;
        console.error("job error:", e);
      }
    }

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
