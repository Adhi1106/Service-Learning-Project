import Link from "next/link";
import { AbsenceChart } from "@/components/manager/AbsenceChart";
import { ResetButton } from "@/components/manager/ResetButton";
import { Badge, Card, Empty, PageTitle, SeverityBadge, StatCard, qty } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { formatDate, todayStr } from "@/lib/dates";
import { getDashboard } from "@/lib/queries";

export default async function DashboardPage() {
  await requireRole("manager");
  const today = todayStr();
  const d = getDashboard(today);
  const totalAlerts = d.openAlerts.critical + d.openAlerts.warning;
  const maxReason = Math.max(1, ...d.reasons.map((r) => r.count));

  return (
    <>
      <PageTitle title="Dashboard" subtitle={formatDate(today)}>
        <ResetButton />
      </PageTitle>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Attendance today"
          value={d.today.recorded ? `${d.today.present}/${d.today.recorded}` : "Not yet"}
          detail={d.today.recorded ? `${d.today.absent} absent · ${d.students - d.today.recorded} not marked` : `${d.students} children to mark`}
        />
        <StatCard
          label="Alerts to review"
          value={totalAlerts}
          tone={d.openAlerts.critical ? "red" : totalAlerts ? "amber" : "green"}
          detail={`${d.openAlerts.critical} critical · ${d.openAlerts.warning} warning`}
        />
        <StatCard label="Open health cases" value={d.openCases} tone={d.openCases ? "red" : "green"} detail="Not yet resolved" />
        <StatCard label="Stock needing attention" value={d.lowStock.length} tone={d.lowStock.length ? "amber" : "green"} detail="Low or expiring" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Children absent per school day</h2>
          <p className="mb-4 text-sm text-slate-500">Last 30 days. Days with 3 or more absences are highlighted.</p>
          <AbsenceChart days={d.chart} />
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-slate-900">Why children were absent</h2>
          <p className="mb-4 text-sm text-slate-500">Last 30 days</p>
          {d.reasons.length === 0 ? (
            <Empty>No absences recorded.</Empty>
          ) : (
            <ul className="space-y-2.5">
              {d.reasons.map((r) => (
                <li key={r.name}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">{r.name}</span>
                    <span className="tabular-nums text-slate-900">{r.count}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-teal-600" style={{ width: `${(r.count / maxReason) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Alerts to review</h2>
            <Link href="/manager/alerts" className="text-sm font-medium text-teal-800 hover:underline">
              See all
            </Link>
          </div>
          {d.recentAlerts.length === 0 ? (
            <Empty>Nothing needs attention right now.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {d.recentAlerts.map((a) => (
                <li key={a.id} className="flex items-start gap-3 py-3">
                  <SeverityBadge severity={a.severity} />
                  <p className="text-sm text-slate-800">{a.message}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Stock needing attention</h2>
            <Link href="/manager/stock" className="text-sm font-medium text-teal-800 hover:underline">
              See all stock
            </Link>
          </div>
          {d.lowStock.length === 0 ? (
            <Empty>All items are above their minimum level.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {d.lowStock.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{i.name}</p>
                    <p className="text-sm text-slate-600">
                      {qty(i.balance)} {i.unit} left · minimum {qty(i.min_level)}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {i.is_low && <Badge tone="amber">Low</Badge>}
                    {i.is_expiring && i.expiry_date && <Badge tone="red">Expires {formatDate(i.expiry_date)}</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
