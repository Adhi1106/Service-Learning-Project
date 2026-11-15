import { apiUser } from "@/lib/auth";
import { todayStr } from "@/lib/dates";
import { getLookups, listItems } from "@/lib/queries";

// Lists the warden's screens need: classes, absence reasons, illnesses, items.
export async function GET() {
  const auth = await apiUser("manager", "warden");
  if ("error" in auth) return auth.error;
  const items = listItems(todayStr()).map(({ id, name, category, unit, balance }) => ({ id, name, category, unit, balance }));
  return Response.json({ ...getLookups(), items });
}
