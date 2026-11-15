// Tests the rules against a real (in-memory) database, including the seed
// records loaded from data/records, and the two flows shown in the presentation.

import { beforeEach, describe, expect, it } from "vitest";
import { RECORDS_DIR, SCHOOL, importRecords } from "../../db/import";
import { addDays } from "../dates";
import { createEmptyDb, type DB } from "../db";
import type { Alert } from "../types";
import { runItemRules, runStudentRules } from "./engine";

// The records in data/records run up to 14 November 2026.
const TODAY = "2026-11-15";
const NAMES = {
  asthmaChild: "Shivakumar N",
  feverChild: "Imran Pasha",
  lowAttendanceChild: "Lakshmi K",
  skinChild: "Bhagya S",
  throatChild: "Keerthana R",
  rice: "Rice (Sona Masoori)",
  riceStart: 58,
  riceMinimum: 55,
};


let db: DB;

const idOf = (table: "students" | "inventory_items" | "illnesses" | "absence_reasons", name: string) =>
  (db.prepare(`SELECT id FROM ${table} WHERE name = ?`).get(name) as { id: number }).id;
const count = (sql: string, ...params: unknown[]) => (db.prepare(sql).get(...params) as { n: number }).n;
const activeAlerts = () =>
  db
    .prepare(
      `SELECT a.rule, a.status, COALESCE(s.name, i.name) AS subject FROM alerts a
         LEFT JOIN students s ON s.id = a.student_id LEFT JOIN inventory_items i ON i.id = a.item_id
        WHERE a.status <> 'resolved' ORDER BY a.rule, subject`,
    )
    .all();
const activeAlertsFor = (key: string) =>
  db.prepare("SELECT * FROM alerts WHERE dedupe_key = ? AND status <> 'resolved'").all(key) as Alert[];

function markAbsent(studentId: number, date: string, illness: string | null = "Asthma") {
  const reason = idOf("absence_reasons", illness ? "Medical" : "Other");
  db.prepare(
    `INSERT INTO attendance (student_id, date, status, reason_id, illness_id) VALUES (?, ?, 'absent', ?, ?)
     ON CONFLICT (student_id, date) DO UPDATE SET status = 'absent', reason_id = excluded.reason_id, illness_id = excluded.illness_id`,
  ).run(studentId, date, reason, illness ? idOf("illnesses", illness) : null);
}

function resolve(alertId: number, on: string) {
  db.prepare("UPDATE alerts SET status = 'resolved', resolved_at = ? WHERE id = ?").run(`${on}T10:00:00.000Z`, alertId);
}

beforeEach(() => {
  db = createEmptyDb();
  importRecords(db, RECORDS_DIR, TODAY);
});

describe("the home's records", () => {
  it("loads 47 children in Classes 1 to 7, 21 store items and 2 staff logins", () => {
    expect(count("SELECT COUNT(*) AS n FROM students")).toBe(47);
    expect(count("SELECT COUNT(DISTINCT class_name) AS n FROM students")).toBe(7);
    expect(count("SELECT COUNT(*) AS n FROM inventory_items")).toBe(21);
    expect(count("SELECT COUNT(*) AS n FROM users")).toBe(2);
  });

  it("has one health record for every child, across all four health groups", () => {
    expect(count("SELECT COUNT(*) AS n FROM health_records")).toBe(47);
    const groups = db.prepare("SELECT status, COUNT(*) AS n FROM health_records GROUP BY status ORDER BY status").all();
    expect(groups).toEqual([
      { status: "frequent", n: 7 },
      { status: "healthy", n: 22 },
      { status: "minor", n: 12 },
      { status: "ongoing", n: 6 },
    ]);
  });

  it("gives every child a unique admission number", () => {
    expect(count("SELECT COUNT(DISTINCT admission_no) AS n FROM students")).toBe(47);
  });

  it("starts with exactly four alerts to review", () => {
    expect(activeAlerts()).toEqual([
      { rule: "expiring_stock", status: "open", subject: "Paracetamol syrup (250 mg/5 ml)" },
      { rule: "low_attendance", status: "open", subject: NAMES.lowAttendanceChild },
      { rule: "low_stock", status: "open", subject: "Bath soap" },
      { rule: "repeated_illness", status: "open", subject: NAMES.feverChild },
    ]);
  });

  it("has past health cases that were resolved, and one that is scheduled and linked to its alert", () => {
    const cases = db
      .prepare(
        `SELECT s.name, i.name AS illness, c.status FROM health_cases c
           JOIN students s ON s.id = c.student_id JOIN illnesses i ON i.id = c.illness_id ORDER BY c.id`,
      )
      .all();
    expect(cases).toEqual([
      { name: NAMES.asthmaChild, illness: "Asthma", status: "resolved" },
      { name: NAMES.throatChild, illness: "Throat infection", status: "resolved" },
      { name: NAMES.skinChild, illness: "Skin infection", status: "resolved" },
      { name: NAMES.feverChild, illness: "Fever", status: "scheduled" },
    ]);
    expect(count("SELECT COUNT(*) AS n FROM health_cases WHERE status = 'scheduled' AND alert_id IS NOT NULL")).toBe(1);
  });

  it("has rice 3 kg above its minimum", () => {
    expect(db.prepare("SELECT balance, min_level FROM inventory_items WHERE name = ?").get(NAMES.rice)).toEqual({
      balance: NAMES.riceStart,
      min_level: NAMES.riceMinimum,
    });
  });

  it("stops the import on a bad record", () => {
    const other = createEmptyDb();
    expect(() => importRecords(other, "/nonexistent-folder", TODAY)).toThrow();
  });

  it("sends every child to the same government school", () => {
    expect(db.prepare("SELECT DISTINCT school FROM students").all()).toEqual([{ school: SCHOOL }]);
  });

  it("only records attendance on school days (no Sundays or second Saturdays)", () => {
    const dates = (db.prepare("SELECT DISTINCT date FROM attendance").all() as { date: string }[]).map((r) => r.date);
    for (const d of dates) {
      const day = new Date(`${d}T12:00:00`);
      expect(day.getDay()).not.toBe(0);
      if (day.getDay() === 6) expect(day.getDate() < 8 || day.getDate() > 14).toBe(true);
    }
  });
});

describe("flow 1: third asthma absence", () => {
  it("raises a critical alert and opens a new health case", () => {
    const arjun = idOf("students", NAMES.asthmaChild);
    markAbsent(arjun, TODAY);
    const created = runStudentRules(db, arjun, TODAY);

    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ rule: "repeated_illness", severity: "critical" });
    expect(created[0].message).toBe(
      "Shivakumar N was absent for asthma 3 times in the last 30 days (limit: 3). A doctor's visit is recommended.",
    );
    const cases = db.prepare("SELECT status, alert_id FROM health_cases WHERE student_id = ? ORDER BY id").all(arjun);
    expect(cases).toEqual([
      { status: "resolved", alert_id: null },
      { status: "open", alert_id: created[0].id },
    ]);
  });

  it("does not raise the alert twice when attendance is saved again", () => {
    const arjun = idOf("students", NAMES.asthmaChild);
    markAbsent(arjun, TODAY);
    runStudentRules(db, arjun, TODAY);
    expect(runStudentRules(db, arjun, TODAY)).toEqual([]);
    expect(activeAlertsFor(`illness:${arjun}:${idOf("illnesses", "Asthma")}`)).toHaveLength(1);
  });

  it("does not raise it again for the same absences after the manager resolves it", () => {
    const arjun = idOf("students", NAMES.asthmaChild);
    markAbsent(arjun, TODAY);
    const [alert] = runStudentRules(db, arjun, TODAY);
    resolve(alert.id, TODAY);
    expect(runStudentRules(db, arjun, TODAY)).toEqual([]);
  });

  it("raises it again when there is a new absence after it was resolved", () => {
    const arjun = idOf("students", NAMES.asthmaChild);
    markAbsent(arjun, TODAY);
    const [alert] = runStudentRules(db, arjun, TODAY);
    resolve(alert.id, TODAY);

    const tomorrow = addDays(TODAY, 1);
    markAbsent(arjun, tomorrow);
    expect(runStudentRules(db, arjun, tomorrow).map((a) => a.rule)).toContain("repeated_illness");
    // The case opened today is still open, so a third one is not created.
    expect(count("SELECT COUNT(*) AS n FROM health_cases WHERE student_id = ?", arjun)).toBe(2);
  });

  it("does nothing for a different illness", () => {
    const arjun = idOf("students", NAMES.asthmaChild);
    markAbsent(arjun, TODAY, "Fever");
    expect(runStudentRules(db, arjun, TODAY)).toEqual([]);
  });
});

describe("low attendance", () => {
  /** A child with no absences in the last 30 days. */
  const fullAttendanceChild = () =>
    (
      db
        .prepare(
          `SELECT id FROM students WHERE id NOT IN
             (SELECT student_id FROM attendance WHERE status = 'absent' AND date >= ?) ORDER BY id LIMIT 1`,
        )
        .get(addDays(TODAY, -40)) as { id: number }
    ).id;

  it("fires on the third absence in a row", () => {
    const child = fullAttendanceChild();
    markAbsent(child, addDays(TODAY, -2), null);
    markAbsent(child, addDays(TODAY, -1), null);
    expect(runStudentRules(db, child, addDays(TODAY, -1))).toEqual([]);

    markAbsent(child, TODAY, null);
    const created = runStudentRules(db, child, TODAY);
    expect(created.map((a) => a.rule)).toEqual(["low_attendance"]);
    expect(created[0].message).toContain("3 school days in a row");
  });

  it("stays quiet for 7 days after the manager resolves it, then fires again", () => {
    const keerthana = idOf("students", NAMES.lowAttendanceChild);
    const [seeded] = activeAlertsFor(`attendance:${keerthana}`);
    resolve(seeded.id, TODAY);

    expect(runStudentRules(db, keerthana, addDays(TODAY, 3))).toEqual([]);
    expect(runStudentRules(db, keerthana, addDays(TODAY, 7)).map((a) => a.rule)).toEqual(["low_attendance"]);
  });
});

describe("flow 2: stock", () => {
  const stockOut = (itemId: number, quantity: number) =>
    db.prepare("INSERT INTO stock_transactions (item_id, type, quantity, date) VALUES (?, 'out', ?, ?)").run(itemId, quantity, TODAY);

  it("raises a low-stock warning when rice drops below its minimum", () => {
    const rice = idOf("inventory_items", NAMES.rice);
    stockOut(rice, 5); // 58 -> 53, minimum 55
    const created = runItemRules(db, rice, TODAY);
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ rule: "low_stock", severity: "warning" });
    expect(created[0].message).toBe("Rice (Sona Masoori): 53 kg left, below the minimum of 55 kg.");
  });

  it("does not warn while rice is still at or above its minimum", () => {
    const rice = idOf("inventory_items", NAMES.rice);
    stockOut(rice, 3); // 58 -> 55
    expect(runItemRules(db, rice, TODAY)).toEqual([]);
  });

  it("does not raise the low-stock warning twice", () => {
    const rice = idOf("inventory_items", NAMES.rice);
    stockOut(rice, 5);
    runItemRules(db, rice, TODAY);
    stockOut(rice, 1);
    expect(runItemRules(db, rice, TODAY)).toEqual([]);
  });

  it("the database refuses a stock-out larger than the balance", () => {
    const rice = idOf("inventory_items", NAMES.rice);
    expect(() => stockOut(rice, 500)).toThrow(/CHECK constraint failed/);
    expect(db.prepare("SELECT balance FROM inventory_items WHERE id = ?").get(rice)).toEqual({ balance: NAMES.riceStart });
  });

  it("writes plural units correctly", () => {
    const soap = idOf("inventory_items", "Bath soap");
    const paracetamol = idOf("inventory_items", "Paracetamol syrup (250 mg/5 ml)");
    const messages = (db.prepare("SELECT message FROM alerts WHERE item_id IN (?, ?) ORDER BY id").all(soap, paracetamol) as {
      message: string;
    }[]).map((r) => r.message);
    expect(messages).toContain("Bath soap: 21 pcs left, below the minimum of 30 pcs.");
    expect(messages).toContain("Paracetamol syrup (250 mg/5 ml): the current stock expires in 20 days (5 Dec 2026).");
  });
});

describe("database constraints", () => {
  it("refuses a second attendance row for the same child and day", () => {
    const insert = () =>
      // 13 November was a Friday (14th was a second Saturday, a holiday).
      db.prepare("INSERT INTO attendance (student_id, date, status) VALUES (3, ?, 'present')").run(addDays(TODAY, -2));
    expect(insert).toThrow(/UNIQUE constraint failed/);
  });

  it("refuses an absence without a reason", () => {
    const insert = () => db.prepare("INSERT INTO attendance (student_id, date, status) VALUES (3, ?, 'absent')").run(TODAY);
    expect(insert).toThrow(/CHECK constraint failed/);
  });

  it("refuses a second active alert with the same key", () => {
    const keerthana = idOf("students", NAMES.lowAttendanceChild);
    const insert = () =>
      db
        .prepare(
          `INSERT INTO alerts (rule, severity, student_id, message, dedupe_key, trigger_date, created_at)
           VALUES ('low_attendance', 'warning', ?, 'x', ?, ?, ?)`,
        )
        .run(keerthana, `attendance:${keerthana}`, TODAY, TODAY);
    expect(insert).toThrow(/UNIQUE constraint failed/);
  });

  it("gives Lakshmi K an attendance below 85% in the 30-day window", () => {
    const rows = db
      .prepare("SELECT status FROM attendance WHERE student_id = ? AND date >= ? AND date <= ?")
      .all(idOf("students", NAMES.lowAttendanceChild), addDays(TODAY, -29), TODAY) as { status: string }[];
    const pct = (100 * rows.filter((r) => r.status === "present").length) / rows.length;
    expect(pct).toBeLessThan(85);
  });
});
