import Link from "next/link";
import { notFound } from "next/navigation";
import { IconChevronLeft } from "@/components/icons";
import { Avatar, Badge, Card, CardHeader, CaseStatusBadge, Empty, HealthBadge } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { dayOf, daysBetween, formatDate, todayStr } from "@/lib/dates";
import { getStudentProfile, type CalendarDay } from "@/lib/queries";
import { MIN_ATTENDANCE_PCT } from "@/lib/rules/rules";
import type { HealthRecord } from "@/lib/types";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("manager");
  const today = todayStr();
  const profile = getStudentProfile(Number((await params).id), today);
  if (!profile) notFound();
  const { student, health, attendance, absences, cases, calendar } = profile;
  const age = Math.floor(daysBetween(student.dob, today) / 365.25);
  const low = attendance.pct !== null && attendance.pct < MIN_ATTENDANCE_PCT;

  const facts: [string, string][] = [
    ["Admission no.", student.admission_no],
    ["Age", `${age} years (${student.gender === "M" ? "boy" : "girl"})`],
    ["Date of birth", formatDate(student.dob)],
    ["School", student.school],
    ["Dorm", student.room],
    ["At the home since", formatDate(student.admitted_on)],
  ];

  return (
    <>
      <Link href="/manager/students" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
        <IconChevronLeft size={16} /> Children
      </Link>

      <Card className="mt-3 p-6">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={student.name} size="xl" />
          <div className="min-w-0 flex-1">
            <h1 className="text-[26px] font-semibold tracking-tight text-slate-900">{student.name}</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {student.class_name} · {student.room}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Attendance, last 30 days</p>
            <p className={`text-[28px] font-semibold tabular-nums ${low ? "text-amber-600" : "text-slate-900"}`}>
              {attendance.pct === null ? "–" : `${attendance.pct}%`}
            </p>
            <p className="text-xs text-slate-500">
              {attendance.days_present} of {attendance.days_recorded} school days
            </p>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-slate-100 pt-5 sm:grid-cols-3 lg:grid-cols-6">
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-medium text-slate-500">{k}</dt>
              <dd className="mt-0.5 text-sm text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {health && <HealthRecordCard health={health} today={today} />}

      <Card className="mt-6">
        <CardHeader title="Attendance, last 12 weeks" subtitle="Hover a day for details" />
        <div className="overflow-x-auto px-5 py-5">
          <AttendanceCalendar days={calendar} today={today} />
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Absences" subtitle="Last 60 days" />
          {absences.length === 0 ? (
            <Empty>No absences in the last 60 days.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {absences.map((a) => (
                <li key={a.date} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span className="text-slate-600">{formatDate(a.date)}</span>
                  <span className="text-right text-slate-900">
                    {a.illness ? (
                      <>
                        {a.reason}: <span className="font-medium">{a.illness}</span>
                      </>
                    ) : (
                      a.reason
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Health history" />
          {cases.length === 0 ? (
            <Empty>No health cases recorded.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {cases.map((c) => (
                <li key={c.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">{c.illness}</span>
                    <CaseStatusBadge status={c.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Opened {formatDate(dayOf(c.created_at))}
                    {c.status === "resolved" && ` · resolved ${formatDate(dayOf(c.updated_at))}`}
                  </p>
                  {c.notes && <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.notes}</p>}
                </li>
              ))}
            </ul>
          )}
          {low && (
            <div className="border-t border-slate-100 px-5 py-3">
              <Badge tone="amber">Attendance below {MIN_ATTENDANCE_PCT}%</Badge>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function HealthRecordCard({ health, today }: { health: HealthRecord; today: string }) {
  const bmi = health.height_cm && health.weight_kg ? Math.round((10 * health.weight_kg) / (health.height_cm / 100) ** 2) / 10 : null;
  const rows: [string, string][] = [
    ["Blood group", health.blood_group],
    ["Height", health.height_cm ? `${health.height_cm} cm` : "–"],
    ["Weight", health.weight_kg ? `${health.weight_kg} kg` : "–"],
    ["BMI", bmi ? String(bmi) : "–"],
    ["Last check-up", health.last_checkup ? formatDate(health.last_checkup) : "–"],
    ["Allergies", health.allergies || "None known"],
  ];
  const due = health.last_checkup && daysBetween(health.last_checkup, today) > 365;
  return (
    <Card className="mt-6">
      <CardHeader title="Health record" subtitle="From the yearly check-up, updated after each doctor's visit" action={<HealthBadge status={health.status} />} />
      <div className="grid gap-6 px-5 py-5 lg:grid-cols-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:col-span-3">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-medium text-slate-500">{k}</dt>
              <dd className="mt-0.5 text-sm text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="space-y-3 text-sm lg:col-span-2 lg:border-l lg:border-slate-100 lg:pl-6">
          <div>
            <p className="text-xs font-medium text-slate-500">Conditions</p>
            <p className="mt-0.5 text-slate-900">{health.conditions || "None"}</p>
          </div>
          {health.medication && (
            <div>
              <p className="text-xs font-medium text-slate-500">Medication</p>
              <p className="mt-0.5 text-slate-900">{health.medication}</p>
            </div>
          )}
          {health.remarks && (
            <div>
              <p className="text-xs font-medium text-slate-500">Doctor&apos;s remarks</p>
              <p className="mt-0.5 leading-relaxed text-slate-700">{health.remarks}</p>
            </div>
          )}
          {due && <Badge tone="amber">Yearly check-up overdue</Badge>}
        </div>
      </div>
    </Card>
  );
}

const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", ""];

/** Weeks as columns, Monday to Saturday as rows. */
function AttendanceCalendar({ days, today }: { days: CalendarDay[]; today: string }) {
  // Start on a Monday.
  const first = days.findIndex((d) => new Date(`${d.date}T12:00:00`).getDay() === 1);
  const weeks: CalendarDay[][] = [];
  for (let i = first; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const cell = (d: CalendarDay | undefined) => {
    if (!d) return "bg-transparent";
    if (d.date > today) return "bg-transparent";
    if (d.status === "present") return "bg-teal-500";
    if (d.status === "absent") return d.label && !["Family visit", "Festival or function", "Other"].includes(d.label) ? "bg-rose-500" : "bg-amber-400";
    return d.date === today ? "bg-white ring-1 ring-inset ring-slate-300" : "bg-slate-100";
  };
  const title = (d: CalendarDay) =>
    `${formatDate(d.date)}: ${d.status === "present" ? "Present" : d.status === "absent" ? `Absent (${d.label})` : d.date === today ? "Not marked yet" : "No school"}`;

  return (
    <div className="inline-block">
      <div className="flex gap-1.5">
        <div className="flex flex-col gap-1.5 pr-1 pt-5">
          {WEEKDAY_LABELS.map((l, i) => (
            <span key={i} className="h-4 text-[10px] leading-4 text-slate-400">
              {l}
            </span>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={week[0].date} className="flex flex-col gap-1.5">
            <span className="h-3.5 text-[10px] text-slate-400">{Number(week[0].date.slice(8)) <= 7 ? formatDate(week[0].date).split(" ")[1] : ""}</span>
            {week.slice(0, 6).map((d) => (
              <span key={d.date} title={title(d)} className={`h-4 w-4 rounded-[3px] ${cell(d)}`} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <Legend className="bg-teal-500" label="Present" />
        <Legend className="bg-rose-500" label="Absent, unwell" />
        <Legend className="bg-amber-400" label="Absent, other reason" />
        <Legend className="bg-slate-100" label="No school" />
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-[3px] ${className}`} /> {label}
    </span>
  );
}
