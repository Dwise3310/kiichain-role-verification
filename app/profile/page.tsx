import ProfileClient from "./ProfileClient";

// Force server-side rendering so the session is available before render
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function ProfilePage() {
  return <ProfileClient />;
}
