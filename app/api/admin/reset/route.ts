import { apiUser } from "@/lib/auth";
import { getDb, resetDb } from "@/lib/db";

// POST /api/admin/reset: manager only. Puts the invented demo data back to
// its starting state, so the demo can be repeated. Everyone who is logged in
// (the manager here, the warden on the phone) stays logged in.
export async function POST() {
  const auth = await apiUser("manager");
  if ("error" in auth) return auth.error;
  resetDb(getDb());
  return Response.json({ ok: true });
}
