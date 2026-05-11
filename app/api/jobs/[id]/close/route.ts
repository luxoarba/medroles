import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const resend = new Resend(process.env.RESEND_API_KEY!);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const provided: string = body?.token ?? "";
  const expected = createHmac("sha256", process.env.CRON_SECRET!).update(id).digest("hex");

  let valid = false;
  try {
    valid =
      provided.length === expected.length &&
      timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    valid = false;
  }

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: job } = await supabase
    .from("job_listings")
    .select("title, trusts(name)")
    .eq("id", id)
    .single();

  const trustRaw = job?.trusts;
  const trustName = Array.isArray(trustRaw) ? trustRaw[0]?.name : (trustRaw as { name: string } | null | undefined)?.name;

  const jobUrl = `https://www.medroles.co.uk/jobs/${id}`;

  await resend.emails.send({
    from: "MedRoles <alerts@medroles.co.uk>",
    to: "hello@medroles.co.uk",
    subject: `Job reported as filled: ${job?.title ?? id}`,
    text: [
      "A user has reported the following job as filled:",
      "",
      `Title: ${job?.title ?? "Unknown"}`,
      `Trust: ${trustName ?? "Unknown"}`,
      `Job ID: ${id}`,
      `URL: ${jobUrl}`,
      "",
      "Please verify and remove it from listings if confirmed.",
    ].join("\n"),
  });

  return NextResponse.json({ ok: true });
}
