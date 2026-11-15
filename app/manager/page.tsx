import Link from "next/link";
import { AbsenceChart } from "@/components/manager/AbsenceChart";
import { IconArrowIn, IconArrowOut, IconBell, IconBox, IconChevronRight, IconClipboard, IconHeart } from "@/components/icons";
import { Avatar, Badge, Card, CardHeader, Empty, SeverityBadge, StatCard, amount } from "@/components/ui";
import { withoutSubject } from "@/lib/format";
import { requireRole } from "@/lib/auth";
import { formatDate, formatLongDate, relativeDay, todayStr, whenPhrase } from "@/lib/dates";
import { getDashboard, healthSummary, listCases, recentActivity } from "@/lib/queries";
import { CASE_STATUS_LABEL, HEALTH_STATUS_LABEL, type CaseStatus, type HealthStatus } from "@/lib/types";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await requireRole("manager");
  const today = todayStr();
  const d = getDashboard(today);
  const activity = recentActivity(7);
  const totalAlerts = d.openAlerts.critical + d.openAlerts.warning;
  const maxReason = Math.max(1, ...d.reasons.map((r) => r.count));
  const firstName = user.name.split(" ")[0];
  const presentPct = d.today.recorded ? Math.round((100 * d.today.present) / d.today.recorded) : 0;

  return (
    <>
      <div className="mb-7">
        <h1 className="text-[26px] font-semibold tracking-tight text-slate-900">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{formatLongDate(today)} · Grace and Light Trust, Hoskote</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Attendance today"
          icon={<IconClipboard size={18} />}
          tone="teal"
          value={d.today.recorded ? `${d.today.present} / ${d.today.recorded}` : "Not marked"}
          detail={
            d.today.recorded
              ? `${d.today.absent} absent · ${d.classes.marked} of ${d.classes.total} classes marked`
              : `${d.students} children · ${d.classes.total} classes to mark`
          }
        >
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal-500" style={{ width: `${d.today.recorded ? presentPct : 0}%` }} />
          </div>
        </StatCard>
        <StatCard
          label="Alerts to review"
          icon={<IconBell size={18} />}
          tone={d.openAlerts.critical ? "red" : totalAlerts ? "amber" : "green"}
          value={totalAlerts}
          detail={
            <>
              <span className={d.openAlerts.critical ? "font-medium text-red-600" : ""}>{d.openAlerts.critical} critical</span> ·{" "}
              {d.openAlerts.warning} warning
            </>
          }
        />
        <StatCard
          label="Open health cases"
          icon={<IconHeart size={18} />}
          tone={d.openCases ? "red" : "green"}
          value={d.openCases}
          detail={
            [
              d.cases.open && `${d.cases.open} new`,
              d.cases.scheduled && `${d.cases.scheduled} scheduled`,
              d.cases.under_treatment && `${d.cases.under_treatment} in treatment`,
            ]
              .filter(Boolean)
              .join(" · ") || "None open"
          }
        />
        <StatCard
          label="Stock needing attention"
          icon={<IconBox size={18} />}
          tone={d.lowStock.length ? "amber" : "green"}
          value={d.lowStock.length}
          detail="Items low or expiring"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Absences" subtitle="Children absent on each school day, last 30 days" />
          <div className="px-5 pb-5 pt-4">
            <AbsenceChart days={d.chart} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Reasons for absence" subtitle="Last 30 days" />
          <div className="px-5 py-4">
            {d.reasons.length === 0 ? (
              <Empty>No absences recorded.</Empty>
            ) : (
              <ul className="space-y-3">
                {d.reasons.slice(0, 8).map((r) => (
                  <li key={r.name}>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700">{r.name}</span>
                      <span className="font-medium tabular-nums text-slate-900">{r.count}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${(r.count / maxReason) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Needs your attention"
            action={
              <Link href="/manager/alerts" className="flex items-center gap-0.5 text-sm font-medium text-teal-700 hover:text-teal-800">
                All alerts <IconChevronRight size={16} />
              </Link>
            }
          />
          {d.recentAlerts.length === 0 ? (
            <Empty>Nothing needs attention right now.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {d.recentAlerts.map((a) => (
                <li key={a.id}>
                  <Link href={a.student_id ? `/manager/students/${a.student_id}` : "/manager/stock"} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50">
                    {a.student_name ? (
                      <Avatar name={a.student_name} size="md" />
                    ) : (
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                        <IconBox size={18} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-900">{a.student_name ?? a.item_name}</span>
                        <SeverityBadge severity={a.severity} />
                        {a.status === "acknowledged" && <Badge tone="slate">Acknowledged</Badge>}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-600">{withoutSubject(a.message, a.item_name)}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">{relativeDay(a.created_at, today)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Stock running low"
            action={
              <Link href="/manager/stock" className="flex items-center gap-0.5 text-sm font-medium text-teal-700 hover:text-teal-800">
                Stock <IconChevronRight size={16} />
              </Link>
            }
          />
          {d.lowStock.length === 0 ? (
            <Empty>Everything is above its minimum level.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {d.lowStock.map((i) => (
                <li key={i.id} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">{i.name}</p>
                    {i.is_low ? <Badge tone="amber">Low</Badge> : <Badge tone="red">Expiring</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {amount(i.balance, i.unit)} left · min {amount(i.min_level, i.unit)}
                    {i.is_expiring && i.expiry_date && ` · expires ${formatDate(i.expiry_date)}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent activity" subtitle="Entries made by staff" />
          <ul className="divide-y divide-slate-100">
            {activity.map((a) => (
              <li key={a.key} className="flex items-center gap-3 px-5 py-3">
                {a.kind === "attendance" ? (
                  <>
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                      <IconClipboard size={16} />
                    </span>
                    <p className="min-w-0 flex-1 text-sm text-slate-700">
                      <span className="font-medium text-slate-900">{a.by ?? "Staff"}</span> marked attendance for{" "}
                      <span className="font-medium text-slate-900">{a.className}</span>
                      <span className="text-slate-500">
                        {" "}
                        · {a.total - a.absent} present, {a.absent} absent
                      </span>
                    </p>
                  </>
                ) : (
                  <>
                    <span
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        a.entry.type === "in" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {a.entry.type === "in" ? <IconArrowIn size={16} /> : <IconArrowOut size={16} />}
                    </span>
                    <p className="min-w-0 flex-1 text-sm text-slate-700">
                      <span className="font-medium text-slate-900">{a.entry.by ?? "Staff"}</span>{" "}
                      {a.entry.type === "in" ? "received" : "issued"}{" "}
                      <span className="font-medium text-slate-900">
                        {amount(a.entry.quantity, a.entry.unit)} {a.entry.item}
                      </span>
                      {a.entry.note && <span className="text-slate-500"> · {a.entry.note}</span>}
                    </p>
                  </>
                )}
                <span className="shrink-0 text-xs text-slate-400">{relativeDay(a.date, today)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Health cases"
            action={
              <Link href="/manager/cases" className="flex items-center gap-0.5 text-sm font-medium text-teal-700 hover:text-teal-800">
                Board <IconChevronRight size={16} />
              </Link>
            }
          />
          <HealthCaseList today={today} />
          <HealthOverview />
        </Card>
      </div>
    </>
  );
}


function HealthOverview() {
  const summary = healthSummary();
  const dot: Record<HealthStatus, string> = { healthy: "bg-emerald-500", minor: "bg-sky-500", frequent: "bg-amber-500", ongoing: "bg-rose-500" };
  return (
    <div className="border-t border-slate-100 px-5 py-4">
      <p className="mb-2 text-xs font-medium text-slate-500">Children by health record</p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {(Object.keys(summary) as HealthStatus[]).map((s) => (
          <li key={s} className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${dot[s]}`} />
            <span className="flex-1 text-slate-600">{HEALTH_STATUS_LABEL[s]}</span>
            <span className="font-medium tabular-nums text-slate-900">{summary[s]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HealthCaseList({ today }: { today: string }) {
  const active = listCases().filter((c) => c.status !== "resolved");
  if (active.length === 0) return <Empty>No open health cases.</Empty>;
  const tone = (s: CaseStatus) => (s === "open" ? "red" : "amber");
  return (
    <ul className="divide-y divide-slate-100">
      {active.map((c) => (
        <li key={c.id}>
          <Link href={`/manager/students/${c.student_id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50">
            <Avatar name={c.student_name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{c.student_name}</p>
              <p className="text-sm text-slate-500">
                {c.illness} · opened {whenPhrase(c.created_at, today)}
              </p>
            </div>
            <Badge tone={tone(c.status)}>{CASE_STATUS_LABEL[c.status]}</Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}
