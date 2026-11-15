import Link from "next/link";
import { IconArrowIn, IconArrowOut } from "@/components/icons";
import { Badge, Card, CardHeader, PageTitle, amount } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { formatDate, relativeDay, todayStr } from "@/lib/dates";
import { listItems, recentStockEntries } from "@/lib/queries";

const CATEGORIES = ["All", "Food", "Medicine", "Hygiene", "Stationery"] as const;

export default async function StockPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  await requireRole("manager");
  const today = todayStr();
  const asked = (await searchParams).category;
  const category = CATEGORIES.find((c) => c === asked) ?? "All";
  const all = listItems(today);
  const items = category === "All" ? all : all.filter((i) => i.category === category);
  const recent = recentStockEntries(12);
  const attention = all.filter((i) => i.is_low || i.is_expiring).length;

  const tab = (selected: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${selected ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`;

  return (
    <>
      <PageTitle
        title="Stock"
        subtitle={`${all.length} items in the store · ${attention} need attention. Balances update with every entry.`}
      />

      <div className="mb-4 inline-flex flex-wrap rounded-lg bg-slate-100 p-1">
        {CATEGORIES.map((c) => (
          <Link key={c} href={c === "All" ? "/manager/stock" : `/manager/stock?category=${c}`} className={tab(c === category)}>
            {c}
          </Link>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Item</th>
              <th className="px-3 py-3 font-medium">Level</th>
              <th className="px-3 py-3 text-right font-medium">In stock</th>
              <th className="px-3 py-3 text-right font-medium">Minimum</th>
              <th className="px-3 py-3 font-medium">Last received</th>
              <th className="px-3 py-3 font-medium">Expiry</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((i) => {
              const scale = Math.max(i.min_level * 3, i.balance);
              return (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{i.name}</p>
                    <p className="text-xs text-slate-500">{i.category}</p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="relative h-1.5 w-28 rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${i.is_low ? "bg-amber-500" : "bg-teal-500"}`}
                        style={{ width: `${Math.min(100, (i.balance / scale) * 100)}%` }}
                      />
                      <span className="absolute -top-1 h-3.5 w-px bg-slate-400" style={{ left: `${(i.min_level / scale) * 100}%` }} title="Minimum" />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-medium tabular-nums text-slate-900">{amount(i.balance, i.unit)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-500">{amount(i.min_level, i.unit)}</td>
                  <td className="px-3 py-3 text-slate-600">{i.last_in ? relativeDay(i.last_in, today) : "–"}</td>
                  <td className={`px-3 py-3 ${i.is_expiring ? "font-medium text-red-700" : "text-slate-600"}`}>
                    {i.expiry_date ? formatDate(i.expiry_date) : "–"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5">
                      {i.is_low && <Badge tone="amber">Low</Badge>}
                      {i.is_expiring && <Badge tone="red">Expiring</Badge>}
                      {!i.is_low && !i.is_expiring && <Badge tone="green">In stock</Badge>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Latest entries" subtitle="Deliveries, donations and issues recorded by staff" />
        <ul className="divide-y divide-slate-100">
          {recent.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-5 py-3 text-sm">
              <span
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  t.type === "in" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {t.type === "in" ? <IconArrowIn size={16} /> : <IconArrowOut size={16} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-slate-900">
                  <span className="font-medium">{t.item}</span>{" "}
                  <span className={t.type === "in" ? "text-emerald-700" : "text-slate-600"}>
                    {t.type === "in" ? "+" : "−"}
                    {amount(t.quantity, t.unit)}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  {t.note ?? (t.type === "in" ? "Received" : "Issued")}
                  {t.by ? ` · ${t.by}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-xs text-slate-400">{relativeDay(t.date, today)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
