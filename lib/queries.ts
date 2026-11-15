// All the read queries the pages and API routes use.
// Owner: B1 (Backend: Login, Permissions & APIs), on top of D's schema.

import { addDays } from "./dates";
import { getDb } from "./db";
import { EXPIRY_WARNING_DAYS } from "./rules/rules";
import type { AbsenceReason, Alert, AlertStatus, CaseStatus, Illness, Item, Student } from "./types";

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

export type ItemRow = Item & { expiry_date: string | null; is_low: boolean; is_expiring: boolean };

export function listItems(today: string): ItemRow[] {
  const rows = getDb()
    .prepare(
      `SELECT i.*,
              (SELECT t.expiry_date FROM stock_transactions t
                WHERE t.item_id = i.id AND t.type = 'in' AND t.expiry_date IS NOT NULL
                ORDER BY t.date DESC, t.id DESC LIMIT 1) AS expiry_date
         FROM inventory_items i ORDER BY i.category, i.name`,
    )
    .all() as (Item & { expiry_date: string | null })[];
  const limit = addDays(today, EXPIRY_WARNING_DAYS);
  return rows.map((r) => ({
    ...r,
    is_low: r.balance < r.min_level,
    is_expiring: r.balance > 0 && r.expiry_date !== null && r.expiry_date <= limit,
  }));
}

export type StockTxRow = { id: number; item: string; unit: string; type: "in" | "out"; quantity: number; date: string; by: string | null };

export function recentStockEntries(limit = 8): StockTxRow[] {
  return getDb()
    .prepare(
      `SELECT t.id, i.name AS item, i.unit, t.type, t.quantity, t.date, u.name AS by
         FROM stock_transactions t JOIN inventory_items i ON i.id = t.item_id
         LEFT JOIN users u ON u.id = t.entered_by
        ORDER BY t.date DESC, t.id DESC LIMIT ?`,
    )
    .all(limit) as StockTxRow[];
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
  today: { recorded: number; present: number; absent: number };
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

export type StudentProfile = {
  student: Student;
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
  return { student, attendance, absences, cases: listCases().filter((c) => c.student_id === id) };
}

export function attendancePercentages(): Map<number, number | null> {
  const rows = getDb().prepare("SELECT student_id, pct FROM attendance_30d").all() as { student_id: number; pct: number | null }[];
  return new Map(rows.map((r) => [r.student_id, r.pct]));
}
