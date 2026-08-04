import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { getGuildMember, getEligibleRoleIds, resolveEligibleRole, discordAvatarUrl } from "@/lib/discord";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify guilds" } },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/verify",
    error: "/verify",
  },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        const discordId = (profile as any).id as string;
        token.discordId = discordId;
        token.username = (profile as any).username as string;
        token.avatarHash = (profile as any).avatar ?? null;

        try {
          const member = await getGuildMember(discordId);
          if (!member) {
            token.isMember = false;
            token.eligibleRole = null;
          } else {
            token.isMember = true;
            const eligibleIds = getEligibleRoleIds();
            token.eligibleRole = resolveEligibleRole(member.roles, eligibleIds);
          }
        } catch (err) {
          console.error("guild lookup failed:", err);
          token.isMember = false;
          token.eligibleRole = null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        discordId: token.discordId as string,
        username: token.username as string,
        avatarUrl: discordAvatarUrl(token.discordId as string, token.avatarHash as string | null),
        isMember: token.isMember as boolean,
        eligibleRole: token.eligibleRole as string | null,
      };
      return session;
    },
  },
});
