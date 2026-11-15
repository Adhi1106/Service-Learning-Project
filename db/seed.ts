// Invented seed data. Owner: D (Database: Schema, Security & Seed Data).
//
// NOTHING here is real. Every name, date and number is made up so that the
// app can be built and demonstrated without any real child's data.
//
// The data is generated relative to "today", so the demo works on any date.
// Four patterns are planted on purpose so the rules can be shown:
//   1. Student 1 has 2 asthma absences in the last 30 days.
//      -> Marking a 3rd asthma absence live raises a CRITICAL alert.
//   2. Student 2 is absent 6 times in the last 30 days (below 85%).
//      -> A low-attendance WARNING exists from the start.
//   3. Rice is 2 kg above its minimum level.
//      -> Recording 5 kg used live raises a low-stock WARNING.
//   4. Paracetamol syrup expires in 20 days, and bath soap is below minimum.
//      -> Two stock WARNINGS exist from the start.

import type { DB } from "../lib/db";
import { addDays, isSunday } from "../lib/dates";
import { hashPassword } from "../lib/password";
import { runAllRules } from "../lib/rules/engine";

export const DEMO_LOGINS = [
  { username: "manager", password: "manager123", name: "Manager (demo)", role: "manager" },
  { username: "warden", password: "warden123", name: "Warden (demo)", role: "warden" },
] as const;

const STUDENT_NAMES = [
  "Aarav K.", "Bhavya S.", "Charan M.", "Divya R.", "Eshan P.", "Farah N.", "Gautam V.", "Harini T.",
  "Imran A.", "Jyothi B.", "Kiran D.", "Lakshmi G.", "Manoj H.", "Nandini J.", "Omkar L.",
  "Pooja C.", "Rahul E.", "Sahana F.", "Tarun I.", "Uma O.", "Varun Q.", "Wasim U.", "Yamini W.",
  "Zubin X.", "Anjali Y.", "Bharat Z.", "Chitra K.", "Deepak S.", "Esha M.", "Ganesh R.",
];

const REASONS = [
  { name: "Medical", medical: 1 },
  { name: "Family visit", medical: 0 },
  { name: "Festival or function", medical: 0 },
  { name: "Other", medical: 0 },
];

const ILLNESSES = ["Asthma", "Fever", "Stomach upset", "Cold and cough", "Skin infection", "Injury"];

// name, category, unit, minimum level, opening stock, used so far, expiry in days (null = none)
const ITEMS: [string, string, string, number, number, number, number | null][] = [
  ["Rice", "Food", "kg", 20, 120, 98, 240],
  ["Wheat flour", "Food", "kg", 15, 80, 42, 150],
  ["Toor dal", "Food", "kg", 10, 50, 26, 300],
  ["Cooking oil", "Food", "litre", 8, 40, 21, 200],
  ["Milk powder", "Food", "kg", 5, 20, 9, 120],
  ["Sugar", "Food", "kg", 8, 30, 14, 365],
  ["Paracetamol syrup", "Medicine", "bottle", 4, 12, 3, 20],
  ["ORS sachets", "Medicine", "sachet", 20, 100, 35, 400],
  ["Asthma inhaler", "Medicine", "pcs", 2, 6, 1, 280],
  ["Antiseptic liquid", "Medicine", "bottle", 2, 8, 3, 500],
  ["Bath soap", "Hygiene", "pcs", 10, 60, 52, null],
  ["Toothpaste", "Hygiene", "tube", 8, 40, 18, 420],
  ["Washing powder", "Hygiene", "kg", 5, 25, 11, null],
  ["Notebooks", "Stationery", "pcs", 30, 200, 90, null],
  ["Pencils", "Stationery", "pcs", 40, 300, 120, null],
];

export function seed(db: DB, today: string): void {
  const run = db.transaction(() => {
    // --- Logins ------------------------------------------------------------
    const insUser = db.prepare("INSERT INTO users (username, name, password_hash, role) VALUES (?, ?, ?, ?)");
    for (const u of DEMO_LOGINS) insUser.run(u.username, u.name, hashPassword(u.password), u.role);
    const wardenId = (db.prepare("SELECT id FROM users WHERE username = 'warden'").get() as { id: number }).id;

    // --- Lookup lists ------------------------------------------------------
    const insReason = db.prepare("INSERT INTO absence_reasons (name, is_medical) VALUES (?, ?)");
    for (const r of REASONS) insReason.run(r.name, r.medical);
    const insIllness = db.prepare("INSERT INTO illnesses (name) VALUES (?)");
    for (const i of ILLNESSES) insIllness.run(i);
    const MEDICAL = 1, FAMILY = 2, FESTIVAL = 3, OTHER = 4; // ids, in insert order
    const ASTHMA = 1, FEVER = 2, STOMACH = 3, COLD = 4;

    // --- Students: 30 children, two classes, four rooms ---------------------
    const insStudent = db.prepare("INSERT INTO students (name, dob, class_name, room) VALUES (?, ?, ?, ?)");
    STUDENT_NAMES.forEach((name, i) => {
      const className = i < 15 ? "Class 6" : "Class 7";
      const birthYear = Number(today.slice(0, 4)) - (i < 15 ? 11 : 12);
      const dob = `${birthYear}-${String((i % 12) + 1).padStart(2, "0")}-${String(((i * 7) % 27) + 1).padStart(2, "0")}`;
      insStudent.run(name, dob, className, `Room ${"ABCD"[i % 4]}`);
    });

    // --- Attendance: the last 60 days up to yesterday, no Sundays -----------
    const schoolDays: string[] = [];
    for (let back = 60; back >= 1; back--) {
      const d = addDays(today, -back);
      if (!isSunday(d)) schoolDays.push(d);
    }
    const n = schoolDays.length;
    /** The school day `k` school days before today (1 = the last school day). */
    const dayBack = (k: number) => schoolDays[n - k];

    type Absence = { reason: number; illness: number | null };
    const absences = new Map<string, Absence>(); // key: `${studentId}|${date}`
    const absent = (studentId: number, k: number, reason: number, illness: number | null = null) =>
      absences.set(`${studentId}|${dayBack(k)}`, { reason, illness });

    // Planted pattern 1: student 1, two asthma absences inside the window.
    absent(1, 4, MEDICAL, ASTHMA);
    absent(1, 9, MEDICAL, ASTHMA);

    // Planted pattern 2: student 2, six scattered absences, all different causes.
    absent(2, 3, FAMILY);
    absent(2, 7, MEDICAL, FEVER);
    absent(2, 11, OTHER);
    absent(2, 15, MEDICAL, STOMACH);
    absent(2, 19, FESTIVAL);
    absent(2, 23, MEDICAL, COLD);

    // Everyone else: one ordinary absence in the last month, and some have an
    // older one too. Not enough to trigger any rule.
    for (let id = 3; id <= STUDENT_NAMES.length; id++) {
      const medical = id % 3 === 0;
      const reason = medical ? MEDICAL : [FAMILY, FESTIVAL, OTHER][Math.floor(id / 2) % 3];
      const illness = medical ? [FEVER, STOMACH, COLD][Math.floor(id / 3) % 3] : null;
      absent(id, 5 + ((id * 7) % 18), reason, illness);
      if (id % 4 === 0) absent(id, 30 + (id % 15), FAMILY);
    }

    const insAtt = db.prepare(
      "INSERT INTO attendance (student_id, date, status, reason_id, illness_id, entered_by) VALUES (?, ?, ?, ?, ?, ?)",
    );
    for (const date of schoolDays) {
      for (let id = 1; id <= STUDENT_NAMES.length; id++) {
        const a = absences.get(`${id}|${date}`);
        if (a) insAtt.run(id, date, "absent", a.reason, a.illness, wardenId);
        else insAtt.run(id, date, "present", null, null, wardenId);
      }
    }

    // --- Stock: an opening delivery 50 days ago, then usage -----------------
    const insItem = db.prepare("INSERT INTO inventory_items (name, category, unit, min_level) VALUES (?, ?, ?, ?)");
    const insTx = db.prepare(
      "INSERT INTO stock_transactions (item_id, type, quantity, date, expiry_date, entered_by) VALUES (?, ?, ?, ?, ?, ?)",
    );
    for (const [name, category, unit, minLevel, opening, used, expiryInDays] of ITEMS) {
      const itemId = Number(insItem.run(name, category, unit, minLevel).lastInsertRowid);
      const expiry = expiryInDays === null ? null : addDays(today, expiryInDays);
      insTx.run(itemId, "in", opening, addDays(today, -50), expiry, wardenId);
      // Spread the usage over five entries. The trigger keeps the balance right.
      const each = Math.floor(used / 5);
      for (let part = 0; part < 5; part++) {
        const quantity = part < 4 ? each : used - each * 4;
        if (quantity > 0) insTx.run(itemId, "out", quantity, addDays(today, -40 + part * 9), null, wardenId);
      }
    }

    // --- Let the rules look at the seeded data ------------------------------
    runAllRules(db, today);
  });
  run();
}
