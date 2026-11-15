import Link from "next/link";
import { Brand } from "@/components/Brand";
import { IconBell, IconBox, IconDashboard, IconHeart, IconUsers } from "@/components/icons";
import { LogoutButton } from "@/components/LogoutButton";
import { NavLinks } from "@/components/NavLinks";
import { Avatar } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getDb } from "@/lib/db";

// Everything under /manager is for the manager only.
export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("manager");
  const db = getDb();
  const count = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  const openAlerts = count("SELECT COUNT(*) AS n FROM alerts WHERE status = 'open'");
  const openCases = count("SELECT COUNT(*) AS n FROM health_cases WHERE status <> 'resolved'");

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-slate-200 bg-white md:w-64 md:shrink-0 md:border-b-0 md:border-r">
        <div className="md:sticky md:top-0 md:flex md:h-screen md:flex-col">
        <div className="flex items-center justify-between px-4 pb-3 pt-4 md:px-5 md:pb-6 md:pt-6">
          <Link href="/manager">
            <Brand />
          </Link>
          <LogoutButton iconOnly className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden" />
        </div>
        <div className="px-3 pb-3 md:flex-1 md:pb-0">
          <NavLinks
            variant="side"
            items={[
              { href: "/manager", label: "Dashboard", icon: <IconDashboard size={18} /> },
              { href: "/manager/alerts", label: "Alerts", icon: <IconBell size={18} />, badge: openAlerts },
              { href: "/manager/cases", label: "Health cases", icon: <IconHeart size={18} />, badge: openCases },
              { href: "/manager/students", label: "Children", icon: <IconUsers size={18} /> },
              { href: "/manager/stock", label: "Stock", icon: <IconBox size={18} /> },
            ]}
          />
        </div>
        <div className="hidden border-t border-slate-100 p-3 md:block">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar name={user.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">Manager</p>
            </div>
            <LogoutButton iconOnly className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" />
          </div>
        </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
