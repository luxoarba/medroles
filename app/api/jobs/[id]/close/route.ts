import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const closedDate = yesterday.toISOString().slice(0, 10);

  const { error } = await supabase
    .from("job_listings")
    .update({ closes_at: closedDate })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
