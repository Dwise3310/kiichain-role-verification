import crypto from "crypto";
import { supabaseAdmin } from "./supabase";

export async function logAudit(actor: string, action: string, target?: string, metadata?: Record<string, unknown>) {
  try {
    await supabaseAdmin()
      .from("audit_logs")
      .insert({ actor, action, target, metadata: metadata ?? {} });
  } catch (err) {
    // Auditing must never break the main request flow.
    console.error("audit log failed:", err);
  }
}

export async function logDuplicateAttempt(discordId: string, reason: string, walletAddress?: string) {
  try {
    await supabaseAdmin()
      .from("duplicate_attempts")
      .insert({ discord_id: discordId, reason, wallet_address: walletAddress });
  } catch (err) {
    console.error("duplicate attempt log failed:", err);
  }
}

/** One-way hash of an IP address for audit/rate-limit purposes — never store raw IPs. */
export function hashIp(ip: string): string {
  const salt = process.env.NEXTAUTH_SECRET || "kii-fallback-salt";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
