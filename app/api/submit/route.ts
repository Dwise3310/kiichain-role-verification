import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { validateWallet } from "@/lib/wallet";
import { getGuildMember, getEligibleRoleIds, resolveEligibleRole } from "@/lib/discord";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logAudit, logDuplicateAttempt, hashIp } from "@/lib/audit";

const schema = z.object({
  wallet: z.string().min(10).max(80),
  campaignId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  // 1. Must be signed in via Discord
  const session = await auth();
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const ip = getClientIp(req.headers);
  const { success } = await checkRateLimit(`submit:${session.user.discordId}`);
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  // 2. Re-verify membership + role server-side — never trust the client's
  //    claimed role, even if it came from the session token.
  const member = await getGuildMember(session.user.discordId);
  if (!member) {
    await logDuplicateAttempt(session.user.discordId, "not_member");
    return NextResponse.json({ error: "You are not a member of the official KiiChain Discord." }, { status: 403 });
  }

  const db = supabaseAdmin();

  // If submitting against a specific campaign, that campaign's own role list
  // and deadline govern eligibility. Otherwise fall back to the global
  // ELIGIBLE_ROLE_IDS env var for the default verification flow.
  let eligibleRoleIds = getEligibleRoleIds();

  if (parsed.data.campaignId) {
    const { data: campaign } = await db
      .from("campaigns")
      .select("eligible_roles, deadline, is_active")
      .eq("id", parsed.data.campaignId)
      .maybeSingle();

    if (!campaign || !campaign.is_active) {
      return NextResponse.json({ error: "This campaign is no longer active." }, { status: 403 });
    }
    if (campaign.deadline && new Date(campaign.deadline).getTime() < Date.now()) {
      return NextResponse.json({ error: "The submission deadline for this campaign has passed." }, { status: 403 });
    }
    if (campaign.eligible_roles?.length) {
      eligibleRoleIds = campaign.eligible_roles;
    }
  }

  const roleId = resolveEligibleRole(member.roles, eligibleRoleIds);
  if (!roleId) {
    await logDuplicateAttempt(session.user.discordId, "not_eligible");
    return NextResponse.json({ error: "Sorry, your account isn't eligible." }, { status: 403 });
  }

  // 3. Validate wallet format (EVM checksum or Cosmos bech32)
  const wallet = validateWallet(parsed.data.wallet);
  if (!wallet) {
    return NextResponse.json({ error: "That doesn't look like a valid wallet address." }, { status: 400 });
  }


  // 4. Prevent duplicate submissions for this campaign
  let dupQuery = db
    .from("submissions")
    .select("id")
    .eq("discord_id", session.user.discordId);

  dupQuery = parsed.data.campaignId
    ? dupQuery.eq("campaign_id", parsed.data.campaignId)
    : dupQuery.is("campaign_id", null);

  const { data: existing } = await dupQuery.maybeSingle();

  if (existing) {
    await logDuplicateAttempt(session.user.discordId, "already_submitted", wallet.address);
    return NextResponse.json({ error: "You've already submitted your wallet." }, { status: 409 });
  }

  // 5. Prevent the same wallet being reused across different Discord accounts
  const { data: walletInUse } = await db
    .from("submissions")
    .select("id, discord_id")
    .eq("wallet_address", wallet.address)
    .maybeSingle();

  if (walletInUse && walletInUse.discord_id !== session.user.discordId) {
    await logDuplicateAttempt(session.user.discordId, "wallet_in_use", wallet.address);
    return NextResponse.json({ error: "This wallet address is already linked to another Discord account." }, { status: 409 });
  }

  // 6. Insert
  const { data: inserted, error } = await db
    .from("submissions")
    .insert({
      campaign_id: parsed.data.campaignId ?? null,
      discord_id: session.user.discordId,
      discord_username: session.user.username,
      discord_avatar: session.user.avatarUrl,
      role_id: roleId,
      wallet_address: wallet.address,
      wallet_type: wallet.type,
      ip_hash: hashIp(ip),
    })
    .select("id, submitted_at")
    .single();

  if (error) {
    // Unique constraint race (two simultaneous requests) surfaces here
    if (error.code === "23505") {
      return NextResponse.json({ error: "You've already submitted your wallet." }, { status: 409 });
    }
    console.error("submission insert failed:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  await logAudit(session.user.discordId, "submission_created", inserted.id, {
    wallet: wallet.address,
    role: roleId,
  });

  return NextResponse.json({ ok: true, submissionId: inserted.id, submittedAt: inserted.submitted_at });
}
