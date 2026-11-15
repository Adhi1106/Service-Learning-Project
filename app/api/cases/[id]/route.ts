import { z } from "zod";
import { fail, readBody } from "@/lib/api";
import { apiUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { CASE_STATUSES } from "@/lib/types";

const Body = z
  .object({ status: z.enum(CASE_STATUSES).optional(), notes: z.string().max(2000).optional() })
  .refine((b) => b.status !== undefined || b.notes !== undefined, "Nothing to change.");

// PATCH /api/cases/:id  { status?, notes? }: manager only.
// A case moves one step at a time: Open -> Scheduled -> Under treatment -> Resolved.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiUser("manager");
  if ("error" in auth) return auth.error;
  const body = await readBody(request, Body);
  if ("error" in body) return body.error;

  const id = Number((await params).id);
  const db = getDb();
  const current = db.prepare("SELECT status, notes, alert_id FROM health_cases WHERE id = ?").get(id) as
    | { status: (typeof CASE_STATUSES)[number]; notes: string; alert_id: number | null }
    | undefined;
  if (!current) return fail("That health case does not exist.", 404);

  const status = body.data.status ?? current.status;
  if (status !== current.status) {
    const from = CASE_STATUSES.indexOf(current.status);
    const to = CASE_STATUSES.indexOf(status);
    if (to !== from + 1) return fail("A case can only move forward one step at a time.", 409);
  }

  const now = new Date().toISOString();
  db.transaction(() => {
    db.prepare("UPDATE health_cases SET status = ?, notes = ?, updated_at = ? WHERE id = ?").run(
      status,
      body.data.notes ?? current.notes,
      now,
      id,
    );
    // Closing the case also closes the alert that opened it.
    if (status === "resolved" && current.alert_id) {
      db.prepare("UPDATE alerts SET status = 'resolved', resolved_at = ? WHERE id = ? AND status <> 'resolved'").run(now, current.alert_id);
    }
  })();
  return Response.json({ id, status });
}
