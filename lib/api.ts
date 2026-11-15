// Small helpers shared by the API routes. Owner: B1.
import type { z } from "zod";

export function fail(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

/** Reads the JSON body and checks it against a Zod schema. */
export async function readBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<{ data: z.infer<T> } | { error: Response }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { error: fail("The request was not valid JSON.") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue.path.length ? `${issue.path.join(".")}: ` : "";
    return { error: fail(`${where}${issue.message}`) };
  }
  return { data: parsed.data };
}
