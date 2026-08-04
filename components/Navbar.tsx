import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function Navbar() {
  return (
    <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet to-violet-glow shadow-glow-sm">
          <ShieldCheck className="h-4.5 w-4.5 text-void" strokeWidth={2.5} size={18} />
        </span>
        <span className="font-display text-[15px] font-semibold tracking-tight text-mist">
          KiiChain <span className="text-violet-soft">Verify</span>
        </span>
      </Link>
      <nav className="flex items-center gap-6 font-mono text-xs uppercase tracking-wider text-mist/50">
        <Link href="/verify" className="transition-colors hover:text-violet-soft">
          Verify
        </Link>
        <Link href="/profile" className="transition-colors hover:text-violet-soft">
          Profile
        </Link>
      </nav>
    </header>
  );
}
