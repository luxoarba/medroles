import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type DBJobListing = {
  id: string;
  title: string;
  specialty: string | null;
  grade: string | null;
  contract_type: string | null;
  region: string | null;
  pay_band: string | null;
  salary_min: number | null;
  salary_max: number | null;
  on_call: boolean | null;
  training_post: boolean | null;
  closes_at: string | null;
  posted_at: string | null;
  source: string | null;
  external_url: string | null;
  trusts:
    | { name: string; avg_rating: number | null; review_count: number | null; type: string | null }
    | { name: string; avg_rating: number | null; review_count: number | null; type: string | null }[]
    | null;
  description: string | null;
  requirements: string[] | null;
  benefits: string[] | null;
};

export function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    "£" + n.toLocaleString("en-GB", { maximumFractionDigits: 0 });
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}
