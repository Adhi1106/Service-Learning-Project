// All the read queries the pages and API routes use.
// Owner: B1 (Backend: Login, Permissions & APIs), on top of D's schema.

import { addDays } from "./dates";
import { getDb } from "./db";
import { EXPIRY_WARNING_DAYS } from "./rules/rules";
import type { AbsenceReason, Alert, AlertStatus, CaseStatus, HealthRecord, HealthStatus, Illness, Item, Student } from "./types";

export function listClasses(): string[] {
  return (getDb().prepare("SELECT DISTINCT class_name FROM students ORDER BY class_name").all() as { class_name: string }[]).map(
    (r) => r.class_name,
  );
}

export function listStudents(className?: string): Student[] {
  const db = getDb();
  return className
    ? (db.prepare("SELECT * FROM students WHERE class_name = ? ORDER BY name").all(className) as Student[])
    : (db.prepare("SELECT * FROM students ORDER BY class_name, name").all() as Student[]);
}

export function getLookups(): { classes: string[]; reasons: AbsenceReason[]; illnesses: Illness[] } {
  const db = getDb();
  return {
    classes: listClasses(),
    reasons: db.prepare("SELECT * FROM absence_reasons ORDER BY id").all() as AbsenceReason[],
    illnesses: db.prepare("SELECT * FROM illnesses ORDER BY id").all() as Illness[],
  };
}

export type AttendanceRow = {
  student_id: number;
  name: string;
  room: string;
  status: "present" | "absent" | null; // null = nothing saved for this day yet
  reason_id: number | null;
  illness_id: number | null;
};

/** Every child in a class, with whatever is already saved for that date. */
export function attendanceForClass(className: string, date: string): AttendanceRow[] {
  return getDb()
    .prepare(
      `SELECT s.id AS student_id, s.name, s.room, a.status, a.reason_id, a.illness_id
         FROM students s LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
        WHERE s.class_name = ? ORDER BY s.name`,
    )
    .all(date, className) as AttendanceRow[];
}

// --- Stock -----------------------------------------------------------------

export type ItemRow = Item & { expiry_date: string | null; last_in: string | null; is_low: boolean; is_expiring: boolean };

export function listItems(today: string): ItemRow[] {
  const rows = getDb()
    .prepare(
      `SELECT i.*,
              (SELECT t.expiry_date FROM stock_transactions t
                WHERE t.item_id = i.id AND t.type = 'in' AND t.expiry_date IS NOT NULL
                ORDER BY t.date DESC, t.id DESC LIMIT 1) AS expiry_date,
              (SELECT MAX(t.date) FROM stock_transactions t WHERE t.item_id = i.id AND t.type = 'in') AS last_in
         FROM inventory_items i ORDER BY i.category, i.name`,
    )
    .all() as (Item & { expiry_date: string | null; last_in: string | null })[];
  const limit = addDays(today, EXPIRY_WARNING_DAYS);
  return rows.map((r) => ({
    ...r,
    is_low: r.balance < r.min_level,
    is_expiring: r.balance > 0 && r.expiry_date !== null && r.expiry_date <= limit,
  }));
}

export type StockTxRow = {
  id: number;
  item: string;
  category: string;
  unit: string;
  type: "in" | "out";
  quantity: number;
  date: string;
  note: string | null;
  by: string | null;
};

export function recentStockEntries(limit = 8, enteredBy?: number): StockTxRow[] {
  const where = enteredBy ? "WHERE t.entered_by = ?" : "";
  const stmt = getDb().prepare(
    `SELECT t.id, i.name AS item, i.category, i.unit, t.type, t.quantity, t.date, t.note, u.name AS by
       FROM stock_transactions t JOIN inventory_items i ON i.id = t.item_id
       LEFT JOIN users u ON u.id = t.entered_by
       ${where}
      ORDER BY t.date DESC, t.id DESC LIMIT ?`,
  );
  return (enteredBy ? stmt.all(enteredBy, limit) : stmt.all(limit)) as StockTxRow[];
}

export type ActivityItem =
  | { kind: "attendance"; key: string; date: string; className: string; by: string | null; total: number; absent: number }
  | { kind: "stock"; key: string; date: string; entry: StockTxRow };

/** Latest attendance saves (one per class and day) and stock entries, newest first. */
export function recentActivity(limit = 8): ActivityItem[] {
  const saves = getDb()
    .prepare(
      `SELECT a.date, s.class_name, u.name AS by, COUNT(*) AS total, SUM(a.status = 'absent') AS absent, MAX(a.id) AS last_id
         FROM attendance a JOIN students s ON s.id = a.student_id LEFT JOIN users u ON u.id = a.entered_by
        GROUP BY a.date, s.class_name ORDER BY a.date DESC, last_id DESC LIMIT ?`,
    )
    .all(limit) as { date: string; class_name: string; by: string | null; total: number; absent: number }[];
  const items: ActivityItem[] = [
    ...saves.map((r) => ({
      kind: "attendance" as const,
      key: `a-${r.date}-${r.class_name}`,
      date: r.date,
      className: r.class_name,
      by: r.by,
      total: r.total,
      absent: r.absent,
    })),
    // Stock issues happen several times a day; keep a few so attendance stays visible.
    ...recentStockEntries(3).map((e) => ({ kind: "stock" as const, key: `s-${e.id}`, date: e.date, entry: e })),
  ];
  return items.sort((a, b) => b.date.localeCompare(a.date) || (a.kind === b.kind ? 0 : a.kind === "attendance" ? -1 : 1)).slice(0, limit);
}

// --- Alerts and health cases (manager only) ----------------------------------

export type AlertRow = Alert & { student_name: string | null; item_name: string | null };

export function listAlerts(status?: AlertStatus): AlertRow[] {
  const where = status ? "WHERE a.status = ?" : "";
  const sql = `SELECT a.*, s.name AS student_name, i.name AS item_name
                 FROM alerts a LEFT JOIN students s ON s.id = a.student_id
                 LEFT JOIN inventory_items i ON i.id = a.item_id
                 ${where}
                ORDER BY CASE a.status WHEN 'open' THEN 0 WHEN 'acknowledged' THEN 1 ELSE 2 END,
                         CASE a.severity WHEN 'critical' THEN 0 ELSE 1 END,
                         a.created_at DESC, a.id DESC`;
  const stmt = getDb().prepare(sql);
  return (status ? stmt.all(status) : stmt.all()) as AlertRow[];
}

export type CaseRow = {
  id: number;
  student_id: number;
  student_name: string;
  class_name: string;
  illness: string;
  status: CaseStatus;
  notes: string;
  created_at: string;
  updated_at: string;
};

export function listCases(): CaseRow[] {
  return getDb()
    .prepare(
      `SELECT c.id, c.student_id, s.name AS student_name, s.class_name, i.name AS illness,
              c.status, c.notes, c.created_at, c.updated_at
         FROM health_cases c JOIN students s ON s.id = c.student_id JOIN illnesses i ON i.id = c.illness_id
        ORDER BY c.updated_at DESC, c.id DESC`,
    )
    .all() as CaseRow[];
}

// --- Dashboard ---------------------------------------------------------------

export type DayPoint = { date: string; present: number; total: number; pct: number };

export type Dashboard = {
  students: number;
  classes: { total: number; marked: number };
  today: { recorded: number; present: number; absent: number };
  cases: { open: number; scheduled: number; under_treatment: number };
  openAlerts: { critical: number; warning: number };
  openCases: number;
  lowStock: ItemRow[];
  chart: DayPoint[];
  reasons: { name: string; count: number }[];
  recentAlerts: AlertRow[];
};

export function getDashboard(today: string): Dashboard {
  const db = getDb();
  const one = <T>(sql: string, ...params: unknown[]) => db.prepare(sql).get(...params) as T;

  const students = one<{ n: number }>("SELECT COUNT(*) AS n FROM students").n;
  const t = one<{ recorded: number; present: number | null }>(
    "SELECT COUNT(*) AS recorded, SUM(status = 'present') AS present FROM attendance WHERE date = ?",
    today,
  );
  const sev = db
    .prepare("SELECT severity, COUNT(*) AS n FROM alerts WHERE status <> 'resolved' GROUP BY severity")
    .all() as { severity: string; n: number }[];
  const openCases = one<{ n: number }>("SELECT COUNT(*) AS n FROM health_cases WHERE status <> 'resolved'").n;
  const caseCounts = db.prepare("SELECT status, COUNT(*) AS n FROM health_cases GROUP BY status").all() as { status: string; n: number }[];
  const caseCount = (status: string) => caseCounts.find((c) => c.status === status)?.n ?? 0;
  const classes = one<{ total: number; marked: number }>(
    `SELECT COUNT(*) AS total, SUM(marked) AS marked FROM (
       SELECT s.class_name, COUNT(a.id) = COUNT(s.id) AS marked
         FROM students s LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
        GROUP BY s.class_name)`,
    today,
  );

  const from = addDays(today, -29);
  const chart = (
    db
      .prepare(
        `SELECT date, SUM(status = 'present') AS present, COUNT(*) AS total
           FROM attendance WHERE date >= ? AND date <= ? GROUP BY date ORDER BY date`,
      )
      .all(from, today) as { date: string; present: number; total: number }[]
  ).map((d) => ({ ...d, pct: Math.round((1000 * d.present) / d.total) / 10 }));

  const reasons = db
    .prepare(
      `SELECT COALESCE(i.name, r.name) AS name, COUNT(*) AS count
         FROM attendance a JOIN absence_reasons r ON r.id = a.reason_id
         LEFT JOIN illnesses i ON i.id = a.illness_id
        WHERE a.status = 'absent' AND a.date >= ? AND a.date <= ?
        GROUP BY 1 ORDER BY count DESC, name`,
    )
    .all(from, today) as { name: string; count: number }[];

  return {
    students,
    classes: { total: classes.total, marked: classes.marked ?? 0 },
    cases: { open: caseCount("open"), scheduled: caseCount("scheduled"), under_treatment: caseCount("under_treatment") },
    today: { recorded: t.recorded, present: t.present ?? 0, absent: t.recorded - (t.present ?? 0) },
    openAlerts: {
      critical: sev.find((s) => s.severity === "critical")?.n ?? 0,
      warning: sev.find((s) => s.severity === "warning")?.n ?? 0,
    },
    openCases,
    lowStock: listItems(today).filter((i) => i.is_low || i.is_expiring),
    chart,
    reasons,
    recentAlerts: listAlerts().filter((a) => a.status !== "resolved").slice(0, 5),
  };
}

// --- Student profile (manager) -----------------------------------------------

export type CalendarDay = { date: string; status: "present" | "absent" | null; label: string | null };

export type StudentProfile = {
  student: Student;
  health: HealthRecord | null;
  calendar: CalendarDay[];
  attendance: { days_recorded: number; days_present: number; pct: number | null };
  absences: { date: string; reason: string; illness: string | null }[];
  cases: CaseRow[];
};

export function getStudentProfile(id: number, today: string): StudentProfile | null {
  const db = getDb();
  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(id) as Student | undefined;
  if (!student) return null;
  const attendance = db
    .prepare("SELECT days_recorded, days_present, pct FROM attendance_30d WHERE student_id = ?")
    .get(id) as StudentProfile["attendance"];
  const absences = db
    .prepare(
      `SELECT a.date, r.name AS reason, i.name AS illness
         FROM attendance a JOIN absence_reasons r ON r.id = a.reason_id
         LEFT JOIN illnesses i ON i.id = a.illness_id
        WHERE a.student_id = ? AND a.status = 'absent' AND a.date >= ?
        ORDER BY a.date DESC`,
    )
    .all(id, addDays(today, -59)) as StudentProfile["absences"];
  const days = db
    .prepare(
      `SELECT a.date, a.status, COALESCE(i.name, r.name) AS label
         FROM attendance a LEFT JOIN absence_reasons r ON r.id = a.reason_id LEFT JOIN illnesses i ON i.id = a.illness_id
        WHERE a.student_id = ? AND a.date >= ?`,
    )
    .all(id, addDays(today, -83)) as { date: string; status: "present" | "absent"; label: string | null }[];
  const byDate = new Map(days.map((d) => [d.date, d]));
  const calendar: CalendarDay[] = [];
  for (let back = 83; back >= 0; back--) {
    const date = addDays(today, -back);
    const d = byDate.get(date);
    calendar.push({ date, status: d?.status ?? null, label: d?.label ?? null });
  }
  const health = (db.prepare("SELECT * FROM health_records WHERE student_id = ?").get(id) as HealthRecord | undefined) ?? null;
  return { student, health, calendar, attendance, absences, cases: listCases().filter((c) => c.student_id === id) };
}

/** Health group of every child, for the manager's list. */
export function healthStatuses(): Map<number, HealthStatus> {
  const rows = getDb().prepare("SELECT student_id, status FROM health_records").all() as { student_id: number; status: HealthStatus }[];
  return new Map(rows.map((r) => [r.student_id, r.status]));
}

export function healthSummary(): Record<HealthStatus, number> {
  const out: Record<HealthStatus, number> = { healthy: 0, minor: 0, frequent: 0, ongoing: 0 };
  for (const s of healthStatuses().values()) out[s]++;
  return out;
}

export function attendancePercentages(): Map<number, number | null> {
  const rows = getDb().prepare("SELECT student_id, pct FROM attendance_30d").all() as { student_id: number; pct: number | null }[];
  return new Map(rows.map((r) => [r.student_id, r.pct]));
}
