import { NextResponse } from "next/server";
import { getGuildRoles, getEligibleRoleIds } from "@/lib/discord";

let cache: { data: Record<string, string>; expires: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function GET() {
  if (cache && cache.expires > Date.now()) {
    return NextResponse.json({ roles: cache.data });
  }

  try {
    const eligibleIds = new Set(getEligibleRoleIds());
    const roles = await getGuildRoles();
    const map: Record<string, string> = {};
    for (const r of roles) {
      if (eligibleIds.has(r.id)) map[r.id] = r.name;
    }
    cache = { data: map, expires: Date.now() + TTL_MS };
    return NextResponse.json({ roles: map });
  } catch (err) {
    console.error("failed to fetch eligible role names:", err);
    return NextResponse.json({ roles: {} });
  }
}
