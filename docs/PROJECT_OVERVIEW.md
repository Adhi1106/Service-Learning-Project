# Project overview: what CareTrack is

The plain-language explanation of what CareTrack is and does. Everyone on the
team should be able to explain all of it, not only their own part.

This is a reduced version of the [original proposal](proposal/CareTrack_Project_Proposal.pdf).
**There is no AI or machine learning in it.** Where this file and the proposal
disagree, this file wins (see [DECISIONS.md](DECISIONS.md), D-006).

## 1. Who it is for

**Grace and Light Trust** runs a children's home in Hoskote, Karnataka. The
children live at the home and attend nearby schools.

| User | Device | What they do in CareTrack | What they cannot see |
|---|---|---|---|
| **Manager** | Laptop | Everything: dashboard, alerts, health cases, students, stock | Nothing is hidden |
| **Warden** | Mobile phone | Mark daily attendance with absence reasons; record stock in and out; view the student list | Alerts, health cases, the dashboard |

## 2. The problems we are solving

1. **Attendance.** Staff cannot see which children miss school, how often, or why.
2. **Health.** Repeated illness goes unnoticed. A child who misses school three times a month for asthma needs a doctor, but nobody connects the events.
3. **Stock.** Supplies and medicines run out or expire because nobody sees it coming.

The proposal also covers social wellbeing, donations and budget, academics and
scholarships. Those are out of scope for the one-day build.

## 3. What we build

### Built (all eight must-haves)

| # | Feature | Who uses it |
|---|---|---|
| 1 | **Login with two roles**, each seeing only their own screens | Both |
| 2 | **Student list and basic profile** (name, age, class, room) | Both |
| 3 | **Daily attendance on a phone:** everyone starts as present; tap the absent ones; pick a reason, and the illness if the reason is medical | Warden |
| 4 | **Stock in / stock out** for items (food, medicine, hygiene, stationery), with expiry date and a minimum level | Warden |
| 5 | **Three automatic rules** that raise alerts (section 5) | System |
| 6 | **Alert centre:** list of alerts by severity; acknowledge and resolve | Manager |
| 7 | **Health cases:** opened automatically by the illness rule; moved through Open → Scheduled → Under treatment → Resolved | Manager |
| 8 | **Dashboard:** today's attendance, open alerts, open health cases, low-stock items, a 30-day attendance chart | Manager |

Also built: the absence-reason breakdown on the dashboard, and a "Reset demo
data" button for the manager.

### Not built (possible next steps)

1. Marks entry and a "falling marks" rule
2. Donations and expenses log
3. Installable on the phone's home screen (PWA), with offline entry
4. Kannada labels on the warden screens
5. PDF health card
6. Deployment to a public server with https

### Cut from the proposal

Graph neural network and support-network module · Neo4j · resource and
donation forecasting · anomaly detection · what-if planner · Python ML service
· offline sync · scholarships · achievements · peer and activity logs · growth
charts · yearly check-up workflow · design system with 30+ components ·
usability testing at the trust · real data entry and staff training.

## 4. How the pieces fit together

```
     MANAGER (laptop)                    WARDEN (phone)
            |                                  |
     LOGIN + ROLE CHECK ON EVERY REQUEST              (B1)
            |                                  |
   Dashboard, alerts,                 Attendance entry,
   health cases (F1)                  stock entry, students (F2)
            |                                  |
            +---------------+------------------+
                            |
                  APIs with input checks                (B1)
                            |
        RULES run after each attendance or stock entry  (B2)
        and write alerts and health cases
                            |
   ================================================================
   SQLite database: students, attendance, stock, alerts, health
   cases. Constraints and a trigger keep the data correct.    (D)
   ================================================================
```

### The two flows we demo

If these two work end to end, the project works.

1. **Health.** The warden marks a child absent for asthma for the 3rd time in 30 days → a critical alert appears for the manager → a health case opens automatically → the manager moves it to Scheduled, then Under treatment, then Resolved.
2. **Stock.** The warden records rice being used → the balance drops below the item's minimum level → a warning alert appears → the item shows on the dashboard's low-stock list.

Plus one security check to show: logged in as the warden, the alert and health
pages are refused, and so are the API routes behind them.

## 5. The rules

Plain if-then checks on the data. No model, no training, no prediction.

| Rule | Fires when | Severity | Action |
|---|---|---|---|
| Repeated medical absence | ≥3 absences for the same illness within 30 days | Critical | Alert + open a health case |
| Low attendance | Below 85% over the last 30 days, or 3 or more absences in a row | Warning | Alert |
| Low stock / expiring | Balance below the item's minimum level, or expiry within 30 days | Warning | Alert + show on low-stock list |

A rule never raises the same alert twice for the same child or item while the
first one is still active. The exact conditions are in
[CONTRACTS.md](CONTRACTS.md#c4-rules-and-alert-format-b2).

Alerts are prompts for the manager to look at a child or an item. They are
never a judgement about a child.

## 6. Technology

| Layer | Technology |
|---|---|
| App | One Next.js 16 (React 19) app in TypeScript, with a manager area and a warden area |
| Styling | Tailwind CSS 4; charts drawn with plain HTML and CSS |
| Backend | Next.js API routes; Zod for input checks |
| Database | SQLite, through the `better-sqlite3` library. One file, nothing to install |
| Login | Our own: scrypt password hashes and session cookies |
| Tests | Vitest: 48 tests for the rules, the demo data and the database constraints |
| Hosting | Runs on a laptop; the phone connects over the same Wi-Fi. Not deployed publicly |

## 7. Data

Ten tables. The exact definition is in `db/schema.sql` and
[CONTRACTS.md](CONTRACTS.md#c1-database-tables-d).

| Table | Holds |
|---|---|
| `users` | One row per login, with the role (manager or warden) |
| `sessions` | Who is currently logged in |
| `students` | Name, date of birth, class, room |
| `absence_reasons` | Medical, family, other... |
| `illnesses` | Asthma, fever, stomach... |
| `attendance` | One row per child per day: present or absent, reason, illness |
| `inventory_items` | Name, category, unit, minimum level, current balance |
| `stock_transactions` | In or out, quantity, date, expiry date, who entered it |
| `alerts` | Rule, severity, child or item, status, created and resolved times |
| `health_cases` | Child, illness, status, notes, linked alert |

Constraints that matter: one attendance row per child per day; stock balance
can never go below zero.

## 8. Privacy

- **No real children's data** in the repository, the demo or any AI tool. The seed data is invented.
- The warden cannot read alerts, health cases or a child's history. The server checks the role on every page and every API route, not only in the menus.
- Passwords are stored only as salted hashes.
- The database file and any secrets are kept out of git.

## 9. How we will know it works

1. Both demo flows run end to end. **Done:** checked in a real browser.
2. Every rule has unit tests, and the planted patterns in the seed data raise exactly the expected alerts. **Done:** 48 tests.
3. A warden login is refused alerts and health cases at both the page and the API. **Done.**
4. Attendance for a class takes under 60 seconds on a phone. **To be timed by F2 on a real phone.**

## 10. What we hand in

1. The working app, with a manager login and a warden login, on invented data.
2. The source code on GitHub with this documentation.
3. Five worklogs, one per role.
4. A live demo where each member presents their own part.
