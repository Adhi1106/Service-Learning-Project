// The three early-warning rules, as plain functions.
// Owner: B2 (Backend: Rules, Alerts & Testing).
//
// These functions only look at the data they are given and answer "does the
// rule fire?". They do not touch the database, so they are easy to test.
// There is no AI here: every rule is a fixed if-then check.

import { addDays, daysBetween } from "../dates";

/** How far back the attendance rules look, in days, counting today. */
export const WINDOW_DAYS = 30;
/** Rule 1: this many absences for the same illness inside the window. */
export const REPEAT_ILLNESS_THRESHOLD = 3;
/** Rule 2a: attendance below this percentage inside the window. */
export const MIN_ATTENDANCE_PCT = 85;
/** Rule 2a only applies once this many days have been recorded, so that a
 *  new child with one absence is not shown as "0% attendance". */
export const MIN_DAYS_FOR_PCT = 10;
/** Rule 2b: this many recorded school days absent in a row. */
export const CONSECUTIVE_ABSENCES = 3;
/** Rule 3b: stock that expires in this many days or fewer. */
export const EXPIRY_WARNING_DAYS = 30;

export type DayRecord = {
  date: string; // YYYY-MM-DD
  status: "present" | "absent";
  illnessId: number | null;
};

/** First day of the window that ends on `today`. */
export function windowStart(today: string): string {
  return addDays(today, -(WINDOW_DAYS - 1));
}

function inWindow(records: DayRecord[], today: string): DayRecord[] {
  const start = windowStart(today);
  return records.filter((r) => r.date >= start && r.date <= today);
}

// ---------------------------------------------------------------------------
// Rule 1: repeated medical absence
// Fires when a child has 3 or more absences for the SAME illness in 30 days.
// ---------------------------------------------------------------------------

export type RepeatedIllness = { illnessId: number; count: number; latestDate: string };

export function findRepeatedIllnesses(records: DayRecord[], today: string): RepeatedIllness[] {
  const byIllness = new Map<number, RepeatedIllness>();
  for (const r of inWindow(records, today)) {
    if (r.status !== "absent" || r.illnessId === null) continue;
    const entry = byIllness.get(r.illnessId) ?? { illnessId: r.illnessId, count: 0, latestDate: r.date };
    entry.count += 1;
    if (r.date > entry.latestDate) entry.latestDate = r.date;
    byIllness.set(r.illnessId, entry);
  }
  return [...byIllness.values()].filter((e) => e.count >= REPEAT_ILLNESS_THRESHOLD);
}

// ---------------------------------------------------------------------------
// Rule 2: low attendance
// Fires when attendance is below 85% over 30 days, or when the child's most
// recent 3 recorded school days are all absences.
// ---------------------------------------------------------------------------

export type AttendanceCheck = {
  daysRecorded: number;
  daysPresent: number;
  pct: number | null; // null when nothing is recorded
  consecutiveAbsences: number; // counted back from the latest recorded day
  belowPct: boolean;
  absentInARow: boolean;
  fires: boolean;
  latestDate: string | null;
};

export function checkAttendance(records: DayRecord[], today: string): AttendanceCheck {
  const recent = inWindow(records, today).sort((a, b) => a.date.localeCompare(b.date));
  const daysRecorded = recent.length;
  const daysPresent = recent.filter((r) => r.status === "present").length;
  const pct = daysRecorded === 0 ? null : Math.round((1000 * daysPresent) / daysRecorded) / 10;

  let consecutiveAbsences = 0;
  for (let i = recent.length - 1; i >= 0 && recent[i].status === "absent"; i--) consecutiveAbsences++;

  const belowPct = pct !== null && daysRecorded >= MIN_DAYS_FOR_PCT && pct < MIN_ATTENDANCE_PCT;
  const absentInARow = consecutiveAbsences >= CONSECUTIVE_ABSENCES;

  return {
    daysRecorded,
    daysPresent,
    pct,
    consecutiveAbsences,
    belowPct,
    absentInARow,
    fires: belowPct || absentInARow,
    latestDate: daysRecorded ? recent[recent.length - 1].date : null,
  };
}

// ---------------------------------------------------------------------------
// Rule 3: low stock / expiring stock
// Low: the balance is below the item's minimum level.
// Expiring: there is stock left and the newest delivery expires in 30 days
// or fewer (this includes stock that has already expired).
// ---------------------------------------------------------------------------

export type StockInput = { balance: number; minLevel: number; expiryDate: string | null };
export type StockCheck = { low: boolean; expiring: boolean; daysToExpiry: number | null };

export function checkStock(item: StockInput, today: string): StockCheck {
  const daysToExpiry = item.expiryDate ? daysBetween(today, item.expiryDate) : null;
  return {
    low: item.balance < item.minLevel,
    expiring: item.balance > 0 && daysToExpiry !== null && daysToExpiry <= EXPIRY_WARNING_DAYS,
    daysToExpiry,
  };
}
