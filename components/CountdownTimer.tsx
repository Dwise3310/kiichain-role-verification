"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface Props {
  deadline: string; // ISO datetime
  onExpire?: () => void;
}

function getRemaining(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownTimer({ deadline, onExpire }: Props) {
  const [remaining, setRemaining] = useState(() => getRemaining(deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      const next = getRemaining(deadline);
      setRemaining(next);
      if (!next) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline, onExpire]);

  if (!remaining) {
    return (
      <p className="flex items-center justify-center gap-1.5 font-mono text-[12px] uppercase tracking-wide text-red-400/80">
        <Clock className="h-3.5 w-3.5" /> Submissions closed
      </p>
    );
  }

  const unit = (value: number, label: string) => (
    <div className="flex flex-col items-center">
      <span className="font-display text-lg font-semibold text-mist tabular-nums">{String(value).padStart(2, "0")}</span>
      <span className="font-mono text-[9px] uppercase tracking-wider text-mist/40">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center justify-center gap-4 rounded-xl2 border border-line bg-white/[0.02] px-5 py-3">
      {unit(remaining.days, "days")}
      <span className="text-mist/20">:</span>
      {unit(remaining.hours, "hrs")}
      <span className="text-mist/20">:</span>
      {unit(remaining.minutes, "min")}
      <span className="text-mist/20">:</span>
      {unit(remaining.seconds, "sec")}
    </div>
  );
}
