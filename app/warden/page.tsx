import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { formatDate, todayStr } from "@/lib/dates";
import { getDb } from "@/lib/db";
import { listClasses } from "@/lib/queries";

export default async function WardenHome() {
  await requireRole("warden");
  const today = todayStr();
  const db = getDb();
  const classes = listClasses().map((name) => {
    const row = db
      .prepare(
        `SELECT COUNT(s.id) AS total, COUNT(a.id) AS marked
           FROM students s LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
          WHERE s.class_name = ?`,
      )
      .get(today, name) as { total: number; marked: number };
    return { name, ...row, done: row.marked === row.total };
  });

  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900">Today</h1>
      <p className="text-sm text-slate-600">{formatDate(today)}</p>

      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Attendance</h2>
      <div className="space-y-3">
        {classes.map((c) => (
          <Link
            key={c.name}
            href={`/warden/attendance?class=${encodeURIComponent(c.name)}`}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm active:bg-slate-50"
          >
            <div>
              <p className="text-base font-semibold text-slate-900">{c.name}</p>
              <p className="text-sm text-slate-600">{c.total} children</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${c.done ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}
            >
              {c.done ? "Marked" : "Not marked"}
            </span>
          </Link>
        ))}
      </div>

      <h2 className="mb-2 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">Stock</h2>
      <Link href="/warden/stock" className="block rounded-xl bg-teal-700 px-4 py-4 text-center text-base font-semibold text-white active:bg-teal-800">
        Record stock in or out
      </Link>
    </>
  );
}
