import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CaseStatusBadge, Empty, PageTitle, StatCard } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { daysBetween, formatDate, todayStr } from "@/lib/dates";
import { getStudentProfile } from "@/lib/queries";
import { MIN_ATTENDANCE_PCT } from "@/lib/rules/rules";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("manager");
  const today = todayStr();
  const profile = getStudentProfile(Number((await params).id), today);
  if (!profile) notFound();
  const { student, attendance, absences, cases } = profile;
  const age = Math.floor(daysBetween(student.dob, today) / 365.25);

  return (
    <>
      <Link href="/manager/students" className="text-sm font-medium text-teal-800 hover:underline">
        ← All students
      </Link>
      <div className="mt-2">
        <PageTitle title={student.name} subtitle={`${student.class_name} · ${student.room} · ${age} years old`} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Attendance, last 30 days"
          value={attendance.pct === null ? "No records" : `${attendance.pct}%`}
          tone={attendance.pct !== null && attendance.pct < MIN_ATTENDANCE_PCT ? "amber" : "green"}
          detail={`${attendance.days_present} of ${attendance.days_recorded} school days`}
        />
        <StatCard label="Absences, last 60 days" value={absences.length} />
        <StatCard label="Health cases" value={cases.length} detail={`${cases.filter((c) => c.status !== "resolved").length} not yet resolved`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Absences</h2>
          {absences.length === 0 ? (
            <Empty>No absences in the last 60 days.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {absences.map((a) => (
                <li key={a.date} className="flex justify-between gap-3 py-2.5 text-sm">
                  <span className="text-slate-600">{formatDate(a.date)}</span>
                  <span className="text-right text-slate-900">{a.illness ? `${a.reason}: ${a.illness}` : a.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Health cases</h2>
          {cases.length === 0 ? (
            <Empty>No health cases.</Empty>
          ) : (
            <ul className="space-y-3">
              {cases.map((c) => (
                <li key={c.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">{c.illness}</span>
                    <CaseStatusBadge status={c.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Opened {formatDate(c.created_at)}</p>
                  {c.notes && <p className="mt-2 text-sm text-slate-700">{c.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
