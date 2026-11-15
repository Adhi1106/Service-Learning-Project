// Connects the rules to the database: reads the data a rule needs, and if the
// rule fires, writes an alert (and, for repeated illness, a health case).
// Owner: B2 (Backend: Rules, Alerts & Testing).
//
// Called after every attendance save and every stock entry.

import type { DB } from "../db";
import { addDays } from "../dates";
import type { AlertRule, Severity } from "../types";
import {
  checkAttendance,
  checkStock,
  findRepeatedIllnesses,
  MIN_ATTENDANCE_PCT,
  REPEAT_ILLNESS_THRESHOLD,
  WINDOW_DAYS,
  windowStart,
  type DayRecord,
} from "./rules";

/** After the manager resolves a low-attendance or stock alert, the same alert
 *  is not raised again for this many days, even if the condition is still true. */
export const COOLDOWN_DAYS = 7;

export type NewAlert = { id: number; rule: AlertRule; severity: Severity; message: string };

type AlertDraft = {
  rule: AlertRule;
  severity: Severity;
  studentId?: number;
  itemId?: number;
  message: string;
  dedupeKey: string;
  triggerDate: string;
};

function nowStamp(): string {
  return new Date().toISOString();
}

function hasActiveAlert(db: DB, key: string): boolean {
  return !!db.prepare("SELECT 1 FROM alerts WHERE dedupe_key = ? AND status <> 'resolved'").get(key);
}

function insertAlert(db: DB, a: AlertDraft): NewAlert {
  const info = db
    .prepare(
      `INSERT INTO alerts (rule, severity, student_id, item_id, message, dedupe_key, trigger_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(a.rule, a.severity, a.studentId ?? null, a.itemId ?? null, a.message, a.dedupeKey, a.triggerDate, nowStamp());
  return { id: Number(info.lastInsertRowid), rule: a.rule, severity: a.severity, message: a.message };
}

/** True when this alert was resolved recently enough that we stay quiet. */
function inCooldown(db: DB, key: string, today: string): boolean {
  const row = db
    .prepare("SELECT MAX(resolved_at) AS last FROM alerts WHERE dedupe_key = ? AND status = 'resolved'")
    .get(key) as { last: string | null };
  if (!row.last) return false;
  return row.last.slice(0, 10) > addDays(today, -COOLDOWN_DAYS);
}

// ---------------------------------------------------------------------------
// Student rules: repeated illness (critical) and low attendance (warning)
// ---------------------------------------------------------------------------

export function runStudentRules(db: DB, studentId: number, today: string): NewAlert[] {
  const student = db.prepare("SELECT id, name FROM students WHERE id = ?").get(studentId) as
    | { id: number; name: string }
    | undefined;
  if (!student) return [];

  const records = db
    .prepare(
      `SELECT date, status, illness_id AS illnessId FROM attendance
        WHERE student_id = ? AND date >= ? AND date <= ? ORDER BY date`,
    )
    .all(studentId, windowStart(today), today) as DayRecord[];

  const created: NewAlert[] = [];

  // Rule 1: repeated medical absence -> critical alert + health case.
  for (const hit of findRepeatedIllnesses(records, today)) {
    const key = `illness:${studentId}:${hit.illnessId}`;
    if (hasActiveAlert(db, key)) continue;
    // Do not raise it again for the same absences: there must be a new
    // absence since the last time this alert was raised.
    const last = db.prepare("SELECT MAX(trigger_date) AS d FROM alerts WHERE dedupe_key = ?").get(key) as {
      d: string | null;
    };
    if (last.d && last.d >= hit.latestDate) continue;

    const illness = db.prepare("SELECT name FROM illnesses WHERE id = ?").get(hit.illnessId) as { name: string };
    const alert = insertAlert(db, {
      rule: "repeated_illness",
      severity: "critical",
      studentId,
      message: `${student.name} was absent for ${illness.name.toLowerCase()} ${hit.count} times in the last ${WINDOW_DAYS} days (limit: ${REPEAT_ILLNESS_THRESHOLD}). A doctor's visit is recommended.`,
      dedupeKey: key,
      triggerDate: hit.latestDate,
    });
    created.push(alert);

    const openCase = db
      .prepare("SELECT 1 FROM health_cases WHERE student_id = ? AND illness_id = ? AND status <> 'resolved'")
      .get(studentId, hit.illnessId);
    if (!openCase) {
      const stamp = nowStamp();
      db.prepare(
        `INSERT INTO health_cases (student_id, illness_id, alert_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(studentId, hit.illnessId, alert.id, stamp, stamp);
    }
  }

  // Rule 2: low attendance -> warning alert.
  const att = checkAttendance(records, today);
  if (att.fires) {
    const key = `attendance:${studentId}`;
    if (!hasActiveAlert(db, key) && !inCooldown(db, key, today)) {
      const why = att.absentInARow
        ? `has been absent ${att.consecutiveAbsences} school days in a row`
        : `has ${att.pct}% attendance over the last ${WINDOW_DAYS} days (below ${MIN_ATTENDANCE_PCT}%)`;
      created.push(
        insertAlert(db, {
          rule: "low_attendance",
          severity: "warning",
          studentId,
          message: `${student.name} ${why}.`,
          dedupeKey: key,
          triggerDate: att.latestDate ?? today,
        }),
      );
    }
  }

  return created;
}

// ---------------------------------------------------------------------------
// Item rules: low stock and expiring stock (both warnings)
// ---------------------------------------------------------------------------

export function runItemRules(db: DB, itemId: number, today: string): NewAlert[] {
  const item = db
    .prepare("SELECT id, name, unit, min_level AS minLevel, balance FROM inventory_items WHERE id = ?")
    .get(itemId) as { id: number; name: string; unit: string; minLevel: number; balance: number } | undefined;
  if (!item) return [];

  // Expiry date of the newest delivery that has one.
  const delivery = db
    .prepare(
      `SELECT expiry_date AS expiryDate FROM stock_transactions
        WHERE item_id = ? AND type = 'in' AND expiry_date IS NOT NULL
        ORDER BY date DESC, id DESC LIMIT 1`,
    )
    .get(itemId) as { expiryDate: string } | undefined;

  const check = checkStock(
    { balance: item.balance, minLevel: item.minLevel, expiryDate: delivery?.expiryDate ?? null },
    today,
  );
  const created: NewAlert[] = [];

  if (check.low) {
    const key = `stock:${itemId}`;
    if (!hasActiveAlert(db, key) && !inCooldown(db, key, today)) {
      created.push(
        insertAlert(db, {
          rule: "low_stock",
          severity: "warning",
          itemId,
          message: `${item.name}: ${item.balance} ${item.unit} left, below the minimum of ${item.minLevel} ${item.unit}.`,
          dedupeKey: key,
          triggerDate: today,
        }),
      );
    }
  }

  if (check.expiring && delivery) {
    const key = `expiry:${itemId}`;
    if (!hasActiveAlert(db, key) && !inCooldown(db, key, today)) {
      const days = check.daysToExpiry ?? 0;
      const when = days < 0 ? `expired ${-days} days ago` : days === 0 ? "expires today" : `expires in ${days} days`;
      created.push(
        insertAlert(db, {
          rule: "expiring_stock",
          severity: "warning",
          itemId,
          message: `${item.name}: the current stock ${when} (${delivery.expiryDate}).`,
          dedupeKey: key,
          triggerDate: today,
        }),
      );
    }
  }

  return created;
}

/** Runs every rule for every child and every item. Used after seeding. */
export function runAllRules(db: DB, today: string): NewAlert[] {
  const created: NewAlert[] = [];
  const students = db.prepare("SELECT id FROM students ORDER BY id").all() as { id: number }[];
  const items = db.prepare("SELECT id FROM inventory_items ORDER BY id").all() as { id: number }[];
  for (const s of students) created.push(...runStudentRules(db, s.id, today));
  for (const i of items) created.push(...runItemRules(db, i.id, today));
  return created;
}
