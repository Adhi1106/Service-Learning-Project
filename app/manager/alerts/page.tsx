import Link from "next/link";
import { IconBox, IconCheck } from "@/components/icons";
import { AlertActions } from "@/components/manager/AlertActions";
import { AlertStatusBadge, Avatar, Card, Empty, PageTitle, SeverityBadge } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { formatDate, todayStr, whenPhrase } from "@/lib/dates";
import { withoutSubject } from "@/lib/format";
import { listAlerts } from "@/lib/queries";
import { RULE_LABEL } from "@/lib/types";

export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireRole("manager");
  const today = todayStr();
  const showResolved = (await searchParams).show === "resolved";
  const all = listAlerts();
  const active = all.filter((a) => a.status !== "resolved");
  const resolved = all.filter((a) => a.status === "resolved");
  const shown = showResolved ? resolved : active;

  const tab = (selected: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${selected ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`;

  return (
    <>
      <PageTitle title="Alerts" subtitle="Raised automatically when attendance or stock entries match one of the three rules." />

      <div className="mb-4 inline-flex rounded-lg bg-slate-100 p-1">
        <Link href="/manager/alerts" className={tab(!showResolved)}>
          To review <span className="ml-1 tabular-nums text-slate-500">{active.length}</span>
        </Link>
        <Link href="/manager/alerts?show=resolved" className={tab(showResolved)}>
          Resolved <span className="ml-1 tabular-nums text-slate-500">{resolved.length}</span>
        </Link>
      </div>

      <Card>
        {shown.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <IconCheck size={20} />
            </span>
            <Empty>{showResolved ? "No resolved alerts yet." : "You're all caught up. Nothing needs review."}</Empty>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {shown.map((a) => (
              <li key={a.id} className="relative flex flex-wrap items-start gap-4 px-5 py-4">
                {a.severity === "critical" && a.status !== "resolved" && <span className="absolute inset-y-0 left-0 w-1 bg-red-500" aria-hidden />}
                {a.student_name ? (
                  <Avatar name={a.student_name} size="lg" />
                ) : (
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <IconBox size={20} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {a.student_id ? (
                      <Link href={`/manager/students/${a.student_id}`} className="font-semibold text-slate-900 hover:underline">
                        {a.student_name}
                      </Link>
                    ) : (
                      <Link href="/manager/stock" className="font-semibold text-slate-900 hover:underline">
                        {a.item_name}
                      </Link>
                    )}
                    <SeverityBadge severity={a.severity} />
                    <span className="text-sm text-slate-500">{RULE_LABEL[a.rule]}</span>
                  </div>
                  <p className="mt-1 text-[15px] text-slate-700">{withoutSubject(a.message, a.item_name)}</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Raised {whenPhrase(a.created_at, today)}</span>
                    {a.status !== "open" && <AlertStatusBadge status={a.status} />}
                    {a.resolved_at && <span>on {formatDate(a.resolved_at)}</span>}
                    {a.rule === "repeated_illness" && a.status !== "resolved" && (
                      <Link href="/manager/cases" className="font-medium text-teal-700 hover:underline">
                        View health case
                      </Link>
                    )}
                  </p>
                </div>
                <AlertActions id={a.id} status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
