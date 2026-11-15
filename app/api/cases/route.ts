import { apiUser } from "@/lib/auth";
import { listCases } from "@/lib/queries";

// GET /api/cases: manager only. The warden gets 403.
export async function GET() {
  const auth = await apiUser("manager");
  if ("error" in auth) return auth.error;
  return Response.json({ cases: listCases() });
}
