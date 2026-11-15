import Link from "next/link";
import { Badge, Card, PageTitle } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { attendancePercentages, listStudents } from "@/lib/queries";
import { MIN_ATTENDANCE_PCT } from "@/lib/rules/rules";

export default async function StudentsPage() {
  await requireRole("manager");
  const students = listStudents();
  const pct = attendancePercentages();

  return (
    <>
      <PageTitle title="Students" subtitle={`${students.length} children. Attendance is for the last 30 days.`} />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Class</th>
              <th className="px-4 py-3 font-medium">Room</th>
              <th className="px-4 py-3 text-right font-medium">Attendance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s) => {
              const p = pct.get(s.id) ?? null;
              return (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/manager/students/${s.id}`} className="font-medium text-teal-800 hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.class_name}</td>
                  <td className="px-4 py-3 text-slate-600">{s.room}</td>
                  <td className="px-4 py-3 text-right">
                    {p === null ? <span className="text-slate-400">No records</span> : <Badge tone={p < MIN_ATTENDANCE_PCT ? "amber" : "green"}>{p}%</Badge>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
