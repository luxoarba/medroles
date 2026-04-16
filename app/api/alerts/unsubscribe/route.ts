import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("job_alerts")
    .delete()
    .eq("unsubscribe_token", token);

  if (error) {
    return new NextResponse("Failed to unsubscribe", { status: 500 });
  }

  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribed</title>
    <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb}
    .box{text-align:center;padding:2rem}<h1{font-size:1.25rem;color:#111827;margin-bottom:.5rem}p{color:#6b7280;font-size:.875rem}</style>
    </head><body><div class="box"><h1>Unsubscribed</h1>
    <p>You've been removed from MedRoles job alerts.</p>
    <p><a href="https://www.medroles.co.uk" style="color:#059669">Back to MedRoles</a></p>
    </div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html" } },
  );
}
