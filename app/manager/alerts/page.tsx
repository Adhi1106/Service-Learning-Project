import Link from "next/link";
import { AlertActions } from "@/components/manager/AlertActions";
import { AlertStatusBadge, Card, Empty, PageTitle, SeverityBadge } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { listAlerts } from "@/lib/queries";
import { RULE_LABEL } from "@/lib/types";

export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireRole("manager");
  const showResolved = (await searchParams).show === "all";
  const all = listAlerts();
  const active = all.filter((a) => a.status !== "resolved");
  const shown = showResolved ? all : active;

  return (
    <>
      <PageTitle title="Alerts" subtitle={`${active.length} to review. Raised automatically by the three rules.`}>
        <Link
          href={showResolved ? "/manager/alerts" : "/manager/alerts?show=all"}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          {showResolved ? "Hide resolved" : `Show resolved (${all.length - active.length})`}
        </Link>
      </PageTitle>

      {shown.length === 0 ? (
        <Empty>Nothing needs attention right now.</Empty>
      ) : (
        <div className="space-y-3">
          {shown.map((a) => (
            <Card key={a.id} className={`p-4 ${a.severity === "critical" && a.status !== "resolved" ? "border-l-4 border-l-red-600" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={a.severity} />
                    <AlertStatusBadge status={a.status} />
                    <span className="text-sm font-medium text-slate-700">{RULE_LABEL[a.rule]}</span>
                    <span className="text-sm text-slate-500">· {formatDate(a.created_at)}</span>
                  </div>
                  <p className="mt-2 text-slate-900">{a.message}</p>
                  <p className="mt-2 text-sm">
                    {a.student_id && (
                      <Link href={`/manager/students/${a.student_id}`} className="font-medium text-teal-800 hover:underline">
                        Open {a.student_name}&apos;s profile
                      </Link>
                    )}
                    {a.rule === "repeated_illness" && (
                      <>
                        {" · "}
                        <Link href="/manager/cases" className="font-medium text-teal-800 hover:underline">
                          Go to health cases
                        </Link>
                      </>
                    )}
                    {a.item_id && (
                      <Link href="/manager/stock" className="font-medium text-teal-800 hover:underline">
                        Open stock
                      </Link>
                    )}
                  </p>
                </div>
                <AlertActions id={a.id} status={a.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
