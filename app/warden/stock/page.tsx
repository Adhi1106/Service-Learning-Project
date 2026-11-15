import { StockForm } from "@/components/warden/StockForm";
import { requireRole } from "@/lib/auth";
import { todayStr } from "@/lib/dates";
import { listItems, recentStockEntries } from "@/lib/queries";

export default async function WardenStockPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const user = await requireRole("warden");
  const today = todayStr();
  const items = listItems(today).map(({ id, name, category, unit, balance }) => ({ id, name, category, unit, balance }));
  const recent = recentStockEntries(5, user.id).map(({ id, item, unit, type, quantity, date, note }) => ({ id, item, unit, type, quantity, date, note }));
  const initialType = (await searchParams).type === "in" ? "in" : "out";
  return <StockForm items={items} today={today} recent={recent} initialType={initialType} />;
}
