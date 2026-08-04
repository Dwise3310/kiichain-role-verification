"use client";


import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Loader2, ShieldX, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import VerificationRing from "@/components/VerificationRing";
import WalletConnectPanel from "@/components/WalletConnectPanel";
import CampaignAnnouncement, { ActiveCampaign } from "@/components/CampaignAnnouncement";
import { shortenAddress } from "@/lib/wallet";

export default function VerifyClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<ActiveCampaign | null>(null);
  const [roleNames, setRoleNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/roles/eligible")
      .then((r) => r.json())
      .then((json) => setRoleNames(json.roles ?? {}));
  }, []);

  const campaignExpired = !!(campaign?.deadline && new Date(campaign.deadline).getTime() < Date.now());

  const loading = status === "loading";
  const signedIn = status === "authenticated";
  const isMember = session?.user?.isMember;
  const eligibleRole = session?.user?.eligibleRole;

  // Ring progress: 1 connected, 2 member confirmed, 3 role confirmed, 4 wallet linked, 5 submitted
  let progress = 0;
  if (signedIn) progress = 1;
  if (signedIn && isMember) progress = 2;
  if (signedIn && isMember && eligibleRole) progress = 3;
  if (walletAddress) progress = 4;

  async function handleSubmit() {
    if (!walletAddress) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress, campaignId: campaign?.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error || "Submission failed.");
        return;
      }
      router.push("/success");
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
      <Navbar />

      <section className="relative mx-auto flex max-w-lg flex-col items-center px-6 pb-24 pt-8 text-center">
        <VerificationRing progress={progress} totalSteps={5} size={200} className="mb-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-soft/60">Step</span>
          <span className="font-display text-2xl font-semibold text-mist">{Math.min(progress + 1, 5)}/5</span>
        </VerificationRing>

        <div className="mb-8 w-full">
          <CampaignAnnouncement onLoaded={setCampaign} />
        </div>

        <AnimatePresence mode="wait">
          {loading && (
            <motion.div key="loading" {...fade} className="flex items-center gap-2 text-mist/50">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking session…
            </motion.div>
          )}

          {!loading && !signedIn && (
            <motion.div key="signin" {...fade} className="w-full">
              <GlassCard className="flex flex-col items-center gap-5 py-9">
                <MessageSquare className="h-8 w-8 text-violet-soft" strokeWidth={1.6} />
                <div>
                  <h2 className="font-display text-lg font-semibold text-mist">Connect Discord</h2>
                  <p className="mt-1.5 text-[13px] text-mist/55">
                    Sign in with the account that&apos;s a member of the official KiiChain server.
                  </p>
                </div>
                <button onClick={() => signIn("discord")} className="btn-primary w-full justify-center">
                  Connect Discord
                </button>
              </GlassCard>
            </motion.div>
          )}

          {!loading && signedIn && !isMember && (
            <motion.div key="notmember" {...fade} className="w-full">
              <GlassCard className="flex flex-col items-center gap-4 py-9">
                <ShieldX className="h-8 w-8 text-red-400" strokeWidth={1.6} />
                <h2 className="font-display text-lg font-semibold text-mist">Not a server member</h2>
                <p className="text-[13px] text-mist/55">You are not a member of the official KiiChain Discord.</p>
              </GlassCard>
            </motion.div>
          )}

          {!loading && signedIn && isMember && !eligibleRole && (
            <motion.div key="notEligible" {...fade} className="w-full">
              <GlassCard className="flex flex-col items-center gap-4 py-9">
                <ShieldX className="h-8 w-8 text-red-400" strokeWidth={1.6} />
                <h2 className="font-display text-lg font-semibold text-mist">Not eligible</h2>
                <p className="text-[13px] text-mist/55">Sorry, your account isn&apos;t eligible for this campaign.</p>
              </GlassCard>
            </motion.div>
          )}

          {!loading && signedIn && isMember && eligibleRole && !walletAddress && (
            <motion.div key="wallet" {...fade} className="w-full">
              <GlassCard className="flex flex-col items-center gap-5 py-8">
                <div className="flex items-center gap-2">
                  {session.user.avatarUrl && (
                    <Image src={session.user.avatarUrl} alt="" width={28} height={28} className="rounded-full" />
                  )}
                  <span className="font-display text-sm text-mist">{session.user.username}</span>
                  <span className="flex items-center gap-1 rounded-full bg-violet/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-violet-soft">
                    <ShieldCheck className="h-3 w-3" /> {eligibleRole && roleNames[eligibleRole] ? roleNames[eligibleRole] : "Role verified"}
                  </span>
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-mist">Authorize your wallet</h2>
                  <p className="mt-1.5 text-[13px] text-mist/55">Connect the wallet you want linked for eligibility.</p>
                </div>
                <WalletConnectPanel onConnected={setWalletAddress} />
              </GlassCard>
            </motion.div>
          )}

          {!loading && signedIn && isMember && eligibleRole && walletAddress && (
            <motion.div key="confirm" {...fade} className="w-full">
              <GlassCard className="flex flex-col items-center gap-5 py-9">
                <ShieldCheck className="h-8 w-8 text-violet-soft" strokeWidth={1.6} />
                <div>
                  <h2 className="font-display text-lg font-semibold text-mist">Confirm submission</h2>
                  <p className="mt-2 rounded-lg bg-white/[0.03] px-4 py-2 font-mono text-sm text-mist/80">
                    {shortenAddress(walletAddress, 6)}
                  </p>
                </div>
                {submitError && <p className="text-[13px] text-red-400/90">{submitError}</p>}
                {campaignExpired && (
                  <p className="text-[13px] text-amber-400/90">This campaign&apos;s submission window has closed.</p>
                )}
                <div className="flex w-full gap-3">
                  <button onClick={() => setWalletAddress(null)} className="btn-secondary flex-1">
                    Change wallet
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || campaignExpired}
                    className="btn-primary flex-1 justify-center"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25 },
};
