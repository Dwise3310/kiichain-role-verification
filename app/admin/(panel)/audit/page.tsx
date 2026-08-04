"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import Skeleton from "@/components/Skeleton";
import { formatDate } from "@/lib/utils";

interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const PAGE_SIZE = 30;

const actionColors: Record<string, string> = {
  submission_created: "bg-violet/15 text-violet-soft",
  submission_edited: "bg-blue-500/15 text-blue-400",
  submission_deleted: "bg-red-500/15 text-red-400",
  admin_login: "bg-emerald-500/15 text-emerald-400",
  admin_login_failed: "bg-red-500/15 text-red-400",
  campaign_created: "bg-violet/15 text-violet-soft",
  campaign_updated: "bg-blue-500/15 text-blue-400",
  export: "bg-amber-500/15 text-amber-400",
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/audit?page=${page}&pageSize=${PAGE_SIZE}`);
    const json = await res.json();
    setLogs(json.logs ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <ScrollText className="h-5 w-5 text-violet-soft" strokeWidth={1.8} />
        <h1 className="font-display text-xl font-semibold text-mist">Audit log</h1>
      </div>
      <p className="mt-1 text-[13px] text-mist/50">{total} recorded actions</p>

      <GlassCard className="mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line text-mist/40">
              <th className="px-5 py-3 font-mono text-[10px] font-normal uppercase tracking-wider">Actor</th>
              <th className="px-5 py-3 font-mono text-[10px] font-normal uppercase tracking-wider">Action</th>
              <th className="px-5 py-3 font-mono text-[10px] font-normal uppercase tracking-wider">Target</th>
              <th className="px-5 py-3 font-mono text-[10px] font-normal uppercase tracking-wider">When</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-line/60 last:border-0">
                  {Array.from({ length: 4 }).map((__, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <Skeleton className="h-4 w-full max-w-[160px]" />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-mist/30">
                  No activity recorded yet.
                </td>
              </tr>
            )}
            {!loading &&
              logs.map((log) => (
                <tr key={log.id} className="border-b border-line/60 text-mist/80 last:border-0">
                  <td className="px-5 py-3 font-mono text-[12px]">{log.actor}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${
                        actionColors[log.action] ?? "bg-white/[0.04] text-mist/50"
                      }`}
                    >
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-[12px] text-mist/50">{log.target ?? "—"}</td>
                  <td className="px-5 py-3 text-mist/50">{formatDate(log.created_at)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </GlassCard>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="btn-secondary px-3 py-2 text-[12px] disabled:opacity-30"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="font-mono text-[12px] text-mist/50">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="btn-secondary px-3 py-2 text-[12px] disabled:opacity-30"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
