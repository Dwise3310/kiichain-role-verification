import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const db = supabaseAdmin();

  const [{ count: total }, { count: duplicates }, { data: roleRows }, { count: flagged }] = await Promise.all([
    db.from("submissions").select("*", { count: "exact", head: true }),
    db.from("duplicate_attempts").select("*", { count: "exact", head: true }),
    db.from("submissions").select("role_id"),
    db.from("submissions").select("*", { count: "exact", head: true }).eq("status", "flagged"),
  ]);

  const roleBreakdown: Record<string, number> = {};
  for (const row of roleRows ?? []) {
    roleBreakdown[row.role_id] = (roleBreakdown[row.role_id] ?? 0) + 1;
  }

  return NextResponse.json({
    totalSubmissions: total ?? 0,
    duplicateAttempts: duplicates ?? 0,
    flagged: flagged ?? 0,
    walletCount: total ?? 0,
    roleBreakdown,
  });
}
