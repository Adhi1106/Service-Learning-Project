# Roles: who owns what

Five people, five roles, one day. "Owns" means: you build it, test it, write it
up in your worklog, and present it in the demo. Nothing in your area changes
without you knowing.

| Role | Title | Member | Worklog |
|---|---|---|---|
| [F1](#f1) | Frontend: Manager Dashboard & Alerts | ______ | [worklogs/F1.md](worklogs/F1.md) |
| [F2](#f2) | Frontend: Warden Mobile Screens | ______ | [worklogs/F2.md](worklogs/F2.md) |
| [B1](#b1) | Backend: Login, Permissions & APIs | ______ | [worklogs/B1.md](worklogs/B1.md) |
| [B2](#b2) | Backend: Rules, Alerts & Testing | ______ | [worklogs/B2.md](worklogs/B2.md) |
| [D](#d) | Database: Schema, Security & Seed Data | ______ | [worklogs/D.md](worklogs/D.md) |

**In one line each**

- **F1** builds what the manager sees on the laptop.
- **F2** builds what the warden taps on the phone.
- **B1** builds login, permissions and the APIs both frontends call, and deploys the app.
- **B2** builds the three rules that raise alerts, and leads testing.
- **D** builds the database, its access rules and the made-up data everyone develops against.

Times below refer to the blocks in [EXECUTION_PLAN.md](EXECUTION_PLAN.md).

---

## F1

**Frontend: Manager Dashboard & Alerts.**

### Deliverables

- [ ] App shell: layout, navigation, and the shared components both frontends use (buttons, cards, tables, forms, badges from shadcn/ui)
- [ ] **Dashboard:** today's attendance count, open alerts, open health cases, low-stock items, 30-day attendance chart
- [ ] **Alert centre:** alerts listed by severity, with acknowledge and resolve
- [ ] **Health cases board:** four columns (Open, Scheduled, Under treatment, Resolved) with a button to move a case forward
- [ ] Stock table for the manager, with low and expiring items marked

### Needs from others

| From | What | By |
|---|---|---|
| B1 | Running app with login; endpoints for dashboard numbers, alerts, health cases | Scaffold by 1:30, endpoints during Block 1 |
| B2 | Alert shape and statuses | Block 0 |
| D | Seed data to show on screen | 2:00 |

### Gives to others

| To | What |
|---|---|
| F2 | Shared components and layout, by 2:00 |

**Without F1:** alerts are raised but the manager has nowhere to see or act on them.

---

## F2

**Frontend: Warden Mobile Screens.**

### Deliverables

- [ ] **Attendance screen:** pick a class; everyone starts as present; tap the absent ones; pick a reason, and the illness when the reason is medical; save. Under 60 seconds for 30 children
- [ ] **Stock entry screen:** pick an item; stock in (with expiry date) or stock out; quantity; save
- [ ] **Student list and profile** (used by both roles)
- [ ] Everything works on a real phone screen with one thumb
- [ ] Clear messages when a save fails or an entry already exists for today

### Needs from others

| From | What | By |
|---|---|---|
| F1 | Shared components and layout | 2:00 |
| B1 | Endpoints for students, attendance, stock | Block 1 |
| D | Lists of absence reasons, illnesses and items | 2:00 |

### Gives to others

| To | What |
|---|---|
| B1, D | The exact fields each screen sends, agreed in Block 0 |
| B2 | Real entries flowing in, so the rules have something to check |

**Without F2:** no data gets into the system, so nothing can ever be flagged.

---

## B1

**Backend: Login, Permissions & APIs.**

### Deliverables

- [ ] Next.js project set up, pushed, and **deployed to Vercel by 1:30** (an empty app that everyone can build on)
- [ ] **Login** with Supabase Auth, and a **role check on every request** on the server
- [ ] **APIs:** students (list, read); attendance (save a class for a day, read by date); stock (list items, record in/out); alerts (list, acknowledge, resolve); health cases (list, change status); dashboard summary
- [ ] Input checks with Zod on everything that is saved
- [ ] Calls B2's rules after each attendance or stock save
- [ ] Final deployment, with environment variables set in Vercel and not in git

### Needs from others

| From | What | By |
|---|---|---|
| D | Supabase project, tables created, two test logins | 2:00 |
| B2 | The function to call after each save | Block 2 start |
| F1, F2 | The fields each screen sends and needs back | Block 0 |

### Gives to others

| To | What |
|---|---|
| F1, F2 | Every endpoint they call, with shapes that do not change after Block 0 without warning |
| Everyone | The running app and the live URL |

**Without B1:** nobody can log in, and the screens have nothing to talk to.

---

## B2

**Backend: Rules, Alerts & Testing.**

### Deliverables

- [ ] **Written rule specifications** (Block 0): exactly when each of the three rules fires and what clears it
- [ ] **The three rules** as small, separate functions: repeated medical absence, low attendance, low stock or expiring
- [ ] **No duplicate alerts:** the same rule does not fire again for the same child or item while an alert is open
- [ ] **Auto-open a health case** when the repeated-illness rule fires
- [ ] **Unit tests for every rule** (Vitest), including the edge cases: exactly 3 absences, day 30 versus day 31, exactly at the minimum level
- [ ] **Test lead in Block 3:** runs the manual checklist for both demo flows and the warden security check, and logs the bugs

### Needs from others

| From | What | By |
|---|---|---|
| D | Table shapes for attendance, stock, alerts, health cases; seed data with planted patterns | Block 0 (shapes), 2:00 (seed) |
| B1 | A hook to run the rules after each save | Block 2 start |

### Gives to others

| To | What |
|---|---|
| F1 | Alert shape, severities and statuses |
| B1 | One function to call after a save |
| D | Which patterns to plant in the seed data so each rule can be shown |

**Without B2:** CareTrack is only a record book. It never notices anything.

---

## D

**Database: Schema, Security & Seed Data.**

### Deliverables

- [ ] Supabase project created, with keys shared privately with B1 (never in git)
- [ ] **Nine tables** as a migration file ([PROJECT_OVERVIEW.md §7](PROJECT_OVERVIEW.md#7-data)), with keys and constraints: one attendance row per child per day; stock balance never below zero
- [ ] **Trigger:** stock balance updates when a stock transaction is added
- [ ] **View:** attendance percentage per child over the last 30 days
- [ ] **Row Level Security:** the warden can read students and write attendance and stock, and cannot read alerts or health cases
- [ ] **Seed script with invented data:** about 30 students in 2 classes; 60 days of attendance; about 15 stock items; two logins (manager, warden)
- [ ] **Planted patterns in the seed**, so the demo is repeatable: one child with 2 asthma absences (the 3rd is entered live); one child below 85% attendance; one item just above its minimum level; one medicine expiring within 30 days
- [ ] A one-command **reset and reseed** for the demo

### Needs from others

| From | What | By |
|---|---|---|
| F2 | The fields each entry screen sends | Block 0 |
| B2 | What the rules read, and which patterns to plant | Block 0 |

### Gives to others

| To | What |
|---|---|
| Everyone | The schema (Block 0), working tables and seed data (2:00), a demo reset (Block 3) |

**Without D:** there is nowhere to store anything, and nothing stops the warden's login from reading health data.

---

## Feature × role matrix

Read across a row to see who to talk to.

| Feature | D | B1 | B2 | F1 | F2 |
|---|---|---|---|---|---|
| Login and roles | `profiles`, access rules | Login, role checks | | Shell, navigation | |
| Students | Table, seed | API | | | List and profile |
| Attendance | Table, constraint, 30-day view | API | Two attendance rules | Chart on dashboard | Entry screen |
| Stock | Tables, balance trigger | API | Low stock / expiry rule | Stock table | Entry screen |
| Alerts | Table, access rules | API | Raises them, no duplicates | Alert centre | |
| Health cases | Table, access rules | API | Opens them automatically | Cases board | |
| Dashboard | Views | Summary API | | Dashboard | |

## Shared by all five

- Write your worklog entry at the end of every block ([TEAM_RULES.md](../TEAM_RULES.md), rule 3).
- Review a teammate's pull request within 15 minutes when asked.
- Be at every check. Present your own part in the demo.
- Protect the children's data.

## Coordinator (to be assigned)

One of the five also keeps the clock. This is a duty on top of a role, not a
sixth role and not a boss:

- calls the checks on time and runs them
- decides what gets cut when the day runs late, using the stretch list
- keeps [DECISIONS.md](DECISIONS.md) current
- breaks a tie when a decision is stuck

B2 is the natural choice, since the rules are the smallest build and B2 already
leads testing.

Coordinator: ______
