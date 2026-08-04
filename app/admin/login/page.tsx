"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Login failed");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6">
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
      <GlassCard className="relative w-full max-w-sm py-9">
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-violet/15 text-violet-soft">
            <Lock className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div className="text-center">
            <h1 className="font-display text-lg font-semibold text-mist">Admin access</h1>
            <p className="mt-1 text-[13px] text-mist/50">Restricted to KiiChain team members.</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full rounded-lg border border-line bg-white/[0.03] px-4 py-3 text-sm text-mist placeholder:text-mist/30 focus:border-violet-soft/50 focus:outline-none"
          />
          {error && <p className="text-[13px] text-red-400/90">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
          </button>
        </form>
      </GlassCard>
    </main>
  );
}
