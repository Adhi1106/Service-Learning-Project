import { StudentsTable } from "@/components/manager/StudentsTable";
import { PageTitle } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { attendancePercentages, listClasses, listStudents } from "@/lib/queries";
import { MIN_ATTENDANCE_PCT } from "@/lib/rules/rules";

export default async function StudentsPage() {
  await requireRole("manager");
  const pct = attendancePercentages();
  const students = listStudents()
    .map((s) => ({ ...s, pct: pct.get(s.id) ?? null }))
    .sort((a, b) => a.class_name.localeCompare(b.class_name) || a.name.localeCompare(b.name));

  return (
    <>
      <PageTitle title="Children" subtitle={`${students.length} children living at the home`} />
      <StudentsTable students={students} classes={listClasses()} minPct={MIN_ATTENDANCE_PCT} />
    </>
  );
}
