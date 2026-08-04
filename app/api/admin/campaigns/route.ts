import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db.from("campaigns").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data });
}

const createSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  bannerUrl: z.string().url().optional(),
  eligibleRoles: z.array(z.string()).default([]),
  deadline: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("campaigns")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      banner_url: parsed.data.bannerUrl,
      eligible_roles: parsed.data.eligibleRoles,
      deadline: parsed.data.deadline,
      is_active: parsed.data.isActive,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit("admin", "campaign_created", data.id, { title: data.title });
  return NextResponse.json({ campaign: data });
}

const updateSchema = createSchema.partial().extend({ id: z.string().uuid() });

export async function PATCH(req: NextRequest) {
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, bannerUrl, eligibleRoles, isActive, ...rest } = parsed.data;
  const db = supabaseAdmin();
  const { error } = await db
    .from("campaigns")
    .update({
      ...rest,
      ...(bannerUrl !== undefined && { banner_url: bannerUrl }),
      ...(eligibleRoles !== undefined && { eligible_roles: eligibleRoles }),
      ...(isActive !== undefined && { is_active: isActive }),
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit("admin", "campaign_updated", id);
  return NextResponse.json({ ok: true });
}
