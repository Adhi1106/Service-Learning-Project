import { z } from "zod";
import { fail, readBody } from "@/lib/api";
import { apiUser } from "@/lib/auth";
import { isDateStr, todayStr } from "@/lib/dates";
import { getDb } from "@/lib/db";
import { attendanceForClass, getLookups } from "@/lib/queries";
import { runStudentRules } from "@/lib/rules/engine";

// GET /api/attendance?class=Class 6&date=2026-11-15
// Every child in the class, with what is already saved for that day.
export async function GET(request: Request) {
  const auth = await apiUser("manager", "warden");
  if ("error" in auth) return auth.error;

  const params = new URL(request.url).searchParams;
  const className = params.get("class") ?? "";
  const date = params.get("date") ?? todayStr();
  if (!className) return fail("Choose a class.");
  if (!isDateStr(date)) return fail("The date is not valid.");

  const rows = attendanceForClass(className, date);
  return Response.json({ date, class: className, alreadySaved: rows.some((r) => r.status !== null), rows });
}

const Entry = z.object({
  studentId: z.number().int().positive(),
  status: z.enum(["present", "absent"]),
  reasonId: z.number().int().positive().nullable().optional(),
  illnessId: z.number().int().positive().nullable().optional(),
});
const Body = z.object({
  date: z.string().refine(isDateStr, "The date is not valid."),
  class: z.string().min(1),
  entries: z.array(Entry).min(1).max(200),
});

// POST /api/attendance
// Saves a whole class for one day. Saving again for the same day replaces
// what was there (one row per child per day), then the rules are run.
export async function POST(request: Request) {
  const auth = await apiUser("manager", "warden");
  if ("error" in auth) return auth.error;
  const body = await readBody(request, Body);
  if ("error" in body) return body.error;
  const { date, entries } = body.data;

  const today = todayStr();
  if (date > today) return fail("Attendance cannot be saved for a future date.");

  const db = getDb();
  const { reasons, illnesses } = getLookups();
  const inClass = new Set(
    (db.prepare("SELECT id FROM students WHERE class_name = ?").all(body.data.class) as { id: number }[]).map((s) => s.id),
  );

  // Check every entry before saving anything.
  const clean: { studentId: number; status: string; reasonId: number | null; illnessId: number | null }[] = [];
  const seen = new Set<number>();
  for (const e of entries) {
    if (!inClass.has(e.studentId)) return fail(`Student ${e.studentId} is not in ${body.data.class}.`);
    if (seen.has(e.studentId)) return fail(`Student ${e.studentId} appears twice.`);
    seen.add(e.studentId);

    if (e.status === "present") {
      clean.push({ studentId: e.studentId, status: "present", reasonId: null, illnessId: null });
      continue;
    }
    const reason = reasons.find((r) => r.id === e.reasonId);
    if (!reason) return fail("Every absence needs a reason.");
    let illnessId: number | null = null;
    if (reason.is_medical) {
      if (!illnesses.some((i) => i.id === e.illnessId)) return fail("A medical absence needs the illness.");
      illnessId = e.illnessId ?? null;
    }
    clean.push({ studentId: e.studentId, status: "absent", reasonId: reason.id, illnessId });
  }

  const upsert = db.prepare(
    `INSERT INTO attendance (student_id, date, status, reason_id, illness_id, entered_by)
     VALUES (@studentId, @date, @status, @reasonId, @illnessId, @userId)
     ON CONFLICT (student_id, date) DO UPDATE SET
       status = excluded.status, reason_id = excluded.reason_id,
       illness_id = excluded.illness_id, entered_by = excluded.entered_by`,
  );
  db.transaction(() => {
    for (const e of clean) upsert.run({ ...e, date, userId: auth.user.id });
    // The rules look at the last 30 days up to today.
    for (const e of clean) runStudentRules(db, e.studentId, today);
  })();

  // The warden is told only that it was saved. Alerts are for the manager.
  return Response.json({
    saved: clean.length,
    present: clean.filter((e) => e.status === "present").length,
    absent: clean.filter((e) => e.status === "absent").length,
  });
}
