import { requireRole } from "@/lib/auth";
import { listClasses, listStudents } from "@/lib/queries";

// Basic details only. The warden does not see attendance history, alerts or
// health cases.
export default async function WardenStudentsPage() {
  await requireRole("warden");
  const classes = listClasses();

  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900">Students</h1>
      {classes.map((c) => {
        const students = listStudents(c);
        return (
          <section key={c} className="mt-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {c} · {students.length}
            </h2>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {students.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-base font-medium text-slate-900">{s.name}</span>
                  <span className="text-sm text-slate-500">{s.room}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
