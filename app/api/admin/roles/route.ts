import { NextResponse } from "next/server";
import { getGuildRoles } from "@/lib/discord";

// Simple in-process cache — role names change rarely, and this avoids
// hitting the Discord API on every dashboard render.
let cache: { data: Record<string, string>; expires: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function GET() {
  if (cache && cache.expires > Date.now()) {
    return NextResponse.json({ roles: cache.data });
  }

  try {
    const roles = await getGuildRoles();
    const map: Record<string, string> = {};
    for (const r of roles) map[r.id] = r.name;
    cache = { data: map, expires: Date.now() + TTL_MS };
    return NextResponse.json({ roles: map });
  } catch (err) {
    console.error("failed to fetch guild roles:", err);
    // Non-fatal — callers fall back to showing raw role IDs.
    return NextResponse.json({ roles: {} });
  }
}
