"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="mt-auto flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-display text-[13px] text-mist/50 transition-colors hover:bg-white/[0.04] hover:text-red-400"
    >
      <LogOut className="h-4 w-4" strokeWidth={1.8} />
      Log out
    </button>
  );
}
