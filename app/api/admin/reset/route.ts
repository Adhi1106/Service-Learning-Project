import { apiUser, startSession } from "@/lib/auth";
import { getDb, resetDb } from "@/lib/db";

// POST /api/admin/reset: manager only. Puts the invented demo data back to
// its starting state, so the demo can be repeated.
export async function POST() {
  const auth = await apiUser("manager");
  if ("error" in auth) return auth.error;
  const db = getDb();
  resetDb(db);
  // The reset also clears logins, so sign the manager straight back in.
  const manager = db.prepare("SELECT id FROM users WHERE username = ?").get(auth.user.username) as { id: number };
  await startSession(manager.id);
  return Response.json({ ok: true });
}
