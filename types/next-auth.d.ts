import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      discordId: string;
      username: string;
      avatarUrl: string;
      isMember: boolean;
      eligibleRole: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discordId?: string;
    username?: string;
    avatarHash?: string | null;
    isMember?: boolean;
    eligibleRole?: string | null;
  }
}
