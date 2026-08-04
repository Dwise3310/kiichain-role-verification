import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { validateWallet } from "@/lib/wallet";
import { logAudit } from "@/lib/audit";

// Auth is enforced by middleware.ts for all /api/admin/* routes.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Number(searchParams.get("pageSize") ?? 25));

  const db = supabaseAdmin();
  let query = db
    .from("submissions")
    .select("*", { count: "exact" })
    .order("submitted_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (q) {
    query = query.or(`discord_username.ilike.%${q}%,wallet_address.ilike.%${q}%,discord_id.ilike.%${q}%`);
  }
  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ submissions: data, total: count ?? 0, page, pageSize });
}

const editSchema = z.object({
  id: z.string().uuid(),
  wallet: z.string().min(10).max(80).optional(),
  status: z.enum(["confirmed", "flagged", "revoked"]).optional(),
  override: z.boolean().optional(), // allow reassigning a wallet already in use
});

export async function PATCH(req: NextRequest) {
  const parsed = editSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const updates: Record<string, unknown> = {};

  if (parsed.data.wallet) {
    const wallet = validateWallet(parsed.data.wallet);
    if (!wallet) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    if (!parsed.data.override) {
      const { data: inUse } = await db
        .from("submissions")
        .select("id")
        .eq("wallet_address", wallet.address)
        .neq("id", parsed.data.id)
        .maybeSingle();

      if (inUse) {
        return NextResponse.json(
          { error: "That wallet is already linked to another submission. Retry with override to force it." },
          { status: 409 }
        );
      }
    }

    updates.wallet_address = wallet.address;
    updates.wallet_type = wallet.type;
  }

  if (parsed.data.status) {
    updates.status = parsed.data.status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await db.from("submissions").update(updates).eq("id", parsed.data.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit("admin", "submission_edited", parsed.data.id, updates);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json().catch(() => ({ id: null }));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = supabaseAdmin();
  const { error } = await db.from("submissions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit("admin", "submission_deleted", id);
  return NextResponse.json({ ok: true });
}
