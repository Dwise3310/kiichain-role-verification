"use client";

import { useEffect, useState } from "react";
import { Users, Copy, Flag, Wallet } from "lucide-react";
import GlassCard from "@/components/GlassCard";

interface Stats {
  totalSubmissions: number;
  duplicateAttempts: number;
  flagged: number;
  walletCount: number;
  roleBreakdown: Record<string, number>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [roleNames, setRoleNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats);
    fetch("/api/admin/roles")
      .then((r) => r.json())
      .then((json) => setRoleNames(json.roles ?? {}));
  }, []);

  const cards = [
    { label: "Total submissions", value: stats?.totalSubmissions, icon: Users },
    { label: "Wallets collected", value: stats?.walletCount, icon: Wallet },
    { label: "Duplicate attempts", value: stats?.duplicateAttempts, icon: Copy },
    { label: "Flagged", value: stats?.flagged, icon: Flag },
  ];

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-mist">Dashboard</h1>
      <p className="mt-1 text-[13px] text-mist/50">Live overview of the verification portal.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <GlassCard key={card.label} className="flex flex-col gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet/15 text-violet-soft">
              <card.icon className="h-4.5 w-4.5" strokeWidth={1.8} size={18} />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-mist/40">{card.label}</p>
              <p className="mt-1 font-display text-2xl font-semibold text-mist">
                {card.value ?? <span className="text-mist/20">—</span>}
              </p>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="mt-6">
        <h2 className="font-display text-sm font-semibold text-mist">Role breakdown</h2>
        <div className="mt-4 flex flex-col gap-3">
          {stats && Object.keys(stats.roleBreakdown).length === 0 && (
            <p className="text-[13px] text-mist/40">No submissions yet.</p>
          )}
          {stats &&
            Object.entries(stats.roleBreakdown).map(([roleId, count]) => {
              const max = Math.max(...Object.values(stats.roleBreakdown), 1);
              return (
                <div key={roleId} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 truncate font-mono text-[12px] text-mist/60" title={roleId}>
                    {roleNames[roleId] ?? roleId}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet to-violet-glow"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right font-mono text-[12px] text-mist/60">{count}</span>
                </div>
              );
            })}
        </div>
      </GlassCard>
    </div>
  );
}
