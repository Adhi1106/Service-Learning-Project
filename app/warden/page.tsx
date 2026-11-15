import Link from "next/link";
import { IconArrowIn, IconArrowOut, IconCheck, IconChevronRight } from "@/components/icons";
import { amount } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { formatLongDate, relativeDay, todayStr } from "@/lib/dates";
import { getDb } from "@/lib/db";
import { listClasses, recentStockEntries } from "@/lib/queries";

function greeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export default async function WardenHome() {
  const user = await requireRole("warden");
  const today = todayStr();
  const db = getDb();
  const classes = listClasses().map((name) => {
    const row = db
      .prepare(
        `SELECT COUNT(s.id) AS total, COUNT(a.id) AS marked, COALESCE(SUM(a.status = 'absent'), 0) AS absent
           FROM students s LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
          WHERE s.class_name = ?`,
      )
      .get(today, name) as { total: number; marked: number; absent: number };
    return { name, ...row, done: row.marked === row.total };
  });
  const done = classes.filter((c) => c.done).length;
  const mine = recentStockEntries(4, user.id);

  return (
    <>
      <p className="text-sm text-slate-500">{formatLongDate(today)}</p>
      <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-900">
        {greeting()}, {user.name.split(" ")[0]}
      </h1>

      <section className="mt-6">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Today&apos;s attendance</h2>
          <span className="text-sm text-slate-500">
            {done} of {classes.length} classes done
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {classes.map((c, i) => (
            <Link
              key={c.name}
              href={`/warden/attendance?class=${encodeURIComponent(c.name)}`}
              className={`flex items-center gap-3 px-4 py-4 active:bg-slate-50 ${i ? "border-t border-slate-100" : ""}`}
            >
              <span
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  c.done ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {c.done ? <IconCheck size={18} /> : c.name.split(" ")[1]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{c.name}</p>
                <p className="text-sm text-slate-500">
                  {c.done ? `${c.total - c.absent} present · ${c.absent} absent` : `${c.total} children · not marked yet`}
                </p>
              </div>
              <IconChevronRight size={18} className="text-slate-400" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Stores</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/warden/stock?type=out" className="rounded-2xl bg-teal-700 px-4 py-4 text-white shadow-sm active:bg-teal-800">
            <IconArrowOut size={20} />
            <p className="mt-3 font-semibold">Issue stock</p>
            <p className="text-sm text-teal-100">Kitchen, dorms, sick room</p>
          </Link>
          <Link href="/warden/stock?type=in" className="rounded-2xl border border-slate-200 bg-white px-4 py-4 active:bg-slate-50">
            <IconArrowIn size={20} className="text-teal-700" />
            <p className="mt-3 font-semibold text-slate-900">Receive stock</p>
            <p className="text-sm text-slate-500">Deliveries, donations</p>
          </Link>
        </div>
      </section>

      {mine.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Your recent entries</h2>
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {mine.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="min-w-0 truncate text-slate-800">
                  {t.type === "in" ? "Received" : "Issued"} {amount(t.quantity, t.unit)} {t.item}
                </span>
                <span className="shrink-0 text-xs text-slate-400">{relativeDay(t.date, today)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
