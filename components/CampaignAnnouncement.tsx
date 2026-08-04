"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import CountdownTimer from "@/components/CountdownTimer";

export interface ActiveCampaign {
  id: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  deadline: string | null;
  eligible_roles: string[];
}

interface Props {
  onLoaded?: (campaign: ActiveCampaign | null) => void;
  showCountdown?: boolean;
}

export default function CampaignAnnouncement({ onLoaded, showCountdown = true }: Props) {
  const [campaign, setCampaign] = useState<ActiveCampaign | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/campaign/active")
      .then((r) => r.json())
      .then((json) => {
        setCampaign(json.campaign ?? null);
        onLoaded?.(json.campaign ?? null);
      })
      .catch(() => {
        setCampaign(null);
        onLoaded?.(null);
      });
    // onLoaded is a caller-supplied callback; intentionally not in deps to avoid refetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!campaign) return null;

  return (
    <GlassCard className="w-full overflow-hidden p-0">
      {campaign.banner_url && (
        <div className="relative h-32 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-supplied URL, not in next.config.js remotePatterns */}
          <img src={campaign.banner_url} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-plum via-plum/40 to-transparent" />
        </div>
      )}
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-violet-soft/70">
          <Megaphone className="h-3 w-3" /> Active campaign
        </span>
        <h3 className="font-display text-base font-semibold text-mist">{campaign.title}</h3>
        {campaign.description && <p className="text-[13px] text-mist/55">{campaign.description}</p>}
        {showCountdown && campaign.deadline && <CountdownTimer deadline={campaign.deadline} />}
      </div>
    </GlassCard>
  );
}
