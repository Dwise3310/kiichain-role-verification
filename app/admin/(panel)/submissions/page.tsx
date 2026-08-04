"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Pencil, Trash2, Download, X, Check, ChevronLeft, ChevronRight } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import Skeleton from "@/components/Skeleton";
import { formatDate } from "@/lib/utils";
import { shortenAddress } from "@/lib/wallet";

interface Submission {
  id: string;
  discord_username: string;
  discord_id: string;
  wallet_address: string;
  wallet_type: string;
  role_id: string;
  status: "confirmed" | "flagged" | "revoked";
  submitted_at: string;
}

const PAGE_SIZE = 25;

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [roleNames, setRoleNames] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (statusFilter !== "all") params.set("status", statusFilter);
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));
    const res = await fetch(`/api/admin/submissions?${params}`);
    const json = await res.json();
    setSubmissions(json.submissions ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [q, statusFilter, page]);

  useEffect(() => {
    fetch("/api/admin/roles")
      .then((r) => r.json())
      .then((json) => setRoleNames(json.roles ?? {}));
  }, []);

  // Reset to page 1 whenever the search or filter changes.
  useEffect(() => {
    setPage(1);
  }, [q, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this submission? This can't be undone.")) return;
    await fetch("/api/admin/submissions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  function startEdit(sub: Submission) {
    setEditingId(sub.id);
    setEditValue(sub.wallet_address);
    setEditError(null);
  }

  async function saveEdit(id: string, override = false) {
    const res = await fetch("/api/admin/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, wallet: editValue, override }),
    });
    const json = await res.json();
    if (!res.ok) {
      if (res.status === 409 && !override) {
        if (confirm(`${json.error} Force it anyway?`)) {
          return saveEdit(id, true);
        }
      }
      setEditError(json.error);
      return;
    }
    setEditingId(null);
    load();
  }

  function exportAs(format: string) {
    window.open(`/api/admin/export?format=${format}`, "_blank");
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-mist">Submissions</h1>
          <p className="mt-1 text-[13px] text-mist/50">{total} total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportAs("csv")} className="btn-secondary text-[12px]">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button onClick={() => exportAs("xlsx")} className="btn-secondary text-[12px]">
            <Download className="h-3.5 w-3.5" /> Excel
          </button>
          <button onClick={() => exportAs("json")} className="btn-secondary text-[12px]">
            <Download className="h-3.5 w-3.5" /> JSON
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist/30" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search username, wallet, or Discord ID…"
            className="w-full rounded-lg border border-line bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-mist placeholder:text-mist/30 focus:border-violet-soft/50 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-line bg-white/[0.03] px-4 py-2.5 text-sm text-mist focus:border-violet-soft/50 focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="flagged">Flagged</option>
          <option value="revoked">Revoked</option>
        </select>
      </div>

      <GlassCard className="mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line text-mist/40">
              <th className="px-5 py-3 font-mono text-[10px] font-normal uppercase tracking-wider">User</th>
              <th className="px-5 py-3 font-mono text-[10px] font-normal uppercase tracking-wider">Wallet</th>
              <th className="px-5 py-3 font-mono text-[10px] font-normal uppercase tracking-wider">Role</th>
              <th className="px-5 py-3 font-mono text-[10px] font-normal uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 font-mono text-[10px] font-normal uppercase tracking-wider">Submitted</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-line/60 last:border-0">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <Skeleton className="h-4 w-full max-w-[140px]" />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading && submissions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-mist/30">
                  No submissions found.
                </td>
              </tr>
            )}
            {!loading &&
              submissions.map((sub) => (
                <tr key={sub.id} className="border-b border-line/60 text-mist/80 last:border-0">
                  <td className="px-5 py-3">{sub.discord_username}</td>
                  <td className="px-5 py-3 font-mono">
                    {editingId === sub.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-48 rounded border border-violet-soft/40 bg-white/[0.04] px-2 py-1 font-mono text-[12px] text-mist focus:outline-none"
                        />
                        <button onClick={() => saveEdit(sub.id)} className="rounded p-1 text-violet-soft hover:bg-white/5">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="rounded p-1 text-mist/40 hover:bg-white/5">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      shortenAddress(sub.wallet_address)
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-[12px] text-mist/50" title={sub.role_id}>
                    {roleNames[sub.role_id] ?? sub.role_id}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="px-5 py-3 text-mist/50">{formatDate(sub.submitted_at)}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => startEdit(sub)} className="rounded p-1.5 text-mist/40 hover:bg-white/5 hover:text-violet-soft">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(sub.id)} className="rounded p-1.5 text-mist/40 hover:bg-white/5 hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </GlassCard>

      <div className="mt-4 flex items-center justify-between">
        <p className="font-mono text-[11px] text-mist/40">
          {total === 0 ? "0 results" : `${rangeStart}–${rangeEnd} of ${total}`}
        </p>
        <div className="flex items-center gap-2">
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

      {editError && <p className="mt-3 text-[13px] text-red-400/90">{editError}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    confirmed: "bg-violet/15 text-violet-soft",
    flagged: "bg-amber-500/15 text-amber-400",
    revoked: "bg-red-500/15 text-red-400",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${colors[status] ?? ""}`}>
      {status}
    </span>
  );
}
