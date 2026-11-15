import { formatDate } from "@/lib/dates";
import type { DayPoint } from "@/lib/queries";

/** Bar chart: how many children were absent on each recorded school day. */
export function AbsenceChart({ days }: { days: DayPoint[] }) {
  if (days.length === 0) return <p className="py-10 text-center text-sm text-slate-500">No attendance recorded yet.</p>;
  const peak = Math.max(...days.map((d) => d.total - d.present));
  const top = Math.max(4, Math.ceil(peak / 2) * 2);
  const ticks = [top, top / 2, 0];
  const avgPct = Math.round((10 * days.reduce((s, d) => s + d.pct, 0)) / days.length) / 10;

  return (
    <div>
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">{avgPct}%</span>
        <span className="text-sm text-slate-500">average attendance over {days.length} school days</span>
      </div>
      <div className="flex gap-3">
        <div className="flex h-44 flex-col justify-between pb-0 text-right text-[11px] tabular-nums text-slate-400" aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1.5 leading-none">
              {t}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden>
            {ticks.map((t) => (
              <div key={t} className={`border-t ${t === 0 ? "border-slate-300" : "border-dashed border-slate-200"}`} />
            ))}
          </div>
          <div className="relative flex h-44 items-end gap-[3px]" role="img" aria-label="Children absent on each school day over the last 30 days">
            {days.map((d) => {
              const absent = d.total - d.present;
              return (
                <div key={d.date} className="group relative flex h-full flex-1 items-end">
                  <div
                    className={`w-full rounded-t-[3px] transition-colors ${absent >= 3 ? "bg-amber-400 group-hover:bg-amber-500" : "bg-teal-500/80 group-hover:bg-teal-600"}`}
                    style={{ height: `${absent === 0 ? 0 : Math.max((absent / top) * 100, 3)}%` }}
                  />
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow group-hover:block">
                    {formatDate(d.date)}: {absent} absent of {d.total}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-between pl-7 text-xs text-slate-400">
        <span>{formatDate(days[0].date)}</span>
        <span>{formatDate(days[days.length - 1].date)}</span>
      </div>
      <div className="mt-3 flex gap-4 pl-7 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-teal-500/80" /> Children absent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> 3 or more absent
        </span>
      </div>
    </div>
  );
}
