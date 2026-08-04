import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { supabaseAdmin } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = (searchParams.get("format") || "csv").toLowerCase();

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("submissions")
    .select("discord_id, discord_username, wallet_address, wallet_type, role_id, status, submitted_at")
    .order("submitted_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit("admin", "export", undefined, { format, rowCount: data?.length ?? 0 });

  const rows = data ?? [];

  if (format === "json") {
    return new NextResponse(JSON.stringify(rows, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="kiichain-submissions.json"`,
      },
    });
  }

  if (format === "xlsx") {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="kiichain-submissions.xlsx"`,
      },
    });
  }

  // default: csv
  const csv = Papa.unparse(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="kiichain-submissions.csv"`,
    },
  });
}
