import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const VALID_SPECIALTIES = new Set(["Acute Medicine","Anaesthetics","Cardiology","Critical Care","Dermatology","Emergency Medicine","ENT","Gastroenterology","General Practice","General Surgery","Geriatric Medicine","Haematology","Neurology","Neurosurgery","Obstetrics & Gynaecology","Orthopaedics","Paediatrics","Plastic Surgery","Psychiatry","Radiology","Urology","Vascular Surgery"]);
const VALID_GRADES = new Set(["FY1","FY2","CT1","CT2","ST3","ST4","ST5","ST6","Junior Clinical Fellow","Senior Clinical Fellow","SAS","Consultant"]);
const VALID_REGIONS = new Set(["London","North West","Northern","Yorkshire and the Humber","East Midlands","West Midlands","East of England","Thames Valley","Wessex","South West","Kent, Surrey and Sussex","Wales"]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { email, specialty, grade, region } = body as {
    email: string;
    specialty: string[] | null;
    grade: string[] | null;
    region: string[] | null;
  };

  if (!email || typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (specialty && (!Array.isArray(specialty) || specialty.some((s) => !VALID_SPECIALTIES.has(s)))) {
    return NextResponse.json({ error: "Invalid specialty value" }, { status: 400 });
  }
  if (grade && (!Array.isArray(grade) || grade.some((g) => !VALID_GRADES.has(g)))) {
    return NextResponse.json({ error: "Invalid grade value" }, { status: 400 });
  }
  if (region && (!Array.isArray(region) || region.some((r) => !VALID_REGIONS.has(r)))) {
    return NextResponse.json({ error: "Invalid region value" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("job_alerts").insert({
    email: email.toLowerCase().trim(),
    specialty: specialty?.length ? specialty : null,
    grade: grade?.length ? grade : null,
    region: region?.length ? region : null,
  });

  if (error) {
    console.error("job_alerts insert error:", error);
    return NextResponse.json({ error: "Failed to save alert" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
