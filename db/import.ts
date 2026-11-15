// Loads the home's records into the database.
// Owner: D (Database and records).
//
// The records live in data/records/ as CSV files, one per register, the way
// the trust keeps them in a spreadsheet:
//
//   staff.csv            who can sign in, and their role
//   children.csv         admission register
//   health_records.csv   one row per child from the yearly check-up
//   absence_reasons.csv  reasons the warden can pick
//   illnesses.csv        illnesses the warden can pick
//   attendance.csv       daily school attendance, one row per child per day
//   stock_items.csv      items kept in the store, with minimum levels
//   stock_entries.csv    every delivery, donation and issue
//   health_cases.csv     health follow-ups and their notes
//
// Every row is checked by the database constraints as it goes in, so a bad
// record (two attendance rows for one day, a stock issue larger than the
// balance, an unknown child) stops the import with an error.

import path from "node:path";
import type { DB } from "../lib/db";
import { readCsv, type CsvRow } from "../lib/csv";
import { hashPassword } from "../lib/password";
import { runAllRules } from "../lib/rules/engine";

export const RECORDS_DIR = path.join(process.cwd(), "data", "records");

/** The school all the children attend. */
export const SCHOOL = "Government Higher Primary School (Main), Hosakote";

const stamp = (date: string, time: string) => {
  // Local India time (UTC+5:30) stored as UTC, like the app's own timestamps.
  const [h, m] = time.split(":").map(Number);
  const minutes = h * 60 + m - 330;
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCMinutes(minutes);
  return d.toISOString();
};

export function importRecords(db: DB, dir: string, today: string): void {
  const read = (name: string): CsvRow[] => readCsv(path.join(dir, name));
  const lookup = (sql: string, value: string, what: string): number => {
    const row = db.prepare(sql).get(value) as { id: number } | undefined;
    if (!row) throw new Error(`Unknown ${what}: "${value}"`);
    return row.id;
  };
  const userId = (u: string) => lookup("SELECT id FROM users WHERE username = ?", u, "staff username");
  const studentId = (a: string) => lookup("SELECT id FROM students WHERE admission_no = ?", a, "admission number");
  const reasonId = (r: string) => lookup("SELECT id FROM absence_reasons WHERE name = ?", r, "absence reason");
  const illnessId = (i: string) => lookup("SELECT id FROM illnesses WHERE name = ?", i, "illness");
  const itemId = (i: string) => lookup("SELECT id FROM inventory_items WHERE name = ?", i, "stock item");
  const num = (v: string) => (v === "" ? null : Number(v));
  const opt = (v: string) => (v === "" ? null : v);

  db.transaction(() => {
    const insUser = db.prepare("INSERT INTO users (username, name, password_hash, role) VALUES (?, ?, ?, ?)");
    for (const r of read("staff.csv")) insUser.run(r.username, r.full_name, hashPassword(r.initial_password), r.role);

    const insReason = db.prepare("INSERT INTO absence_reasons (name, is_medical) VALUES (?, ?)");
    for (const r of read("absence_reasons.csv")) insReason.run(r.reason, r.is_medical === "yes" ? 1 : 0);
    const insIllness = db.prepare("INSERT INTO illnesses (name) VALUES (?)");
    for (const r of read("illnesses.csv")) insIllness.run(r.illness);

    const insStudent = db.prepare(
      "INSERT INTO students (admission_no, name, gender, dob, class_name, room, school, admitted_on) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    );
    for (const r of read("children.csv")) {
      insStudent.run(r.admission_no, r.name, r.gender, r.date_of_birth, r.class, r.dorm, r.school, r.admitted_on);
    }

    const insHealth = db.prepare(
      `INSERT INTO health_records (student_id, blood_group, height_cm, weight_kg, last_checkup, status, conditions, allergies, medication, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const r of read("health_records.csv")) {
      insHealth.run(
        studentId(r.admission_no),
        r.blood_group,
        num(r.height_cm),
        num(r.weight_kg),
        opt(r.last_checkup),
        r.status,
        r.conditions,
        r.allergies,
        r.medication,
        r.remarks,
      );
    }

    const insAtt = db.prepare(
      "INSERT INTO attendance (student_id, date, status, reason_id, illness_id, entered_by) VALUES (?, ?, ?, ?, ?, ?)",
    );
    const ids = new Map<string, number>();
    const cached = (key: string, find: () => number) => ids.get(key) ?? (ids.set(key, find()), ids.get(key)!);
    for (const r of read("attendance.csv")) {
      insAtt.run(
        cached(`s:${r.admission_no}`, () => studentId(r.admission_no)),
        r.date,
        r.status,
        r.reason ? cached(`r:${r.reason}`, () => reasonId(r.reason)) : null,
        r.illness ? cached(`i:${r.illness}`, () => illnessId(r.illness)) : null,
        cached(`u:${r.entered_by}`, () => userId(r.entered_by)),
      );
    }

    const insItem = db.prepare("INSERT INTO inventory_items (name, category, unit, min_level) VALUES (?, ?, ?, ?)");
    for (const r of read("stock_items.csv")) insItem.run(r.item, r.category, r.unit, Number(r.minimum_level));
    const insTx = db.prepare(
      "INSERT INTO stock_transactions (item_id, type, quantity, date, expiry_date, note, entered_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    for (const r of read("stock_entries.csv")) {
      insTx.run(
        cached(`it:${r.item}`, () => itemId(r.item)),
        r.type,
        Number(r.quantity),
        r.date,
        opt(r.expiry_date),
        opt(r.note),
        cached(`u:${r.entered_by}`, () => userId(r.entered_by)),
      );
    }

    const insCase = db.prepare(
      "INSERT INTO health_cases (student_id, illness_id, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    );
    for (const r of read("health_cases.csv")) {
      insCase.run(studentId(r.admission_no), illnessId(r.illness), r.status, r.notes, stamp(r.opened_on, "16:20"), stamp(r.updated_on, "11:45"));
    }

    // Let the rules look at the records, as they would after every entry.
    runAllRules(db, today);

    // Date each alert from when its problem started, not from the import.
    const alerts = db.prepare("SELECT id, rule, item_id, trigger_date FROM alerts").all() as {
      id: number;
      rule: string;
      item_id: number | null;
      trigger_date: string;
    }[];
    for (const a of alerts) {
      let since = a.trigger_date;
      if (a.item_id) {
        const sql =
          a.rule === "expiring_stock"
            ? "SELECT MAX(date) AS d FROM stock_transactions WHERE item_id = ? AND type = 'in' AND expiry_date IS NOT NULL"
            : "SELECT MAX(date) AS d FROM stock_transactions WHERE item_id = ? AND type = 'out'";
        since = (db.prepare(sql).get(a.item_id) as { d: string | null }).d ?? since;
      }
      db.prepare("UPDATE alerts SET created_at = ?, trigger_date = ? WHERE id = ?").run(stamp(since, "17:05"), since, a.id);
    }
  })();
}
