"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import { Copy, Check, ShieldCheck, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import { formatDate } from "@/lib/utils";

interface MeResponse {
  user: {
    username: string;
    avatarUrl: string;
  };
  submission: {
    wallet_address: string;
    wallet_type: string;
    role_id: string;
    status: string;
    submitted_at: string;
  } | null;
}

export default function ProfileClient() {
  const { status } = useSession();
  const [data, setData] = useState<MeResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/me")
        .then((r) => r.json())
        .then(setData);
    }
  }, [status]);

  function copyAddress() {
    if (!data?.submission) return;
    navigator.clipboard.writeText(data.submission.wallet_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
      <Navbar />
      <section className="relative mx-auto flex max-w-lg flex-col items-center px-6 pb-24 pt-8">
        {status === "loading" && (
          <div className="flex items-center gap-2 text-mist/50">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}

        {status === "unauthenticated" && (
          <GlassCard className="flex w-full flex-col items-center gap-4 py-9 text-center">
            <p className="text-sm text-mist/60">Sign in to view your verification profile.</p>
            <button onClick={() => signIn("discord")} className="btn-primary">
              Connect Discord
            </button>
          </GlassCard>
        )}

        {status === "authenticated" && !data && (
          <div className="flex items-center gap-2 text-mist/50">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
          </div>
        )}

        {status === "authenticated" && data && (
          <GlassCard className="w-full py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              {data.user?.avatarUrl && (
                <Image src={data.user.avatarUrl} alt="" width={64} height={64} className="rounded-full shadow-glow-sm" />
              )}
              <h1 className="font-display text-lg font-semibold text-mist">{data.user?.username}</h1>

              {data.submission ? (
                <>
                  <span className="mt-1 flex items-center gap-1.5 rounded-full bg-violet/15 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-violet-soft">
                    <ShieldCheck className="h-3.5 w-3.5" /> {data.submission.status}
                  </span>

                  <div className="mt-6 w-full rounded-[1.25rem] border border-line bg-white/[0.02] p-4 text-left">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-mist/40">Wallet address</p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <p className="break-all font-mono text-[13px] text-mist/85">{data.submission.wallet_address}</p>
                      <button onClick={copyAddress} className="shrink-0 rounded-md p-1.5 text-mist/50 hover:bg-white/5 hover:text-violet-soft">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid w-full grid-cols-2 gap-3 text-left">
                    <div className="rounded-[1.25rem] border border-line bg-white/[0.02] p-3">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-mist/40">Chain type</p>
                      <p className="mt-1 text-[13px] text-mist/80">{data.submission.wallet_type.toUpperCase()}</p>
                    </div>
                    <div className="rounded-[1.25rem] border border-line bg-white/[0.02] p-3">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-mist/40">Submitted</p>
                      <p className="mt-1 text-[13px] text-mist/80">{formatDate(data.submission.submitted_at)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-[13px] text-mist/55">You haven&apos;t submitted a wallet yet.</p>
              )}
            </div>
          </GlassCard>
        )}
      </section>
    </main>
  );
}
