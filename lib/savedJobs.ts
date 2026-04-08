import { supabase } from "@/app/lib/supabase";
import type { DBJobListing } from "@/app/lib/supabase";

export async function saveJob(jobId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error("Not authenticated") };
  return supabase.from("saved_jobs").insert({ job_id: jobId, user_id: user.id });
}

export async function unsaveJob(jobId: string) {
  return supabase.from("saved_jobs").delete().eq("job_id", jobId);
}

export async function isJobSaved(jobId: string): Promise<boolean> {
  const { data } = await supabase
    .from("saved_jobs")
    .select("id")
    .eq("job_id", jobId)
    .maybeSingle();
  return !!data;
}

export async function getSavedJobs(): Promise<DBJobListing[]> {
  const { data: savedRows } = await supabase
    .from("saved_jobs")
    .select("job_id");

  const jobIds = (savedRows ?? []).map((r: { job_id: string }) => r.job_id);
  if (jobIds.length === 0) return [];

  const { data } = await supabase
    .from("job_listings")
    .select(`
      id,
      title,
      specialty,
      grade,
      contract_type,
      region,
      pay_band,
      salary_min,
      salary_max,
      on_call,
      training_post,
      closes_at,
      posted_at,
      source,
      external_url,
      trusts (
        name,
        avg_rating,
        review_count,
        type
      )
    `)
    .in("id", jobIds);

  return (data ?? []) as unknown as DBJobListing[];
}
