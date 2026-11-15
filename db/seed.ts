// Demo data. Owner: D (Database, constraints and seed data).
//
// Everything here is INVENTED. The names are common Karnataka names chosen to
// look realistic, but no record describes a real child, staff member or
// donor. The data is generated relative to "today", so the demo works on any
// date, and the same date always gives the same data.
//
// What it contains:
//   * 2 staff logins, 40 children in Classes 5 to 8 and four dorms. The
//     children come from poor families in and around Bangalore, so the names
//     are the everyday Kannada, Tamil, Telugu and Urdu names written the way a
//     government school register writes them (name and initial). They all go
//     to the same government school.
//   * 90 days of attendance (no school on Sundays or second Saturdays),
//     ordinary absences, and a fever that went round about two weeks ago
//   * 90 days of stock: opening count, monthly purchases, donations, and
//     regular issues to the kitchen, dorms, sick room and school
//   * past health cases that the rules raised and the manager resolved
//
// Patterns planted for the demo (see docs/PRESENTATION.md):
//   1. Shivakumar N (Class 6) has 2 asthma absences in the last 30 days, and an
//      asthma case from two months ago. Marking a 3rd asthma absence live
//      raises a CRITICAL alert and opens a new health case.
//   2. Rice is 3 kg above its minimum. Recording 5 kg used live raises a
//      low-stock WARNING.
//   Already active at the start:
//   3. Imran Pasha (Class 6): 3 fever absences. Critical alert
//      acknowledged; health case "Scheduled" for a blood test.
//   4. Lakshmi K (Class 7): attendance below 85%. Warning.
//   5. Paracetamol syrup from a donation expires in 20 days. Warning.
//   6. Bath soap is below its minimum. Warning.

import type { DB } from "../lib/db";
import { addDays, formatDate, isSchoolDay } from "../lib/dates";
import { amount } from "../lib/format";
import { hashPassword } from "../lib/password";
import { runAllRules, runStudentRules } from "../lib/rules/engine";

export const DEMO_LOGINS = [
  { username: "anita", password: "manager123", name: "Anita D'Souza", role: "manager" },
  { username: "manjunath", password: "warden123", name: "Manjunath Gowda", role: "warden" },
] as const;

/** Names used by the demo script and the tests. */
export const DEMO = {
  asthmaChild: "Shivakumar N",
  feverChild: "Imran Pasha",
  lowAttendanceChild: "Lakshmi K",
  skinChild: "Bhagya S",
  rice: "Rice (Sona Masoori)",
  riceStart: 53,
  riceMinimum: 50,
} as const;

// name, class, boy or girl
const CHILDREN: [string, string, "B" | "G"][] = [
  ["Yallappa H", "Class 5", "B"], ["Gowri M", "Class 5", "G"], ["Muniraju S", "Class 5", "B"],
  ["Bhagya S", "Class 5", "G"], ["Nagesh K", "Class 5", "B"], ["Shabana Banu", "Class 5", "G"],
  ["Hanumantha R", "Class 5", "B"], ["Renuka D", "Class 5", "G"], ["Ravi Kumar M", "Class 5", "B"],

  ["Shivakumar N", "Class 6", "B"], ["Kaveri L", "Class 6", "G"], ["Darshan K", "Class 6", "B"],
  ["Chaitra R", "Class 6", "G"], ["Imran Pasha", "Class 6", "B"], ["Pavithra M", "Class 6", "G"],
  ["Santhosh Kumar V", "Class 6", "B"], ["Sowmya B", "Class 6", "G"], ["Venkatesh P", "Class 6", "B"],
  ["Ramya N", "Class 6", "G"], ["Anand Raj S", "Class 6", "B"],

  ["Lakshmi K", "Class 7", "G"], ["Prakash M", "Class 7", "B"], ["Asha D", "Class 7", "G"],
  ["Joseph Raj", "Class 7", "B"], ["Mamatha S", "Class 7", "G"], ["Mahesh B", "Class 7", "B"],
  ["Nandini R", "Class 7", "G"], ["Syed Salman", "Class 7", "B"], ["Divya N", "Class 7", "G"],
  ["Mallesh H", "Class 7", "B"], ["Rekha T", "Class 7", "G"],

  ["Murugan S", "Class 8", "B"], ["Anitha Mary", "Class 8", "G"], ["Kiran Kumar R", "Class 8", "B"],
  ["Selvi P", "Class 8", "G"], ["Ganesh M", "Class 8", "B"], ["Bindu N", "Class 8", "G"],
  ["Raghu N", "Class 8", "B"], ["Shilpa K", "Class 8", "G"], ["Nagaraj T", "Class 8", "B"],
];

export const SCHOOL = "Govt. Model Higher Primary School, Hoskote";

const REASONS = [
  { name: "Medical", medical: 1 },
  { name: "Family visit", medical: 0 },
  { name: "Festival or function", medical: 0 },
  { name: "Other", medical: 0 },
];

const ILLNESSES = ["Asthma", "Fever", "Cold and cough", "Stomach upset", "Skin infection", "Eye infection", "Injury", "Dental problem"];

type Category = "Food" | "Medicine" | "Hygiene" | "Stationery";

type ItemSpec = {
  name: string;
  category: Category;
  unit: string;
  min: number;
  perDay: number; // typical use
  final: number; // balance today
  expiryDays: number | null; // shelf life of each delivery
  tight?: boolean; // ran short once in the first month (gives a resolved alert)
};

const ITEMS: ItemSpec[] = [
  { name: DEMO.rice, category: "Food", unit: "kg", min: DEMO.riceMinimum, perDay: 9, final: DEMO.riceStart, expiryDays: 180 },
  { name: "Ragi flour", category: "Food", unit: "kg", min: 15, perDay: 3, final: 31, expiryDays: 90 },
  { name: "Toor dal", category: "Food", unit: "kg", min: 12, perDay: 2, final: 27, expiryDays: 180, tight: true },
  { name: "Wheat atta", category: "Food", unit: "kg", min: 10, perDay: 1.5, final: 22, expiryDays: 90 },
  { name: "Sunflower oil", category: "Food", unit: "L", min: 8, perDay: 1.2, final: 17, expiryDays: 180, tight: true },
  { name: "Sugar", category: "Food", unit: "kg", min: 6, perDay: 1, final: 14, expiryDays: 365 },

  { name: "Paracetamol syrup (250 mg/5 ml)", category: "Medicine", unit: "bottle", min: 4, perDay: 0.3, final: 9, expiryDays: 540 },
  { name: "ORS sachets", category: "Medicine", unit: "sachet", min: 20, perDay: 0.7, final: 46, expiryDays: 540 },
  { name: "Salbutamol inhaler", category: "Medicine", unit: "pcs", min: 2, perDay: 0.05, final: 3, expiryDays: 400 },
  { name: "Povidone-iodine solution", category: "Medicine", unit: "bottle", min: 2, perDay: 0.1, final: 5, expiryDays: 700 },
  { name: "Cetirizine tablets (strip of 10)", category: "Medicine", unit: "strip", min: 3, perDay: 0.15, final: 7, expiryDays: 600 },
  { name: "Calamine lotion", category: "Medicine", unit: "bottle", min: 2, perDay: 0.08, final: 4, expiryDays: 500 },

  { name: "Bath soap", category: "Hygiene", unit: "pcs", min: 25, perDay: 1.4, final: 18, expiryDays: null },
  { name: "Toothpaste (150 g)", category: "Hygiene", unit: "tube", min: 10, perDay: 0.7, final: 21, expiryDays: 700 },
  { name: "Detergent powder", category: "Hygiene", unit: "kg", min: 4, perDay: 0.5, final: 9, expiryDays: null },
  { name: "Coconut oil", category: "Hygiene", unit: "L", min: 2, perDay: 0.2, final: 5, expiryDays: 365 },
  { name: "Sanitary pads (pack of 8)", category: "Hygiene", unit: "pack", min: 10, perDay: 0.6, final: 24, expiryDays: null },

  { name: "Notebooks (172 pages)", category: "Stationery", unit: "pcs", min: 30, perDay: 1.5, final: 64, expiryDays: null },
  { name: "Pencils (box of 10)", category: "Stationery", unit: "box", min: 5, perDay: 0.2, final: 11, expiryDays: null },
  { name: "Ball pens", category: "Stationery", unit: "pcs", min: 20, perDay: 0.8, final: 37, expiryDays: null },
];

const ISSUE: Record<Category, { every: number; note: string }> = {
  Food: { every: 2, note: "Issued to kitchen" },
  Medicine: { every: 5, note: "Issued from sick room" },
  Hygiene: { every: 7, note: "Issued to dorms" },
  Stationery: { every: 10, note: "Issued for school" },
};

const PURCHASE: Record<Category, { daysAgo: number[]; note: string }> = {
  Food: { daysAgo: [61, 30], note: "Monthly purchase, wholesale market" },
  Medicine: { daysAgo: [45], note: "Purchase, medical store" },
  Hygiene: { daysAgo: [61, 30], note: "Monthly purchase, general store" },
  Stationery: { daysAgo: [61], note: "Purchase, stationery shop" },
};

// Donations: item name -> [days ago, note]
const DONATIONS: Record<string, [number, string]> = {
  [DEMO.rice]: [20, "Donation in kind (rice bags)"],
  "Paracetamol syrup (250 mg/5 ml)": [15, "Donation in kind (medicines)"],
  "Bath soap": [40, "Donation in kind (hygiene kits)"],
  "Notebooks (172 pages)": [50, "Donation in kind (school kit drive)"],
};

const HISTORY_DAYS = 90;

/** Small deterministic random number generator, so every reset is identical. */
function randomFrom(seedValue: number) {
  let a = seedValue;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const stamp = (date: string, time = "10:30") => {
  // Store as UTC, matching how the app stores live timestamps (India is UTC+5:30).
  const [h, m] = time.split(":").map(Number);
  const minutes = h * 60 + m - 330;
  const day = minutes < 0 ? addDays(date, -1) : date;
  const total = (minutes + 1440) % 1440;
  return `${day}T${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}:00.000Z`;
};

export function seed(db: DB, today: string): void {
  const rand = randomFrom(20261115);
  const pick = <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)];

  const run = db.transaction(() => {
    // --- Logins ------------------------------------------------------------
    const insUser = db.prepare("INSERT INTO users (username, name, password_hash, role) VALUES (?, ?, ?, ?)");
    for (const u of DEMO_LOGINS) insUser.run(u.username, u.name, hashPassword(u.password), u.role);
    const userId = (username: string) => (db.prepare("SELECT id FROM users WHERE username = ?").get(username) as { id: number }).id;
    const managerId = userId("anita");
    const wardenId = userId("manjunath");

    // --- Lookup lists ------------------------------------------------------
    const insReason = db.prepare("INSERT INTO absence_reasons (name, is_medical) VALUES (?, ?)");
    for (const r of REASONS) insReason.run(r.name, r.medical);
    const insIllness = db.prepare("INSERT INTO illnesses (name) VALUES (?)");
    for (const i of ILLNESSES) insIllness.run(i);
    const reasonId = (name: string) => REASONS.findIndex((r) => r.name === name) + 1;
    const illnessId = (name: string) => ILLNESSES.indexOf(name) + 1;

    // --- Children ----------------------------------------------------------
    const year = Number(today.slice(0, 4));
    const insStudent = db.prepare(
      "INSERT INTO students (name, dob, class_name, room, school, admitted_on) VALUES (?, ?, ?, ?, ?, ?)",
    );
    let boys = 0;
    let girls = 0;
    for (const [name, className, sex] of CHILDREN) {
      const grade = Number(className.split(" ")[1]);
      const age = grade + 5 + (rand() < 0.2 ? 1 : 0);
      const dob = `${year - age}-${String(1 + Math.floor(rand() * 12)).padStart(2, "0")}-${String(1 + Math.floor(rand() * 28)).padStart(2, "0")}`;
      const room = sex === "B" ? `Boys' Dorm ${(boys++ % 2) + 1}` : `Girls' Dorm ${(girls++ % 2) + 1}`;
      const school = SCHOOL;
      const admitted = `${year - 1 - Math.floor(rand() * Math.min(6, grade - 1))}-06-${String(1 + Math.floor(rand() * 20)).padStart(2, "0")}`;
      insStudent.run(name, dob, className, room, school, admitted);
    }
    const studentId = (name: string) => CHILDREN.findIndex((c) => c[0] === name) + 1;

    // --- Attendance --------------------------------------------------------
    const schoolDays: string[] = [];
    for (let back = HISTORY_DAYS; back >= 1; back--) {
      const d = addDays(today, -back);
      if (isSchoolDay(d)) schoolDays.push(d);
    }
    const n = schoolDays.length;
    /** The school day `k` school days before today (1 = the last school day). */
    const dayBack = (k: number) => schoolDays[n - k];

    type Absence = { reason: number; illness: number | null };
    const absences = new Map<string, Absence>(); // `${studentId}|${date}`
    const absent = (id: number, k: number, reason: string, illness: string | null = null) =>
      absences.set(`${id}|${dayBack(k)}`, { reason: reasonId(reason), illness: illness ? illnessId(illness) : null });

    const randomAbsence = (id: number, k: number) => {
      const r = rand();
      if (r < 0.42) absent(id, k, "Medical", pick(["Fever", "Cold and cough", "Cold and cough", "Stomach upset", "Dental problem", "Eye infection", "Injury"]));
      else if (r < 0.72) absent(id, k, "Family visit");
      else if (r < 0.86) absent(id, k, "Festival or function");
      else absent(id, k, "Other");
    };

    const arjun = studentId(DEMO.asthmaChild);
    const irfan = studentId(DEMO.feverChild);
    const keerthana = studentId(DEMO.lowAttendanceChild);
    const sinchana = studentId(DEMO.skinChild);
    const planted = new Set([arjun, irfan, keerthana]);

    // A fever went round about two weeks ago.
    const feverRound: [string, number][] = [["Darshan K", 9], ["Kaveri L", 10], ["Asha D", 10], ["Yallappa H", 11], ["Murugan S", 12]];
    const feverKids = new Map(feverRound.map(([name, k]) => [studentId(name), k]));

    for (let id = 1; id <= CHILDREN.length; id++) {
      if (planted.has(id)) continue;
      // Last 30 school days: at most 2 absences, never on neighbouring days,
      // so ordinary children never trigger a rule by accident.
      const used = new Set<number>();
      if (feverKids.has(id)) {
        const k = feverKids.get(id)!;
        absent(id, k, "Medical", "Fever");
        used.add(k);
      }
      const r = rand();
      const want = (r < 0.45 ? 0 : r < 0.85 ? 1 : 2) + used.size;
      let tries = 0;
      while (used.size < Math.min(want, 2) && tries++ < 50) {
        const k = 1 + Math.floor(rand() * 30);
        if (used.has(k) || used.has(k - 1) || used.has(k + 1)) continue;
        used.add(k);
        randomAbsence(id, k);
      }
      // Older history: occasional absences.
      for (let k = 31; k <= n; k++) {
        if (id === sinchana && k <= 70) continue; // keep her past case clean
        if (rand() < 0.025) randomAbsence(id, k);
      }
    }

    // Planted 1: Shivakumar. Asthma case two months ago, and 2 asthma absences now.
    absent(arjun, 62, "Medical", "Asthma");
    absent(arjun, 58, "Medical", "Asthma");
    absent(arjun, 55, "Medical", "Asthma");
    absent(arjun, 41, "Family visit");
    absent(arjun, 10, "Medical", "Asthma");
    absent(arjun, 4, "Medical", "Asthma");

    // Planted 3: Imran. Three days of fever in a row, a week ago.
    absent(irfan, 9, "Medical", "Fever");
    absent(irfan, 8, "Medical", "Fever");
    absent(irfan, 7, "Medical", "Fever");
    absent(irfan, 47, "Family visit");

    // Planted 4: Lakshmi. Six absences in the last month.
    absent(keerthana, 3, "Family visit");
    absent(keerthana, 7, "Medical", "Fever");
    absent(keerthana, 11, "Festival or function");
    absent(keerthana, 15, "Medical", "Stomach upset");
    absent(keerthana, 19, "Family visit");
    absent(keerthana, 23, "Other");
    absent(keerthana, 52, "Family visit");

    // Bhagya: skin infection five weeks ago (a resolved case).
    absent(sinchana, 38, "Medical", "Skin infection");
    absent(sinchana, 35, "Medical", "Skin infection");
    absent(sinchana, 33, "Medical", "Skin infection");

    const insAtt = db.prepare(
      "INSERT INTO attendance (student_id, date, status, reason_id, illness_id, entered_by) VALUES (?, ?, ?, ?, ?, ?)",
    );
    for (const date of schoolDays) {
      for (let id = 1; id <= CHILDREN.length; id++) {
        const a = absences.get(`${id}|${date}`);
        if (a) insAtt.run(id, date, "absent", a.reason, a.illness, wardenId);
        else insAtt.run(id, date, "present", null, null, wardenId);
      }
    }

    // --- Stock -------------------------------------------------------------
    const insItem = db.prepare("INSERT INTO inventory_items (name, category, unit, min_level) VALUES (?, ?, ?, ?)");
    const insTx = db.prepare(
      "INSERT INTO stock_transactions (item_id, type, quantity, date, expiry_date, note, entered_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    const insHistoricAlert = db.prepare(
      `INSERT INTO alerts (rule, severity, item_id, message, dedupe_key, trigger_date, status, created_at, resolved_at)
       VALUES ('low_stock', 'warning', ?, ?, ?, ?, 'resolved', ?, ?)`,
    );
    const lastIssue = new Map<number, string>();

    for (const spec of ITEMS) {
      const itemId = Number(insItem.run(spec.name, spec.category, spec.unit, spec.min).lastInsertRowid);
      const issue = ISSUE[spec.category];

      // Deliveries, oldest first.
      type Delivery = { back: number; note: string; by: number; expiry: string | null; qty: number };
      const deliveries: Delivery[] = [{ back: HISTORY_DAYS, note: "Opening stock count", by: managerId, expiry: null, qty: 0 }];
      for (const back of PURCHASE[spec.category].daysAgo) deliveries.push({ back, note: PURCHASE[spec.category].note, by: managerId, expiry: null, qty: 0 });
      const donation = DONATIONS[spec.name];
      if (donation) deliveries.push({ back: donation[0], note: donation[1], by: wardenId, expiry: null, qty: 0 });
      deliveries.sort((a, b) => b.back - a.back);
      for (const d of deliveries) {
        const date = addDays(today, -d.back);
        d.expiry = spec.expiryDays === null ? null : addDays(date, spec.expiryDays);
      }
      // The donated paracetamol was close to its expiry date.
      if (spec.name.startsWith("Paracetamol")) deliveries[deliveries.length - 1].expiry = addDays(today, 20);

      // Issues: regular, with some variation, rounded to whole units.
      type Issue = { back: number; qty: number };
      const issues: Issue[] = [];
      for (let back = HISTORY_DAYS - 1; back >= 1; back -= issue.every) {
        const qty = Math.round(spec.perDay * issue.every * (0.8 + rand() * 0.4));
        if (qty > 0) issues.push({ back, qty });
      }

      // Size each delivery so stock lasts until the next one. "Tight" items
      // ran below their minimum once before the first monthly purchase.
      const usedBetween = (from: number, to: number) => issues.filter((i) => i.back < from && i.back >= to).reduce((s, i) => s + i.qty, 0);
      let carry = 0;
      deliveries.forEach((d, idx) => {
        const next = deliveries[idx + 1];
        const use = usedBetween(d.back + 1, next ? next.back : 0);
        const leftover = next ? Math.round(spec.tight && idx === 0 ? spec.min * 0.6 : spec.min * 1.3) : spec.final;
        d.qty = Math.max(1, use + leftover - carry);
        carry = carry + d.qty - use;
      });

      // Write the ledger in date order and watch the balance.
      const events = [
        ...deliveries.map((d) => ({ back: d.back, order: 0, d })),
        ...issues.map((i) => ({ back: i.back, order: 1, i })),
      ].sort((a, b) => b.back - a.back || a.order - b.order);
      let balance = 0;
      let lowSince: string | null = null;
      let lowBalance = 0;
      for (const e of events) {
        const date = addDays(today, -e.back);
        if ("d" in e && e.d) {
          insTx.run(itemId, "in", e.d.qty, date, e.d.expiry, e.d.note, e.d.by);
          balance += e.d.qty;
          if (lowSince && balance >= spec.min) {
            insHistoricAlert.run(
              itemId,
              `${spec.name}: ${amount(lowBalance, spec.unit)} left, below the minimum of ${amount(spec.min, spec.unit)}.`,
              `stock:${itemId}`,
              lowSince,
              stamp(lowSince, "17:10"),
              stamp(date, "11:45"),
            );
            lowSince = null;
          }
        } else if ("i" in e && e.i) {
          const qty = Math.min(e.i.qty, balance);
          if (qty <= 0) continue;
          insTx.run(itemId, "out", qty, date, null, issue.note, wardenId);
          balance -= qty;
          lastIssue.set(itemId, date);
          if (balance < spec.min && !lowSince) {
            lowSince = date;
            lowBalance = balance;
          }
        }
      }
      // Correct any rounding so today's balance is exactly as planned.
      if (balance !== spec.final) {
        const diff = spec.final - balance;
        const date = addDays(today, -1);
        if (diff > 0) insTx.run(itemId, "in", diff, date, null, "Stock count correction", managerId);
        else insTx.run(itemId, "out", -diff, date, null, issue.note, wardenId);
      }
    }

    // --- History: past cases the rules raised and the manager resolved ------
    const resolveCase = (student: number, raisedOn: string, daysToResolve: number, notes: string) => {
      runStudentRules(db, student, raisedOn);
      const alert = db
        .prepare("SELECT id FROM alerts WHERE student_id = ? AND rule = 'repeated_illness' AND status = 'open'")
        .get(student) as { id: number };
      const resolvedOn = addDays(raisedOn, daysToResolve);
      db.prepare("UPDATE alerts SET status = 'resolved', created_at = ?, resolved_at = ? WHERE id = ?").run(
        stamp(raisedOn, "16:20"),
        stamp(resolvedOn, "12:00"),
        alert.id,
      );
      db.prepare("UPDATE health_cases SET status = 'resolved', notes = ?, created_at = ?, updated_at = ? WHERE alert_id = ?").run(
        notes,
        stamp(raisedOn, "16:20"),
        stamp(resolvedOn, "12:00"),
        alert.id,
      );
    };

    const arjunRaised = dayBack(55);
    resolveCase(
      arjun,
      arjunRaised,
      16,
      `Seen at the Primary Health Centre on ${formatDate(addDays(arjunRaised, 2))}. Mild asthma. Salbutamol inhaler prescribed, kept in the sick room. Avoid dust when dorms are cleaned. Review if attacks come back.`,
    );
    const sinchanaRaised = dayBack(33);
    resolveCase(
      sinchana,
      sinchanaRaised,
      14,
      "Fungal skin infection, probably from damp bedding during the rains. Ointment for two weeks. All bedding in her dorm washed and sun-dried. Cleared at follow-up.",
    );

    // --- Today: let the rules look at everything ----------------------------
    runAllRules(db, today);

    // Imran's alert was raised a week ago and the manager has acted on it.
    const irfanRaised = dayBack(7);
    const irfanAlert = db.prepare("SELECT id FROM alerts WHERE student_id = ? AND rule = 'repeated_illness' AND status = 'open'").get(irfan) as { id: number };
    db.prepare("UPDATE alerts SET status = 'acknowledged', created_at = ? WHERE id = ?").run(stamp(irfanRaised, "16:05"), irfanAlert.id);
    db.prepare("UPDATE health_cases SET status = 'scheduled', notes = ?, created_at = ?, updated_at = ? WHERE alert_id = ?").run(
      `Fever on and off for three days, settled with paracetamol. Blood test booked at the Primary Health Centre for ${formatDate(addDays(today, 1))} to rule out dengue.`,
      stamp(irfanRaised, "16:05"),
      stamp(addDays(irfanRaised, 1), "09:40"),
      irfanAlert.id,
    );

    // The other open alerts: dated to when the problem started.
    db.prepare("UPDATE alerts SET created_at = ? WHERE rule = 'low_attendance' AND status = 'open'").run(stamp(dayBack(3), "16:30"));
    for (const a of db.prepare("SELECT id, item_id, rule FROM alerts WHERE item_id IS NOT NULL AND status = 'open'").all() as {
      id: number;
      item_id: number;
      rule: string;
    }[]) {
      const since =
        a.rule === "expiring_stock"
          ? addDays(today, -DONATIONS["Paracetamol syrup (250 mg/5 ml)"][0])
          : (lastIssue.get(a.item_id) ?? today);
      db.prepare("UPDATE alerts SET created_at = ?, trigger_date = ? WHERE id = ?").run(stamp(since, "18:15"), since, a.id);
    }
  });
  run();
}
