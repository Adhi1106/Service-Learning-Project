import { formatDate } from "@/lib/dates";
import type { DayPoint } from "@/lib/queries";

/** Bar chart: how many children were absent on each recorded school day. */
export function AbsenceChart({ days }: { days: DayPoint[] }) {
  if (days.length === 0) return <p className="py-10 text-center text-sm text-slate-500">No attendance recorded yet.</p>;
  const max = Math.max(3, ...days.map((d) => d.total - d.present));

  return (
    <div>
      <div className="flex h-40 items-end gap-1" role="img" aria-label="Children absent per school day over the last 30 days">
        {days.map((d) => {
          const absent = d.total - d.present;
          return (
            <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end" title={`${formatDate(d.date)}: ${absent} absent of ${d.total}`}>
              <span className="mb-1 text-center text-[10px] tabular-nums text-slate-500">{absent || ""}</span>
              <div
                className={`w-full rounded-t ${absent >= 3 ? "bg-amber-500" : "bg-teal-600"}`}
                style={{ height: `${Math.max((absent / max) * 100, absent ? 4 : 1)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-xs text-slate-500">
        <span>{formatDate(days[0].date)}</span>
        <span>{formatDate(days[days.length - 1].date)}</span>
      </div>
    </div>
  );
}
