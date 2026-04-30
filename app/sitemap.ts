import { MetadataRoute } from "next";
import { supabase } from "./lib/supabase";

const BASE = "https://www.medroles.co.uk";

export const SPECIALTY_SLUGS: Record<string, string> = {
  cardiology: "Cardiology",
  "emergency-medicine": "Emergency Medicine",
  "general-practice": "General Practice",
  psychiatry: "Psychiatry",
  radiology: "Radiology",
  anaesthetics: "Anaesthetics",
  "general-surgery": "General Surgery",
  orthopaedics: "Orthopaedics",
  paediatrics: "Paediatrics",
  neurology: "Neurology",
  haematology: "Haematology",
  gastroenterology: "Gastroenterology",
  "obstetrics-gynaecology": "Obstetrics & Gynaecology",
  urology: "Urology",
  dermatology: "Dermatology",
  "acute-medicine": "Acute Medicine",
  "critical-care": "Critical Care",
  neurosurgery: "Neurosurgery",
  "vascular-surgery": "Vascular Surgery",
  "plastic-surgery": "Plastic Surgery",
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: jobs } = await supabase
    .from("job_listings")
    .select("id, updated_at")
    .or(`closes_at.gte.${today},closes_at.is.null`);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/jobs`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/reviews`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/trusts`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/interview-intel`, changeFrequency: "weekly", priority: 0.6 },
  ];

  const specialtyPages: MetadataRoute.Sitemap = Object.keys(SPECIALTY_SLUGS).map(
    (slug) => ({
      url: `${BASE}/specialty/${slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }),
  );

  const jobPages: MetadataRoute.Sitemap = (jobs ?? []).map((job) => ({
    url: `${BASE}/jobs/${job.id}`,
    lastModified: job.updated_at ?? new Date().toISOString(),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...specialtyPages, ...jobPages];
}
