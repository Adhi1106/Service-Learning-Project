import { Badge, Card, PageTitle, qty } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { formatDate, todayStr } from "@/lib/dates";
import { listItems, recentStockEntries } from "@/lib/queries";

export default async function StockPage() {
  await requireRole("manager");
  const items = listItems(todayStr());
  const recent = recentStockEntries(10);

  return (
    <>
      <PageTitle title="Stock" subtitle="Balances update automatically each time the warden records stock in or out." />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">In stock</th>
              <th className="px-4 py-3 text-right font-medium">Minimum</th>
              <th className="px-4 py-3 font-medium">Expiry</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((i) => (
              <tr key={i.id} className={i.is_low || i.is_expiring ? "bg-amber-50/50" : ""}>
                <td className="px-4 py-3 font-medium text-slate-900">{i.name}</td>
                <td className="px-4 py-3 text-slate-600">{i.category}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                  {qty(i.balance)} {i.unit}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">{qty(i.min_level)}</td>
                <td className="px-4 py-3 text-slate-600">{i.expiry_date ? formatDate(i.expiry_date) : "None"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {i.is_low && <Badge tone="amber">Low</Badge>}
                    {i.is_expiring && <Badge tone="red">Expiring</Badge>}
                    {!i.is_low && !i.is_expiring && <Badge tone="green">OK</Badge>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <h2 className="mb-3 mt-8 font-semibold text-slate-900">Latest entries</h2>
      <Card className="divide-y divide-slate-100">
        {recent.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span className="text-slate-900">
              {t.item}{" "}
              <span className={t.type === "in" ? "text-emerald-700" : "text-slate-600"}>
                {t.type === "in" ? "+" : "−"}
                {qty(t.quantity)} {t.unit}
              </span>
            </span>
            <span className="text-slate-500">
              {formatDate(t.date)}
              {t.by ? ` · ${t.by}` : ""}
            </span>
          </div>
        ))}
      </Card>
    </>
  );
}
