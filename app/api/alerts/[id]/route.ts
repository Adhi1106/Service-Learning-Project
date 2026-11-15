import { z } from "zod";
import { fail, readBody } from "@/lib/api";
import { apiUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

const Body = z.object({ status: z.enum(["acknowledged", "resolved"]) });

// PATCH /api/alerts/:id  { status: "acknowledged" | "resolved" }: manager only.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiUser("manager");
  if ("error" in auth) return auth.error;
  const body = await readBody(request, Body);
  if ("error" in body) return body.error;

  const id = Number((await params).id);
  const db = getDb();
  const alert = db.prepare("SELECT status FROM alerts WHERE id = ?").get(id) as { status: string } | undefined;
  if (!alert) return fail("That alert does not exist.", 404);
  if (alert.status === "resolved") return fail("This alert is already resolved.", 409);

  if (body.data.status === "resolved") {
    db.prepare("UPDATE alerts SET status = 'resolved', resolved_at = ? WHERE id = ?").run(new Date().toISOString(), id);
  } else {
    db.prepare("UPDATE alerts SET status = 'acknowledged' WHERE id = ?").run(id);
  }
  return Response.json({ id, status: body.data.status });
}
