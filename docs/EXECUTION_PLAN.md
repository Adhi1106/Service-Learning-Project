# Execution plan: one day

Ten working hours, five people, four blocks, three checks. Times are hours
from the start of the day (0:00 = when all five sit down).

**Build date: ______  Start time: ______**

| When | What | Ends with |
|---|---|---|
| Evening before | [Setup](#the-evening-before) | Everyone can run a Next.js app and push to the repo |
| 0:00–1:00 | [Block 0: Agree](#block-0-agree-000100) | Contracts written down |
| 1:00–4:00 | [Block 1: Foundations](#block-1-foundations-100400) | **Check 1** at 4:00 |
| 4:30–7:30 | [Block 2: Complete the flows](#block-2-complete-the-flows-430730) | **Check 2** at 7:30, feature freeze |
| 8:00–9:30 | [Block 3: Fix, test, deploy](#block-3-fix-test-deploy-800930) | **Check 3** at 9:30 |
| 9:30–10:00 | [Block 4: Rehearse and wrap up](#block-4-rehearse-and-wrap-up-9301000) | Demo-ready |

Breaks: 15 minutes inside each check, and a meal after Check 1.

---

## The evening before

A one-day build cannot afford setup problems on the day.

**Everyone**
- [ ] Roles assigned and written in [README.md](../README.md) and [ROLES.md](ROLES.md); coordinator chosen
- [ ] Read [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md), your section of [ROLES.md](ROLES.md), and [TEAM_RULES.md](../TEAM_RULES.md)
- [ ] Node.js (current LTS) and git installed; a test Next.js app runs on your laptop
- [ ] Write access to the GitHub repository confirmed by pushing a test branch
- [ ] One team chat thread created

**D**
- [ ] Supabase account and an empty project created

**B1**
- [ ] Vercel account created and linked to the GitHub repository
- [ ] `main` protected: pull request and one approval required

**F2**
- [ ] A phone that can open the deployed URL, for testing

---

## Block 0: Agree (0:00–1:00)

All five at one table. No code. The output is [CONTRACTS.md](CONTRACTS.md), filled in.

| Minutes | What | Led by |
|---|---|---|
| 0–10 | Walk through the two demo flows so everyone has the same picture | Coordinator |
| 10–25 | The nine tables: columns, keys, constraints | D |
| 25–40 | The endpoints and what each screen sends and gets back | B1, with F1 and F2 |
| 40–50 | The three rules, exactly; the alert format and statuses; which patterns go in the seed data | B2 |
| 50–60 | Folder layout, branch names, who reviews whom, time of Check 1 | Coordinator |

- [ ] Every row in [CONTRACTS.md](CONTRACTS.md) is marked Agreed
- [ ] Everyone has written their first worklog entry

## Block 1: Foundations (1:00–4:00)

**Goal:** you can log in, and attendance saved on a phone lands in the database.

| Role | By 1:30 | By 2:00 | By 4:00 |
|---|---|---|---|
| D | Tables created in Supabase | Seed data loaded; two test logins working | Stock balance trigger; 30-day attendance view |
| B1 | Next.js app scaffolded, merged, **deployed** | Login working | Students and attendance endpoints; role check on every request |
| B2 | Rule specs committed | Test file with the edge cases listed | All three rules written as functions, unit tests passing |
| F1 | | Shell, navigation, shared components merged | Dashboard laid out with real numbers where endpoints exist |
| F2 | Attendance screen sketched on paper | Building on F1's components | Attendance screen saving through B1's endpoint; student list |

### Check 1 (4:00–4:30)

On the **deployed** app, not a laptop:

- [ ] Manager and warden can each log in and land on their own area
- [ ] The warden marks attendance for a class on a phone and the rows are in the database
- [ ] The student list shows the seed data
- [ ] `npm test` passes for the three rules
- [ ] Everyone has merged to `main` at least once

If any of the first three fail, fixing them is everyone's first job in Block 2.

## Block 2: Complete the flows (4:30–7:30)

**Goal:** both demo flows work end to end.

| Role | Work |
|---|---|
| D | Row Level Security on every table; test that a warden login cannot read alerts or health cases; one-command reset and reseed |
| B1 | Stock, alerts, health cases and dashboard endpoints; call B2's rules after each attendance and stock save; Zod checks |
| B2 | Wire the rules into B1's save path; no duplicate alerts; auto-open a health case; alert statuses |
| F1 | Alert centre with acknowledge and resolve; health cases board; stock table; attendance chart |
| F2 | Stock entry screen; reason and illness picker polished; error messages; test on a real phone |

### Check 2 (7:30–8:00): feature freeze

- [ ] **Flow 1:** enter the 3rd asthma absence → critical alert → health case opens → manager moves it to Resolved
- [ ] **Flow 2:** record stock out → balance drops below minimum → warning alert → item on the low-stock list
- [ ] Warden login is refused the alert and health pages
- [ ] All eight must-haves in [PROJECT_OVERVIEW.md §3](PROJECT_OVERVIEW.md#3-what-we-build) are ticked, or the coordinator has cut what is not (recorded in [DECISIONS.md](DECISIONS.md))

**After this check, no new features.** If and only if every must-have passed,
people who are free may take stretch items in the listed order.

## Block 3: Fix, test, deploy (8:00–9:30)

| Role | Work |
|---|---|
| B2 | **Test lead.** Run both flows and the security check from a clean reseed; log every bug in the chat with who owns it |
| D | Confirm the warden is blocked by the database itself, not only the screen; final reseed with the planted patterns |
| B1 | Final deployment; environment variables set in Vercel; confirm no secrets in git |
| F1 | Fix dashboard and alert bugs; make empty and error states readable |
| F2 | Time attendance for 30 children on a phone (target under 60 seconds); fix what slows it |

### Check 3 (9:30): release

- [ ] Both flows pass twice in a row on the deployed app after a reseed
- [ ] The four tests in [PROJECT_OVERVIEW.md §9](PROJECT_OVERVIEW.md#9-how-we-will-know-it-works) pass
- [ ] `main` is what is deployed

## Block 4: Rehearse and wrap up (9:30–10:00)

- [ ] Run the demo once, start to finish, each person presenting their part (order below)
- [ ] Reseed so the demo starts from a known state
- [ ] Everyone's final worklog entry and status table are complete
- [ ] README "Current status" updated with the live URL and the two demo logins (invented accounts only)

### Demo order (about 8 minutes)

1. **Coordinator:** the trust's problem in three sentences
2. **D:** the data, the constraints, and that the data is invented
3. **F2:** warden marks attendance on a phone, including the 3rd asthma absence
4. **B2:** the rule that just fired, and its tests
5. **F1:** the alert on the dashboard; move the health case to Resolved
6. **F2 then F1:** stock out on the phone; low-stock warning on the dashboard
7. **B1:** log in as the warden and show the alert page is refused
8. **Coordinator:** what was cut from the proposal and what would come next

---

## If the day runs late

Cut in this order, and record each cut in [DECISIONS.md](DECISIONS.md):

1. All stretch items
2. The 30-day attendance chart
3. The manager's stock table (the low-stock list on the dashboard stays)
4. The low-attendance rule

Never cut: login and roles, attendance entry, the repeated-illness rule, the
alert centre, database-level access rules.

## Risks to watch

| Risk | Early sign | Response |
|---|---|---|
| Setup eats the morning | Someone cannot run the app at 1:30 | Do the evening-before checklist properly; pair them with B1 |
| Frontends wait for the backend | F1 or F2 idle in Block 1 | Build against the agreed shapes with placeholder data |
| Everything merges at the end and breaks | No merges by 2:30 | Rule 4: merge at least once per block |
| Works on a laptop, fails when deployed | First deployment happens late | B1 deploys the empty app by 1:30 and every merge deploys |
| Access rules lock everyone out | Empty lists after Row Level Security goes on | D turns it on table by table in Block 2 and tests with both logins |
| Scope creep | "It would be quick to add..." | Must-haves first; freeze at Check 2 |

## Questions to settle the evening before

Record each answer in [DECISIONS.md](DECISIONS.md).

1. Who takes which role, and who is the coordinator?
2. What are the build date and the demo date?
3. **Has the faculty guide agreed to a reduced, non-AI version?** The approved proposal is titled "AI-Assisted" and promises two AI modules. Confirm before the build day.
4. Is the demo for the college only, or will the trust see it? (This plan assumes a demo on invented data, with nothing installed at the trust.)
