import { Avatar } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { listClasses, listStudents } from "@/lib/queries";

// Basic details only. The warden does not see attendance history, alerts or
// health cases.
export default async function WardenStudentsPage() {
  await requireRole("warden");
  const classes = listClasses();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Children</h1>
      {classes.map((c) => {
        const students = listStudents(c);
        return (
          <section key={c} className="mt-6">
            <h2 className="mb-2 flex items-baseline justify-between text-sm font-semibold text-slate-900">
              {c}
              <span className="text-sm font-normal text-slate-500">{students.length} children</span>
            </h2>
            <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
              {students.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={s.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.room}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
