# Roles: who owns what

Five people, five areas. "Owns" means: you have read every file in your area,
you can run it and change it, you record what you do in your worklog, and you
present it and answer questions on it in the viva.

The code was built in one session with an AI coding assistant
([README](../README.md#how-this-was-built)). Owning an area therefore starts
with **reading and understanding it**, using the checklists below.

| Role | Area | Member | Worklog |
|---|---|---|---|
| [F1](#f1) | Manager screens: dashboard, alerts, health cases | Adhira Praveen | [worklogs/F1.md](worklogs/F1.md) |
| [F2](#f2) | Warden phone screens: attendance, stock | Neha S | [worklogs/F2.md](worklogs/F2.md) |
| [B1](#b1) | Login, permissions and APIs | Ashika Valencia A | [worklogs/B1.md](worklogs/B1.md) |
| [B2](#b2) | The three rules, alerts and testing | Joseph Mangali | [worklogs/B2.md](worklogs/B2.md) |
| [D](#d) | Records and database | Joel Thomas Mario | [worklogs/D.md](worklogs/D.md) |

**In one line each**

- **F1:** what the manager sees and does on the laptop.
- **F2:** what the warden taps on the phone.
- **B1:** who is allowed to do what, and the APIs the screens call.
- **B2:** the three rules that turn records into alerts, and the tests that prove them.
- **D:** the home's records, where everything is stored, and the constraints that keep it correct.

What to say in the presentation, the screenshots to use and the questions to
expect are in [VIVA_GUIDE.md](VIVA_GUIDE.md).

---

## F1

**Manager screens: dashboard, alerts, health cases.**

### Your files

| File | What it is |
|---|---|
| `app/manager/layout.tsx` | The manager's frame: side navigation with alert and case counts |
| `app/manager/page.tsx` | Dashboard: four number cards, absence chart, absence reasons, alerts, low stock |
| `app/manager/alerts/page.tsx` | Alert centre, sorted by status then severity |
| `app/manager/cases/page.tsx` | Health cases board with four columns |
| `app/manager/stock/page.tsx` | Stock table and latest entries |
| `app/manager/students/` | Student list and profile |
| `components/manager/` | `AbsenceChart`, `AlertActions`, `CaseCard`, `ResetButton`, `StudentsTable` |
| `components/ui.tsx`, `components/NavLinks.tsx`, `components/icons.tsx`, `components/Brand.tsx` | Shared components, icons and the logo, used by both sets of screens |

### Understand before you present

- [ ] Which pages are server components (they read the database directly) and which parts are client components (`"use client"`: the buttons)
- [ ] How a button changes data: it calls an API route with `fetch`, then `router.refresh()` reloads the page's data
- [ ] How the absence chart is drawn (plain `div` bars, no chart library) and why days with 3 or more absences are highlighted
- [ ] Why the case card saves notes when you leave the box, and moves one column at a time
- [ ] Where colour carries meaning (red = critical, amber = warning, green = fine) and that the text always says it too

**Without F1:** alerts are raised but the manager has nowhere to see or act on them.

---

## F2

**Warden phone screens: attendance, stock.**

### Your files

| File | What it is |
|---|---|
| `app/warden/layout.tsx` | The warden's frame: top bar and bottom tabs |
| `app/warden/page.tsx` | Today screen: greeting, each class marked or not, shortcuts to the store, recent entries |
| `app/warden/attendance/page.tsx` | Loads the class and passes it to the form |
| `components/warden/AttendanceForm.tsx` | The attendance screen itself |
| `app/warden/stock/page.tsx`, `components/warden/StockForm.tsx` | Stock in and stock out |
| `app/warden/students/page.tsx` | Student list (name, class, room only) |
| `app/login/` | The login screen |

### Understand before you present

- [ ] The speed idea: everyone starts as present, so the warden only taps the absent children
- [ ] How the form checks that every absence has a reason, and a medical absence has an illness, before it sends anything
- [ ] What happens when attendance was already saved today (it loads what was saved and lets the warden correct it)
- [ ] Why the Save bar is fixed at the bottom, and why the buttons are large (one thumb, cheap phone)
- [ ] What the warden is told after saving (only "Saved"), and why alerts are not shown to the warden
- [ ] Time yourself marking a class of 15 on a real phone, and write the number in your worklog

**Without F2:** no data gets into the system, so nothing can ever be flagged.

---

## B1

**Login, permissions and APIs.**

### Your files

| File | What it is |
|---|---|
| `lib/auth.ts` | Login check, sessions, `requireRole` (pages), `apiUser` (API routes) |
| `lib/password.ts` | Password hashing (salted scrypt) |
| `lib/api.ts` | Reads a request body and validates it with Zod |
| `lib/queries.ts` | Every read query the pages and routes use |
| `app/api/auth/` | Login and logout |
| `app/api/attendance/route.ts` | Load a class; save a class (then runs the rules) |
| `app/api/stock/route.ts` | Stock table; record stock in or out (then runs the rules) |
| `app/api/alerts/`, `app/api/cases/` | List and update alerts and health cases, manager only |
| `app/api/students/`, `app/api/lookups/` | Lists the screens need |

### Understand before you present

- [ ] What happens at login: password checked against a hash, random token stored in `sessions`, token sent as an http-only cookie
- [ ] That every page calls `requireRole` and every API route calls `apiUser`, so the check is on the server
- [ ] The three answers a request can get: 401 (not logged in), 403 (wrong role), 400 (bad input)
- [ ] How attendance is saved: every entry is checked first, then all rows are written in one transaction, then the rules run
- [ ] What "upsert" means here: saving the same class twice updates the rows instead of duplicating them
- [ ] The endpoint table in [CONTRACTS.md](CONTRACTS.md#c3-api-endpoints-b1)

**Without B1:** nobody can log in, and the screens have nothing to talk to.

---

## B2

**The three rules, alerts and testing.**

### Your files

| File | What it is |
|---|---|
| `lib/rules/rules.ts` | The three rules as plain functions, with their thresholds at the top |
| `lib/rules/engine.ts` | Reads the data, calls the rules, writes alerts and health cases, prevents duplicates |
| `lib/rules/rules.test.ts` | 24 tests of the rules on their edge cases |
| `lib/rules/engine.test.ts` | 25 tests against the home's records in a test database, including both presentation flows |

### Understand before you present

- [ ] Each rule's exact condition and threshold ([CONTRACTS.md](CONTRACTS.md#c4-rules-and-alert-format-b2))
- [ ] Why the rules are split in two files: `rules.ts` decides, `engine.ts` reads and writes. The split is what makes them easy to test
- [ ] The three ways a duplicate alert is prevented: an active alert with the same key blocks a new one; a repeated-illness alert needs a new absence; other alerts wait 7 days after being resolved
- [ ] The edge cases the tests pin down: exactly 3 absences fires, 2 does not; day 29 counts, day 30 does not; exactly 85% does not fire; balance equal to the minimum is not low
- [ ] Run `npm test` and be able to show it passing live
- [ ] Why this is not AI: nothing is learned or predicted; every alert can be explained by pointing at the records that caused it

**Without B2:** CareTrack is only a record book. It never notices anything.

---

## D

**Records and database.**

### Your files

| File | What it is |
|---|---|
| `data/records/` | The home's registers as CSV files: children, health records, attendance, stock, health cases, staff |
| `db/schema.sql` | Eleven tables, one trigger, one view, and the constraints |
| `db/import.ts`, `lib/csv.ts` | Reads the CSV files and loads them into the database |
| `lib/db.ts` | Opens the database, creates it on first run, resets it |
| `scripts/reset-db.ts` | `npm run db:reset` |

### Understand before you present

- [ ] The eleven tables and how they link ([CONTRACTS.md](CONTRACTS.md#c1-database-tables-d))
- [ ] The four rules the database enforces by itself: one attendance row per child per day; an absence must have a reason; stock can never go below zero; the same alert cannot be active twice
- [ ] How the stock trigger works: adding a transaction updates the item's balance, and if that would go negative the whole entry is rejected
- [ ] What the `attendance_30d` view calculates
- [ ] What each record file holds, how `db/import.ts` loads them in order, and what happens when a record is wrong
- [ ] Why SQLite: the whole database is one file, with nothing to install or sign up for
- [ ] Why real children's records must never be committed to GitHub

**Without D:** there is nowhere to store anything, and nothing stops bad data getting in.

---

## Feature × role matrix

Read across a row to see who to ask.

| Feature | D | B1 | B2 | F1 | F2 |
|---|---|---|---|---|---|
| Login and roles | `users`, `sessions` | Login, role checks | | Manager frame | Login screen, warden frame |
| Students | Table, records | Queries, API | | List and profile | List |
| Attendance | Table, constraints, 30-day view | Save and load API | Two attendance rules | Chart, reasons | Entry screen |
| Stock | Tables, balance trigger | API | Low stock and expiry rules | Stock table | Entry screen |
| Alerts | Table, one-active index | API | Raises them, no duplicates | Alert centre | |
| Health cases | Table | API, one step at a time | Opens them automatically | Cases board | |
| Dashboard | View | Dashboard query | | Dashboard | |

## Shared by all five

- Read [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) so you can explain the whole system, not only your part.
- Run the app yourself and do both presentation flows by hand.
- Tick the review checklist in your worklog and add your own notes.
- Present your own part and answer the questions on it.
- Protect the children's data.

## Coordinator

One of the five opens and closes the presentation, keeps the time, and is the
contact for the faculty guide.

Coordinator: Adhira Praveen
