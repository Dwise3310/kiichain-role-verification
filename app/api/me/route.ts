import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const db = supabaseAdmin();
  const { data } = await db
    .from("submissions")
    .select("wallet_address, wallet_type, role_id, status, submitted_at")
    .eq("discord_id", session.user.discordId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ user: session.user, submission: data ?? null });
         }
