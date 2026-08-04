import Link from "next/link";
import { LayoutDashboard, Users, Megaphone, ShieldCheck, ScrollText } from "lucide-react";
import AdminLogoutButton from "@/components/AdminLogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
      <div className="relative mx-auto flex max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-line px-4 py-6 lg:flex">
          <Link href="/admin" className="mb-8 flex items-center gap-2 px-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet to-violet-glow">
              <ShieldCheck className="h-4 w-4 text-void" />
            </span>
            <span className="font-display text-sm font-semibold text-mist">Admin</span>
          </Link>

          <nav className="flex flex-1 flex-col gap-1">
            <NavItem href="/admin" icon={LayoutDashboard} label="Dashboard" />
            <NavItem href="/admin/submissions" icon={Users} label="Submissions" />
            <NavItem href="/admin/campaigns" icon={Megaphone} label="Campaigns" />
            <NavItem href="/admin/audit" icon={ScrollText} label="Audit log" />
          </nav>

          <AdminLogoutButton />
        </aside>

        <main className="min-h-screen flex-1 px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-display text-[13px] text-mist/60 transition-colors hover:bg-white/[0.04] hover:text-mist"
    >
      <Icon className="h-4 w-4" strokeWidth={1.8} />
      {label}
    </Link>
  );
}
