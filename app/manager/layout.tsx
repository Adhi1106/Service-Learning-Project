import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { NavLinks } from "@/components/NavLinks";
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
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row">
      <aside className="border-b border-slate-200 bg-white px-4 py-4 md:w-60 md:shrink-0 md:border-b-0 md:border-r md:py-6">
        <div className="mb-4 flex items-center justify-between md:mb-6 md:block">
          <Link href="/manager" className="text-xl font-semibold tracking-tight text-teal-800">
            CareTrack
          </Link>
          <p className="text-xs text-slate-500 md:mt-1">{user.name}</p>
        </div>
        <NavLinks
          variant="side"
          items={[
            { href: "/manager", label: "Dashboard" },
            { href: "/manager/alerts", label: "Alerts", badge: openAlerts },
            { href: "/manager/cases", label: "Health cases", badge: openCases },
            { href: "/manager/stock", label: "Stock" },
            { href: "/manager/students", label: "Students" },
          ]}
        />
        <LogoutButton className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 md:mt-8" />
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
