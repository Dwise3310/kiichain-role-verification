import Link from "next/link";
import { ArrowRight, MessageSquare, KeyRound, BadgeCheck, Wallet, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import VerificationRing from "@/components/VerificationRing";
import CampaignAnnouncement from "@/components/CampaignAnnouncement";

const steps = [
  { icon: MessageSquare, title: "Connect Discord", copy: "Sign in with the Discord account that's a member of the KiiChain server." },
  { icon: KeyRound, title: "Authorize your wallet", copy: "Grant the portal permission to read your public wallet address only." },
  { icon: BadgeCheck, title: "Role verification", copy: "We confirm your server role directly against Discord — no self-reporting." },
  { icon: Wallet, title: "Wallet stored", copy: "Your address is checked, deduplicated, and saved securely to the registry." },
  { icon: CheckCircle2, title: "Done", copy: "You're on the eligibility list. No forms, no channel spam, no waiting." },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
      <Navbar />

      <section className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-28 pt-16 text-center md:pt-24">
        <span className="eyebrow mb-6">Official verification portal</span>
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.08] text-mist md:text-6xl">
          KiiChain Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-soft to-violet-glow">Verification</span>
        </h1>
        <p className="mt-6 max-w-xl text-balance text-base text-mist/60 md:text-lg">
          Verify your Discord role and securely submit your wallet address for reward eligibility —
          in under a minute, with no copy-pasting into channels.
        </p>

        <div className="mt-8 w-full max-w-md">
          <CampaignAnnouncement />
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link href="/verify" className="btn-primary text-[15px]">
            Verify Now
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#how-it-works" className="btn-secondary text-[15px]">
            How it works
          </a>
        </div>

        {/* Signature element: the verification ring, shown fully progressed and idle on the hero */}
        <div className="mt-20 flex items-center justify-center">
          <VerificationRing progress={5} totalSteps={5} size={260}>
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-violet-soft/70">Eligibility</span>
            <span className="mt-1 font-display text-3xl font-semibold text-mist">Verified</span>
          </VerificationRing>
        </div>
      </section>

      <section id="how-it-works" className="relative mx-auto max-w-6xl px-6 pb-28">
        <div className="mb-12 text-center">
          <span className="eyebrow">The process</span>
          <h2 className="mt-3 font-display text-2xl font-semibold text-mist md:text-3xl">How it works</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, i) => (
            <GlassCard key={step.title} className="group relative flex flex-col items-start gap-4 transition-all duration-300 hover:border-violet-soft/40 hover:-translate-y-1">
              <span className="font-mono text-[11px] text-violet-soft/50">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet/15 text-violet-soft">
                <step.icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div>
                <h3 className="font-display text-sm font-semibold text-mist">{step.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-mist/55">{step.copy}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <footer className="relative mx-auto max-w-6xl px-6 pb-10 text-center font-mono text-[11px] text-mist/30">
        KiiChain Role Verification Portal — not affiliated with Discord Inc.
      </footer>
    </main>
  );
}
