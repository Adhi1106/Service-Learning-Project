import { StockForm } from "@/components/warden/StockForm";
import { requireRole } from "@/lib/auth";
import { todayStr } from "@/lib/dates";
import { listItems } from "@/lib/queries";

export default async function WardenStockPage() {
  await requireRole("warden");
  const today = todayStr();
  const items = listItems(today).map(({ id, name, category, unit, balance }) => ({ id, name, category, unit, balance }));
  return <StockForm items={items} today={today} />;
}
