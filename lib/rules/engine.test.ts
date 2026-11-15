// Tests the rules against a real (in-memory) database, including the seed
// data's planted patterns and the two flows shown in the demo.

import { beforeEach, describe, expect, it } from "vitest";
import { seed } from "../../db/seed";
import { addDays } from "../dates";
import { createEmptyDb, type DB } from "../db";
import type { Alert } from "../types";
import { runItemRules, runStudentRules } from "./engine";

const TODAY = "2026-11-18"; // a Wednesday
const MEDICAL = 1;
const ASTHMA = 1;
const RICE = 1;

let db: DB;

const alerts = () => db.prepare("SELECT * FROM alerts ORDER BY id").all() as Alert[];
const activeAlertsFor = (key: string) =>
  db.prepare("SELECT * FROM alerts WHERE dedupe_key = ? AND status <> 'resolved'").all(key) as Alert[];

function markAbsent(studentId: number, date: string, illnessId: number | null = ASTHMA) {
  db.prepare(
    `INSERT INTO attendance (student_id, date, status, reason_id, illness_id) VALUES (?, ?, 'absent', ?, ?)
     ON CONFLICT (student_id, date) DO UPDATE SET status = 'absent', reason_id = excluded.reason_id, illness_id = excluded.illness_id`,
  ).run(studentId, date, MEDICAL, illnessId);
}

function resolve(alertId: number, on: string) {
  db.prepare("UPDATE alerts SET status = 'resolved', resolved_at = ? WHERE id = ?").run(`${on}T10:00:00.000Z`, alertId);
}

beforeEach(() => {
  db = createEmptyDb();
  seed(db, TODAY);
});

describe("seed data", () => {
  it("creates 30 students, 15 items and 2 logins", () => {
    const count = (t: string) => (db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number }).n;
    expect(count("students")).toBe(30);
    expect(count("inventory_items")).toBe(15);
    expect(count("users")).toBe(2);
  });

  it("raises exactly the three planted warnings and nothing else", () => {
    const found = alerts().map((a) => [a.rule, a.severity, a.dedupe_key]);
    expect(found).toEqual([
      ["low_attendance", "warning", "attendance:2"],
      ["expiring_stock", "warning", "expiry:7"],
      ["low_stock", "warning", "stock:11"],
    ]);
  });

  it("starts with no health cases", () => {
    expect(db.prepare("SELECT COUNT(*) AS n FROM health_cases").get()).toEqual({ n: 0 });
  });

  it("leaves rice 2 kg above its minimum", () => {
    expect(db.prepare("SELECT balance, min_level FROM inventory_items WHERE id = ?").get(RICE)).toEqual({
      balance: 22,
      min_level: 20,
    });
  });
});

describe("demo flow 1: third asthma absence", () => {
  it("raises a critical alert and opens a health case", () => {
    markAbsent(1, TODAY);
    const created = runStudentRules(db, 1, TODAY);

    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ rule: "repeated_illness", severity: "critical" });
    expect(created[0].message).toContain("Aarav K.");
    expect(created[0].message).toContain("asthma 3 times");

    const cases = db.prepare("SELECT student_id, illness_id, status, alert_id FROM health_cases").all();
    expect(cases).toEqual([{ student_id: 1, illness_id: ASTHMA, status: "open", alert_id: created[0].id }]);
  });

  it("does not raise the alert twice when attendance is saved again", () => {
    markAbsent(1, TODAY);
    runStudentRules(db, 1, TODAY);
    expect(runStudentRules(db, 1, TODAY)).toEqual([]);
    expect(activeAlertsFor("illness:1:1")).toHaveLength(1);
    expect(db.prepare("SELECT COUNT(*) AS n FROM health_cases").get()).toEqual({ n: 1 });
  });

  it("does not raise it again for the same absences after the manager resolves it", () => {
    markAbsent(1, TODAY);
    const [alert] = runStudentRules(db, 1, TODAY);
    resolve(alert.id, TODAY);
    expect(runStudentRules(db, 1, TODAY)).toEqual([]);
  });

  it("raises it again when there is a new absence after it was resolved", () => {
    markAbsent(1, TODAY);
    const [alert] = runStudentRules(db, 1, TODAY);
    resolve(alert.id, TODAY);

    const tomorrow = addDays(TODAY, 1);
    markAbsent(1, tomorrow);
    const again = runStudentRules(db, 1, tomorrow);
    // A fourth absence also takes attendance below 85%, so two alerts are raised.
    expect(again.map((a) => a.rule)).toEqual(["repeated_illness", "low_attendance"]);
    // The earlier health case is still open, so a second one is not created.
    expect(db.prepare("SELECT COUNT(*) AS n FROM health_cases").get()).toEqual({ n: 1 });
  });

  it("does nothing for a different illness", () => {
    markAbsent(1, TODAY, 2); // fever, not asthma
    expect(runStudentRules(db, 1, TODAY)).toEqual([]);
  });
});

describe("low attendance", () => {
  it("fires on the third absence in a row", () => {
    const student = 5;
    markAbsent(student, addDays(TODAY, -2), null);
    markAbsent(student, addDays(TODAY, -1), null);
    expect(runStudentRules(db, student, addDays(TODAY, -1))).toEqual([]);

    markAbsent(student, TODAY, null);
    const created = runStudentRules(db, student, TODAY);
    expect(created.map((a) => a.rule)).toEqual(["low_attendance"]);
    expect(created[0].message).toContain("3 school days in a row");
  });

  it("stays quiet for 7 days after the manager resolves it, then fires again", () => {
    const [seeded] = activeAlertsFor("attendance:2");
    resolve(seeded.id, TODAY);

    expect(runStudentRules(db, 2, addDays(TODAY, 3))).toEqual([]);
    expect(runStudentRules(db, 2, addDays(TODAY, 7)).map((a) => a.rule)).toEqual(["low_attendance"]);
  });
});

describe("demo flow 2: stock", () => {
  const stockOut = (itemId: number, quantity: number) =>
    db.prepare("INSERT INTO stock_transactions (item_id, type, quantity, date) VALUES (?, 'out', ?, ?)").run(itemId, quantity, TODAY);

  it("raises a low-stock warning when rice drops below its minimum", () => {
    stockOut(RICE, 5); // 22 -> 17, minimum 20
    const created = runItemRules(db, RICE, TODAY);
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ rule: "low_stock", severity: "warning" });
    expect(created[0].message).toBe("Rice: 17 kg left, below the minimum of 20 kg.");
  });

  it("does not warn while rice is still at or above its minimum", () => {
    stockOut(RICE, 2); // 22 -> 20
    expect(runItemRules(db, RICE, TODAY)).toEqual([]);
  });

  it("does not raise the low-stock warning twice", () => {
    stockOut(RICE, 5);
    runItemRules(db, RICE, TODAY);
    stockOut(RICE, 1);
    expect(runItemRules(db, RICE, TODAY)).toEqual([]);
  });

  it("the database refuses a stock-out larger than the balance", () => {
    expect(() => stockOut(RICE, 500)).toThrow(/CHECK constraint failed/);
    expect(db.prepare("SELECT balance FROM inventory_items WHERE id = ?").get(RICE)).toEqual({ balance: 22 });
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
    const insert = () =>
      db
        .prepare(
          `INSERT INTO alerts (rule, severity, student_id, message, dedupe_key, trigger_date, created_at)
           VALUES ('low_attendance', 'warning', 2, 'x', 'attendance:2', ?, ?)`,
        )
        .run(TODAY, TODAY);
    expect(insert).toThrow(/UNIQUE constraint failed/);
  });

  it("gives the planted low-attendance child a percentage below 85 in the 30-day window", () => {
    const rows = db
      .prepare("SELECT status FROM attendance WHERE student_id = 2 AND date >= ? AND date <= ?")
      .all(addDays(TODAY, -29), TODAY) as { status: string }[];
    const pct = (100 * rows.filter((r) => r.status === "present").length) / rows.length;
    expect(pct).toBeLessThan(85);
  });
});
