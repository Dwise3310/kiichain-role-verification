/**
 * Server-side Discord helpers. These call Discord's bot API using
 * DISCORD_BOT_TOKEN and must never be imported into client components —
 * the bot token would leak.
 */

const DISCORD_API = "https://discord.com/api/v10";

export interface DiscordGuildMember {
  user: { id: string; username: string; avatar: string | null };
  roles: string[];
  nick: string | null;
}

/**
 * Fetch a user's membership + roles for the configured guild.
 * Returns null if the user is not a member of the guild.
 */
export async function getGuildMember(discordUserId: string): Promise<DiscordGuildMember | null> {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!guildId || !botToken) {
    throw new Error("DISCORD_GUILD_ID or DISCORD_BOT_TOKEN is not configured");
  }

  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/members/${discordUserId}`, {
    headers: { Authorization: `Bot ${botToken}` },
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Discord API error (${res.status}): ${await res.text()}`);
  }

  return res.json();
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
}

/** Fetch all roles defined on the guild, used to resolve role IDs to names. */
export async function getGuildRoles(): Promise<DiscordRole[]> {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/roles`, {
    headers: { Authorization: `Bot ${botToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Discord API error (${res.status}): ${await res.text()}`);
  }

  return res.json();
}

/** Returns the configured eligible role IDs from env, trimmed and de-duped. */
export function getEligibleRoleIds(): string[] {
  return (process.env.ELIGIBLE_ROLE_IDS || "")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
}

/** Intersects a member's roles with the eligible set. Returns the first match, or null. */
export function resolveEligibleRole(memberRoles: string[], eligibleRoleIds: string[]): string | null {
  return memberRoles.find((r) => eligibleRoleIds.includes(r)) ?? null;
}

export function discordAvatarUrl(userId: string, avatarHash: string | null): string {
  if (!avatarHash) {
    // default avatar based on discriminator-less id (Discord's new username system)
    const index = (BigInt(userId) >> 22n) % 6n;
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  }
  const ext = avatarHash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${ext}`;
}
