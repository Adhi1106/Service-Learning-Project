import { apiUser } from "@/lib/auth";
import { listStudents } from "@/lib/queries";

// Basic details only (name, class, room). No health information.
export async function GET(request: Request) {
  const auth = await apiUser("manager", "warden");
  if ("error" in auth) return auth.error;
  const className = new URL(request.url).searchParams.get("class") ?? undefined;
  return Response.json({ students: listStudents(className) });
}
