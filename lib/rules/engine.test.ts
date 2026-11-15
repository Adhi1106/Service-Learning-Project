// Tests the rules against a real (in-memory) database, including the seed
// data's planted patterns and the two flows shown in the demo.

import { beforeEach, describe, expect, it } from "vitest";
import { DEMO, SCHOOL, seed } from "../../db/seed";
import { addDays } from "../dates";
import { createEmptyDb, type DB } from "../db";
import type { Alert } from "../types";
import { runItemRules, runStudentRules } from "./engine";

const TODAY = "2026-11-18"; // a Wednesday

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
  seed(db, TODAY);
});

describe("seed data", () => {
  it("creates 40 children in four classes, 20 items and 2 logins", () => {
    expect(count("SELECT COUNT(*) AS n FROM students")).toBe(40);
    expect(count("SELECT COUNT(DISTINCT class_name) AS n FROM students")).toBe(4);
    expect(count("SELECT COUNT(*) AS n FROM inventory_items")).toBe(20);
    expect(count("SELECT COUNT(*) AS n FROM users")).toBe(2);
  });

  it("starts with exactly the four planted active alerts", () => {
    expect(activeAlerts()).toEqual([
      { rule: "expiring_stock", status: "open", subject: "Paracetamol syrup (250 mg/5 ml)" },
      { rule: "low_attendance", status: "open", subject: DEMO.lowAttendanceChild },
      { rule: "low_stock", status: "open", subject: "Bath soap" },
      { rule: "repeated_illness", status: "acknowledged", subject: DEMO.feverChild },
    ]);
  });

  it("has past health cases that were resolved, and one that is scheduled", () => {
    const cases = db
      .prepare(
        `SELECT s.name, i.name AS illness, c.status FROM health_cases c
           JOIN students s ON s.id = c.student_id JOIN illnesses i ON i.id = c.illness_id ORDER BY c.id`,
      )
      .all();
    expect(cases).toEqual([
      { name: DEMO.asthmaChild, illness: "Asthma", status: "resolved" },
      { name: DEMO.skinChild, illness: "Skin infection", status: "resolved" },
      { name: DEMO.feverChild, illness: "Fever", status: "scheduled" },
    ]);
  });

  it("leaves rice 3 kg above its minimum", () => {
    expect(db.prepare("SELECT balance, min_level FROM inventory_items WHERE name = ?").get(DEMO.rice)).toEqual({
      balance: DEMO.riceStart,
      min_level: DEMO.riceMinimum,
    });
  });

  it("is identical every time it is generated for the same day", () => {
    const snapshot = (d: DB) => d.prepare("SELECT student_id, date, status, illness_id FROM attendance ORDER BY id").all();
    const other = createEmptyDb();
    seed(other, TODAY);
    expect(snapshot(other)).toEqual(snapshot(db));
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

describe("demo flow 1: third asthma absence", () => {
  it("raises a critical alert and opens a new health case", () => {
    const arjun = idOf("students", DEMO.asthmaChild);
    markAbsent(arjun, TODAY);
    const created = runStudentRules(db, arjun, TODAY);

    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ rule: "repeated_illness", severity: "critical" });
    expect(created[0].message).toBe(
      "Shivakumar N was absent for asthma 3 times in the last 30 days (limit: 3). A doctor's visit is recommended.",
    );
    const cases = db.prepare("SELECT status, alert_id FROM health_cases WHERE student_id = ? ORDER BY id").all(arjun);
    expect(cases).toEqual([
      { status: "resolved", alert_id: expect.any(Number) },
      { status: "open", alert_id: created[0].id },
    ]);
  });

  it("does not raise the alert twice when attendance is saved again", () => {
    const arjun = idOf("students", DEMO.asthmaChild);
    markAbsent(arjun, TODAY);
    runStudentRules(db, arjun, TODAY);
    expect(runStudentRules(db, arjun, TODAY)).toEqual([]);
    expect(activeAlertsFor(`illness:${arjun}:${idOf("illnesses", "Asthma")}`)).toHaveLength(1);
  });

  it("does not raise it again for the same absences after the manager resolves it", () => {
    const arjun = idOf("students", DEMO.asthmaChild);
    markAbsent(arjun, TODAY);
    const [alert] = runStudentRules(db, arjun, TODAY);
    resolve(alert.id, TODAY);
    expect(runStudentRules(db, arjun, TODAY)).toEqual([]);
  });

  it("raises it again when there is a new absence after it was resolved", () => {
    const arjun = idOf("students", DEMO.asthmaChild);
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
    const arjun = idOf("students", DEMO.asthmaChild);
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
    const keerthana = idOf("students", DEMO.lowAttendanceChild);
    const [seeded] = activeAlertsFor(`attendance:${keerthana}`);
    resolve(seeded.id, TODAY);

    expect(runStudentRules(db, keerthana, addDays(TODAY, 3))).toEqual([]);
    expect(runStudentRules(db, keerthana, addDays(TODAY, 7)).map((a) => a.rule)).toEqual(["low_attendance"]);
  });
});

describe("demo flow 2: stock", () => {
  const stockOut = (itemId: number, quantity: number) =>
    db.prepare("INSERT INTO stock_transactions (item_id, type, quantity, date) VALUES (?, 'out', ?, ?)").run(itemId, quantity, TODAY);

  it("raises a low-stock warning when rice drops below its minimum", () => {
    const rice = idOf("inventory_items", DEMO.rice);
    stockOut(rice, 5); // 53 -> 48, minimum 50
    const created = runItemRules(db, rice, TODAY);
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ rule: "low_stock", severity: "warning" });
    expect(created[0].message).toBe("Rice (Sona Masoori): 48 kg left, below the minimum of 50 kg.");
  });

  it("does not warn while rice is still at or above its minimum", () => {
    const rice = idOf("inventory_items", DEMO.rice);
    stockOut(rice, 3); // 53 -> 50
    expect(runItemRules(db, rice, TODAY)).toEqual([]);
  });

  it("does not raise the low-stock warning twice", () => {
    const rice = idOf("inventory_items", DEMO.rice);
    stockOut(rice, 5);
    runItemRules(db, rice, TODAY);
    stockOut(rice, 1);
    expect(runItemRules(db, rice, TODAY)).toEqual([]);
  });

  it("the database refuses a stock-out larger than the balance", () => {
    const rice = idOf("inventory_items", DEMO.rice);
    expect(() => stockOut(rice, 500)).toThrow(/CHECK constraint failed/);
    expect(db.prepare("SELECT balance FROM inventory_items WHERE id = ?").get(rice)).toEqual({ balance: DEMO.riceStart });
  });

  it("writes plural units correctly", () => {
    const soap = idOf("inventory_items", "Bath soap");
    const paracetamol = idOf("inventory_items", "Paracetamol syrup (250 mg/5 ml)");
    const messages = (db.prepare("SELECT message FROM alerts WHERE item_id IN (?, ?) ORDER BY id").all(soap, paracetamol) as {
      message: string;
    }[]).map((r) => r.message);
    expect(messages).toContain("Bath soap: 18 pcs left, below the minimum of 25 pcs.");
    expect(messages).toContain("Paracetamol syrup (250 mg/5 ml): the current stock expires in 20 days (8 Dec 2026).");
  });
});

describe("database constraints", () => {
  it("refuses a second attendance row for the same child and day", () => {
    const insert = () =>
      db.prepare("INSERT INTO attendance (student_id, date, status) VALUES (3, ?, 'present')").run(addDays(TODAY, -1));
    expect(insert).toThrow(/UNIQUE constraint failed/);
  });

  it("refuses an absence without a reason", () => {
    const insert = () => db.prepare("INSERT INTO attendance (student_id, date, status) VALUES (3, ?, 'absent')").run(TODAY);
    expect(insert).toThrow(/CHECK constraint failed/);
  });

  it("refuses a second active alert with the same key", () => {
    const keerthana = idOf("students", DEMO.lowAttendanceChild);
    const insert = () =>
      db
        .prepare(
          `INSERT INTO alerts (rule, severity, student_id, message, dedupe_key, trigger_date, created_at)
           VALUES ('low_attendance', 'warning', ?, 'x', ?, ?, ?)`,
        )
        .run(keerthana, `attendance:${keerthana}`, TODAY, TODAY);
    expect(insert).toThrow(/UNIQUE constraint failed/);
  });

  it("gives the planted low-attendance child a percentage below 85 in the 30-day window", () => {
    const rows = db
      .prepare("SELECT status FROM attendance WHERE student_id = ? AND date >= ? AND date <= ?")
      .all(idOf("students", DEMO.lowAttendanceChild), addDays(TODAY, -29), TODAY) as { status: string }[];
    const pct = (100 * rows.filter((r) => r.status === "present").length) / rows.length;
    expect(pct).toBeLessThan(85);
  });
});
