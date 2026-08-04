import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";

export default function SuccessPage() {
  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
      <Navbar />
      <section className="relative mx-auto flex max-w-md flex-col items-center px-6 pb-24 pt-16 text-center">
        <div className="mb-6 flex h-16 w-16 animate-float items-center justify-center rounded-full bg-violet/15 shadow-glow-sm">
          <CheckCircle2 className="h-8 w-8 text-violet-soft" strokeWidth={1.8} />
        </div>
        <GlassCard className="w-full py-9">
          <h1 className="font-display text-xl font-semibold text-mist">You&apos;re verified</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-mist/55">
            Your wallet is linked and your role has been confirmed. No further action needed —
            rewards are distributed directly to the address you submitted.
          </p>
          <Link href="/profile" className="btn-primary mt-7 inline-flex w-full justify-center">
            View my profile
          </Link>
        </GlassCard>
      </section>
    </main>
  );
}
