import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM ?? "MedRoles <alerts@medroles.co.uk>";
const BASE = "https://www.medroles.co.uk";

type Alert = {
  id: string;
  email: string;
  specialty: string[] | null;
  grade: string[] | null;
  region: string[] | null;
  unsubscribe_token: string;
};

type Job = {
  id: string;
  title: string;
  specialty: string | null;
  grade: string | null;
  region: string | null;
  salary_min: number | null;
  salary_max: number | null;
  closes_at: string | null;
  posted_at: string | null;
  trusts: { name: string } | { name: string }[] | null;
};

function matchesAlert(job: Job, alert: Alert): boolean {
  if (alert.specialty?.length && !alert.specialty.includes(job.specialty ?? "")) return false;
  if (alert.grade?.length && !alert.grade.includes(job.grade ?? "")) return false;
  if (alert.region?.length && !alert.region.includes(job.region ?? "")) return false;
  return true;
}

function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return "";
  const fmt = (n: number) => "£" + n.toLocaleString("en-GB", { maximumFractionDigits: 0 });
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

function buildPlainText(jobs: Job[], alert: Alert): string {
  const unsubUrl = `${BASE}/api/alerts/unsubscribe?token=${alert.unsubscribe_token}`;
  const filterLine = [alert.specialty?.join(", "), alert.grade?.join(", "), alert.region?.join(", ")]
    .filter(Boolean)
    .join(" · ");

  const lines = [
    "MedRoles — New NHS jobs matching your alert",
    filterLine ? `Alert: ${filterLine}` : "",
    "",
    `${jobs.length} new job${jobs.length !== 1 ? "s" : ""} posted in the last 24 hours:`,
    "",
  ].filter((l) => l !== undefined);

  for (const j of jobs) {
    const trust = Array.isArray(j.trusts) ? j.trusts[0] : j.trusts;
    const closes = j.closes_at
      ? new Date(j.closes_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : null;
    lines.push(`${j.title}`);
    lines.push(`${trust?.name ?? "NHS Trust"}${closes ? ` · Closes ${closes}` : ""}`);
    lines.push(`${BASE}/jobs/${j.id}`);
    lines.push("");
  }

  lines.push(`Unsubscribe: ${unsubUrl}`);
  return lines.join("\n");
}

function buildEmail(jobs: Job[], alert: Alert): string {
  const unsubUrl = `${BASE}/api/alerts/unsubscribe?token=${alert.unsubscribe_token}`;

  const filterLine = [
    alert.specialty?.join(", "),
    alert.grade?.join(", "),
    alert.region?.join(", "),
  ]
    .filter(Boolean)
    .join(" · ");

  const jobCards = jobs
    .map((j) => {
      const trust = Array.isArray(j.trusts) ? j.trusts[0] : j.trusts;
      const trustName = trust?.name ?? "NHS Trust";
      const salary = formatSalary(j.salary_min, j.salary_max);
      const closes = j.closes_at
        ? new Date(j.closes_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : null;
      const meta = [j.grade, j.region, salary, closes ? `Closes ${closes}` : null]
        .filter(Boolean)
        .join(" · ");

      return `
        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin-bottom:12px">
          <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#111827">
            <a href="${BASE}/jobs/${j.id}" style="color:#059669;text-decoration:none">${j.title}</a>
          </p>
          <p style="margin:0 0 6px;font-size:13px;color:#6b7280">${trustName}</p>
          ${meta ? `<p style="margin:0;font-size:12px;color:#9ca3af">${meta}</p>` : ""}
        </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="background:#059669;padding:24px 28px">
      <p style="margin:0;font-size:18px;font-weight:700;color:#fff">MedRoles</p>
      <p style="margin:4px 0 0;font-size:13px;color:#d1fae5">New NHS jobs matching your alert</p>
    </div>
    <div style="padding:24px 28px">
      ${filterLine ? `<p style="margin:0 0 16px;font-size:13px;color:#6b7280">Alert: <strong>${filterLine}</strong></p>` : ""}
      <p style="margin:0 0 16px;font-size:14px;color:#374151">
        ${jobs.length} new job${jobs.length !== 1 ? "s" : ""} posted in the last 24 hours:
      </p>
      ${jobCards}
      <a href="${BASE}/jobs${alert.specialty?.length === 1 ? `?specialty=${encodeURIComponent(alert.specialty[0])}` : ""}"
         style="display:inline-block;margin-top:8px;padding:12px 24px;background:#059669;color:#fff;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">
        View all matching jobs
      </a>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #f3f4f6;background:#f9fafb">
      <p style="margin:0;font-size:11px;color:#9ca3af">
        You're receiving this because you set up a job alert on MedRoles.
        <a href="${unsubUrl}" style="color:#6b7280">Unsubscribe</a>
      </p>
    </div>
  </div>
</body></html>`;
}

export async function GET(req: NextRequest) {
  // Vercel cron sends: Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Jobs posted in last 25 hours (slight buffer for cron drift)
  const since = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

  const [{ data: newJobs }, { data: alerts }] = await Promise.all([
    supabaseAdmin
      .from("job_listings")
      .select("id, title, specialty, grade, region, salary_min, salary_max, closes_at, posted_at, trusts(name)")
      .gte("created_at", since)
      .gte("closes_at", new Date().toISOString().slice(0, 10))
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("job_alerts")
      .select("id, email, specialty, grade, region, unsubscribe_token"),
  ]);

  if (!newJobs?.length || !alerts?.length) {
    return NextResponse.json({ sent: 0, jobs: newJobs?.length ?? 0, alerts: alerts?.length ?? 0 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const alert of alerts as Alert[]) {
    const matches = (newJobs as Job[]).filter((j) => matchesAlert(j, alert));
    if (matches.length === 0) continue;

    const subject =
      matches.length === 1
        ? `New job: ${matches[0].title}`
        : `${matches.length} new${alert.specialty ? ` ${alert.specialty}` : ""} jobs on MedRoles`;

    const { error } = await resend.emails.send({
      from: FROM,
      to: alert.email,
      subject,
      html: buildEmail(matches, alert),
      text: buildPlainText(matches, alert),
      headers: {
        "List-Unsubscribe": `<${BASE}/api/alerts/unsubscribe?token=${alert.unsubscribe_token}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    if (error) {
      console.error(`Failed to send to ${alert.email}:`, error);
      errors.push(alert.email);
    } else {
      sent++;
    }
  }

  // Update last_sent_at for all alerts we processed
  await supabaseAdmin
    .from("job_alerts")
    .update({ last_sent_at: new Date().toISOString() })
    .in("id", (alerts as Alert[]).map((a) => a.id));

  console.log(`send-alerts: ${sent} emails sent, ${errors.length} errors, ${newJobs.length} new jobs`);
  return NextResponse.json({ sent, errors: errors.length, jobs: newJobs.length });
}
