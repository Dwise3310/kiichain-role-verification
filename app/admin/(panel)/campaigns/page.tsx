"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Calendar, Power } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { formatDate } from "@/lib/utils";

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  eligible_roles: string[];
  deadline: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [roleNames, setRoleNames] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [roles, setRoles] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/campaigns");
    const json = await res.json();
    setCampaigns(json.campaigns ?? []);
  }, []);

  useEffect(() => {
    load();
    fetch("/api/admin/roles")
      .then((r) => r.json())
      .then((json) => setRoleNames(json.roles ?? {}));
  }, [load]);

  async function handleCreate() {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    const res = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || undefined,
        bannerUrl: bannerUrl || undefined,
        eligibleRoles: roles.split(",").map((r) => r.trim()).filter(Boolean),
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        isActive: true,
      }),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(typeof json.error === "string" ? json.error : "Couldn't create campaign.");
      return;
    }
    setTitle("");
    setDescription("");
    setBannerUrl("");
    setRoles("");
    setDeadline("");
    setCreating(false);
    load();
  }

  async function toggleActive(campaign: Campaign) {
    await fetch("/api/admin/campaigns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: campaign.id, isActive: !campaign.is_active }),
    });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-mist">Campaigns</h1>
          <p className="mt-1 text-[13px] text-mist/50">{campaigns.length} total</p>
        </div>
        <button onClick={() => setCreating((v) => !v)} className="btn-primary text-[13px]">
          <Plus className="h-4 w-4" /> New campaign
        </button>
      </div>

      {creating && (
        <GlassCard className="mt-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (e.g. KiiLegend Reward)"
              className="rounded-lg border border-line bg-white/[0.03] px-4 py-2.5 text-sm text-mist placeholder:text-mist/30 focus:border-violet-soft/50 focus:outline-none sm:col-span-2"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              rows={2}
              className="rounded-lg border border-line bg-white/[0.03] px-4 py-2.5 text-sm text-mist placeholder:text-mist/30 focus:border-violet-soft/50 focus:outline-none sm:col-span-2"
            />
            <input
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="Banner image URL (optional)"
              className="rounded-lg border border-line bg-white/[0.03] px-4 py-2.5 text-sm text-mist placeholder:text-mist/30 focus:border-violet-soft/50 focus:outline-none sm:col-span-2"
            />
            <input
              value={roles}
              onChange={(e) => setRoles(e.target.value)}
              placeholder="Eligible role IDs, comma-separated"
              className="rounded-lg border border-line bg-white/[0.03] px-4 py-2.5 text-sm text-mist placeholder:text-mist/30 focus:border-violet-soft/50 focus:outline-none"
            />
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded-lg border border-line bg-white/[0.03] px-4 py-2.5 text-sm text-mist focus:border-violet-soft/50 focus:outline-none"
            />
          </div>
          {error && <p className="mt-3 text-[13px] text-red-400/90">{error}</p>}
          <button onClick={handleCreate} className="btn-primary mt-4 text-[13px]">
            Create campaign
          </button>
        </GlassCard>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {campaigns.map((c) => (
          <GlassCard key={c.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <h3 className="font-display text-sm font-semibold text-mist">{c.title}</h3>
              <button
                onClick={() => toggleActive(c)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${
                  c.is_active ? "bg-violet/15 text-violet-soft" : "bg-white/[0.04] text-mist/40"
                }`}
              >
                <Power className="h-3 w-3" /> {c.is_active ? "Active" : "Inactive"}
              </button>
            </div>
            {c.description && <p className="text-[13px] text-mist/55">{c.description}</p>}
            {c.deadline && (
              <p className="flex items-center gap-1.5 font-mono text-[11px] text-mist/40">
                <Calendar className="h-3 w-3" /> Deadline {formatDate(c.deadline)}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {c.eligible_roles.length === 0 && <span className="text-[11px] text-mist/30">No role restriction</span>}
              {c.eligible_roles.map((r) => (
                <span key={r} className="rounded-full bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-mist/50" title={r}>
                  {roleNames[r] ?? r}
                </span>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
