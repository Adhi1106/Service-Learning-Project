import { CaseCard } from "@/components/manager/CaseCard";
import { PageTitle } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { todayStr } from "@/lib/dates";
import { listCases } from "@/lib/queries";
import { CASE_STATUSES, CASE_STATUS_LABEL } from "@/lib/types";

const DOT = { open: "bg-red-500", scheduled: "bg-amber-500", under_treatment: "bg-sky-500", resolved: "bg-emerald-500" } as const;

export default async function CasesPage() {
  await requireRole("manager");
  const today = todayStr();
  const cases = listCases();

  return (
    <>
      <PageTitle
        title="Health cases"
        subtitle="A case opens automatically when a child is absent with the same illness 3 times in 30 days. Follow it until it is resolved."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {CASE_STATUSES.map((status) => {
          const inColumn = cases.filter((c) => c.status === status);
          return (
            <section key={status} className="rounded-xl bg-slate-100/70 p-3">
              <h2 className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold text-slate-700">
                <span className={`h-2 w-2 rounded-full ${DOT[status]}`} />
                {CASE_STATUS_LABEL[status]}
                <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs tabular-nums text-slate-500">{inColumn.length}</span>
              </h2>
              <div className="space-y-3">
                {inColumn.length === 0 && <p className="px-1 py-8 text-center text-sm text-slate-400">No cases</p>}
                {inColumn.map((c) => (
                  <CaseCard key={`${c.id}-${c.status}-${c.updated_at}`} c={c} today={today} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
