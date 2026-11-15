import { z } from "zod";
import { readBody, fail } from "@/lib/api";
import { checkLogin, homeFor, startSession } from "@/lib/auth";

const Body = z.object({ username: z.string().min(1).max(50), password: z.string().min(1).max(200) });

export async function POST(request: Request) {
  const body = await readBody(request, Body);
  if ("error" in body) return body.error;

  const user = checkLogin(body.data.username, body.data.password);
  if (!user) return fail("Wrong username or password.", 401);

  await startSession(user.id);
  return Response.json({ name: user.name, role: user.role, home: homeFor(user.role) });
}
