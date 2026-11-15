import { z } from "zod";
import { fail, readBody } from "@/lib/api";
import { apiUser } from "@/lib/auth";
import { isDateStr, todayStr } from "@/lib/dates";
import { amount } from "@/lib/format";
import { getDb } from "@/lib/db";
import { listItems } from "@/lib/queries";
import { runItemRules } from "@/lib/rules/engine";

// GET /api/stock: the full stock table. Manager only.
export async function GET() {
  const auth = await apiUser("manager");
  if ("error" in auth) return auth.error;
  return Response.json({ items: listItems(todayStr()) });
}

const Body = z.object({
  itemId: z.number().int().positive(),
  type: z.enum(["in", "out"]),
  quantity: z.number().positive("Quantity must be more than zero.").max(100000),
  expiryDate: z.string().refine(isDateStr, "The expiry date is not valid.").nullable().optional(),
  note: z.string().trim().max(120, "Keep the note under 120 characters.").nullable().optional(),
});

// POST /api/stock: record stock coming in or being used, then run the rules.
export async function POST(request: Request) {
  const auth = await apiUser("manager", "warden");
  if ("error" in auth) return auth.error;
  const body = await readBody(request, Body);
  if ("error" in body) return body.error;
  const { itemId, type, quantity } = body.data;
  const expiryDate = type === "in" ? (body.data.expiryDate ?? null) : null;
  const note = body.data.note ? body.data.note : null;

  const db = getDb();
  const today = todayStr();
  const item = db.prepare("SELECT id, name, unit, balance FROM inventory_items WHERE id = ?").get(itemId) as
    | { id: number; name: string; unit: string; balance: number }
    | undefined;
  if (!item) return fail("That item does not exist.", 404);
  if (expiryDate && expiryDate < today) return fail("The expiry date is already in the past.");

  try {
    db.transaction(() => {
      db.prepare(
        "INSERT INTO stock_transactions (item_id, type, quantity, date, expiry_date, note, entered_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ).run(itemId, type, quantity, today, expiryDate, note, auth.user.id);
      runItemRules(db, itemId, today);
    })();
  } catch (err) {
    // The database refuses to let the balance go below zero.
    if (err instanceof Error && err.message.includes("CHECK constraint failed")) {
      return fail(`Not enough stock: only ${amount(item.balance, item.unit)} of ${item.name} left.`, 409);
    }
    throw err;
  }

  const after = db.prepare("SELECT balance FROM inventory_items WHERE id = ?").get(itemId) as { balance: number };
  return Response.json({ item: item.name, unit: item.unit, balance: after.balance });
}
