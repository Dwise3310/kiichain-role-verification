import { NextResponse } from "next/server";
import { supabasePublic } from "@/lib/supabase";

export async function GET() {
  // RLS restricts the anon key to is_active = true rows only (see schema.sql).
  const { data, error } = await supabasePublic
    .from("campaigns")
    .select("id, title, description, banner_url, deadline, eligible_roles")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaign: data ?? null });
}
