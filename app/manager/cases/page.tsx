import { CaseCard } from "@/components/manager/CaseCard";
import { PageTitle } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { listCases } from "@/lib/queries";
import { CASE_STATUSES, CASE_STATUS_LABEL } from "@/lib/types";

export default async function CasesPage() {
  await requireRole("manager");
  const cases = listCases();

  return (
    <>
      <PageTitle
        title="Health cases"
        subtitle="A case opens automatically when a child is absent for the same illness 3 times in 30 days. Follow it until it is resolved."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {CASE_STATUSES.map((status) => {
          const inColumn = cases.filter((c) => c.status === status);
          return (
            <section key={status} className="rounded-xl bg-slate-100 p-3">
              <h2 className="mb-3 flex items-center justify-between px-1 text-sm font-semibold text-slate-700">
                {CASE_STATUS_LABEL[status]}
                <span className="rounded-full bg-white px-2 py-0.5 text-xs tabular-nums text-slate-600">{inColumn.length}</span>
              </h2>
              <div className="space-y-3">
                {inColumn.length === 0 && <p className="px-1 py-6 text-center text-sm text-slate-500">None</p>}
                {inColumn.map((c) => (
                  <CaseCard key={`${c.id}-${c.status}-${c.updated_at}`} c={c} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
