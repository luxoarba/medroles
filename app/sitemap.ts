import type { MetadataRoute } from "next";
import { supabase } from "./lib/supabase";

const BASE = "https://www.medroles.co.uk";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: jobs }, { data: trusts }] = await Promise.all([
    supabase
      .from("job_listings")
      .select("id, updated_at, closes_at")
      .gte("closes_at", new Date().toISOString().slice(0, 10))
      .order("updated_at", { ascending: false })
      .limit(5000),
    supabase
      .from("trusts")
      .select("id, name")
      .order("name", { ascending: true })
      .limit(1000),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/jobs`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/trusts`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/reviews`, changeFrequency: "daily", priority: 0.6 },
    { url: `${BASE}/interview-intel`, changeFrequency: "daily", priority: 0.6 },
  ];

  const jobRoutes: MetadataRoute.Sitemap = (jobs ?? []).map((j) => ({
    url: `${BASE}/jobs/${j.id}`,
    lastModified: j.updated_at ? new Date(j.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const trustRoutes: MetadataRoute.Sitemap = (trusts ?? []).map((t) => ({
    url: `${BASE}/trusts/${t.id}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...jobRoutes, ...trustRoutes];
}
