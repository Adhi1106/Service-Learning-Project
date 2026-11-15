# Execution plan

Three weeks, five people, five phases. AI work starts on Day 1 using synthetic
data, so nobody waits for real data.

Days are counted from the project start date. **Start date: ______** (fill in
on kickoff, then add calendar dates to the phase headings).

| Phase | When | Goal | Ends with |
|---|---|---|---|
| [0. Foundations](#phase-0-foundations-days-12) | Days 1–2 | Everyone agrees what to build and how the parts connect | Milestone M0: contracts signed off |
| [1. Core slice](#phase-1-core-slice-days-37) | Days 3–7 | The health flow works end to end | Milestone M1: first integration check |
| [2. Intelligence](#phase-2-intelligence-week-2) | Week 2 | Both AI modules are visible on the dashboard | Milestone M2: all three flows run |
| [3. Hardening](#phase-3-hardening-week-3) | Week 3 | Evaluated, deployed, bilingual, tested with the warden | Milestone M3: release candidate |
| [4. Handover](#phase-4-handover-end) | End | Trust is using it; report and demo are ready | Final demo |

The per-role work in each phase comes from the proposal's timeline. The
milestone checks and the Phase 0 detail are this plan's additions.

---

## Before Day 1: kickoff checklist

Do these together, in one sitting. Nothing else should start until they are ticked.

- [ ] Assign the five roles and write the names in [README.md](../README.md) and [ROLES.md](ROLES.md)
- [ ] Choose the coordinator ([ROLES.md](ROLES.md#team-coordinator-to-be-assigned))
- [ ] Everyone reads [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md), their section of [ROLES.md](ROLES.md), and [TEAM_RULES.md](../TEAM_RULES.md)
- [ ] Set the start date above and the daily check-in time
- [ ] All five have write access to the GitHub repository; protect `main` (require a pull request and one approval)
- [ ] Create the team chat group
- [ ] Coordinator confirms with the trust: the date of the warden interview (Days 1–2), and who at the trust is our contact
- [ ] Coordinator confirms with the trust and the faculty guide what consent is in place for entering real data at the end
- [ ] Settle the open questions at the bottom of this file

---

## Phase 0: Foundations (Days 1–2)

**Goal:** by the end of Day 2, every role can build for a week without waiting
for anyone, because the contracts between roles are agreed.

No feature code is merged in this phase. The output is agreements, written
down in [CONTRACTS.md](CONTRACTS.md).

### D
- [ ] ER diagram for the ~28 PostgreSQL tables, with keys and the main constraints
- [ ] Neo4j node and relationship schema
- [ ] First cut of the synthetic generators: enough students, attendance and a small graph for others to develop against
- [ ] Create the Supabase and Neo4j AuraDB projects (free tier)

### B1
- [ ] Authentication approach and the two roles (manager, warden) with their permissions written as a table
- [ ] **API contract v0:** every endpoint F1 and F2 need in Phase 1, with request and response shapes
- [ ] Repository scaffold and a CI pipeline that runs lint and tests on every pull request

### B2
- [ ] **Rule specifications:** each of the nine rules written precisely (inputs, threshold, severity, de-duplication, what clears it)
- [ ] Alert format and lifecycle states
- [ ] Graph baselines (degree, betweenness with NetworkX) running on D's first synthetic graph

### F1
- [ ] Figma wireframes for: dashboard, alert centre, health cases board, graph explorer, forecast planner
- [ ] Design system foundation: colour, type and spacing tokens, and the first core components

### F2
- [ ] **Interview the warden at the trust:** daily routine, class sizes, phone model, connectivity, language preference, current paper records
- [ ] Interview write-up shared with the team (workflows only, no children's details)
- [ ] Wireframes for the attendance flow and the entry screens, listing the fields each one sends

### Milestone M0 (end of Day 2): contract sign-off

All five meet for one hour and walk through [CONTRACTS.md](CONTRACTS.md).

- [ ] D's schema covers every field F2's screens capture and every input B2's rules read
- [ ] B1's API contract covers every screen in F1's and F2's wireframes
- [ ] B2's alert format is enough for F1's alert centre
- [ ] The warden interview has not invalidated a core assumption (if it has, adjust the plan now and record it)
- [ ] Repository structure and tooling choices are recorded in [DECISIONS.md](DECISIONS.md)
- [ ] Every role has written their first worklog entry

---

## Phase 1: Core slice (Days 3–7)

**Goal:** flow 1 (health) works end to end on synthetic data: the warden marks
a child absent for the same illness a third time, and a critical alert appears
for the manager.

| Role | Work |
|---|---|
| D | Row Level Security rules; triggers (audit, stock balance, BMI); PostgreSQL → Neo4j sync |
| B1 | Core APIs (students, attendance, academics, health workflow, inventory ledger); forecast baselines |
| B2 | Rules engine; GraphSAGE first version |
| F1 | Dashboard; health screens |
| F2 | Attendance PWA; student profile |

### Milestone M1 (end of Day 7): first integration check

- [ ] Manager and warden can log in, and each sees only their own screens
- [ ] Warden marks attendance for a class on a phone; the records are in PostgreSQL
- [ ] The third absence for the same illness within 30 days raises a critical alert and opens a health case
- [ ] The alert and the attendance trend are visible on the manager's dashboard
- [ ] A warden account is refused medical data by the database itself, not only by the screen
- [ ] CI is green on `main`
- [ ] Forecast baselines and a first GraphSAGE run have numbers recorded in the B1 and B2 worklogs

---

## Phase 2: Intelligence (Week 2)

**Goal:** flows 2 (social) and 3 (resources) work end to end on synthetic data,
and the manager can see and explore both AI modules.

| Role | Work |
|---|---|
| D | Feature pipelines (GNN node features, weekly time series); indexes |
| B1 | Prophet / gradient boosting; anomaly detection; scenario API |
| B2 | Link prediction; Louvain communities; ML service (nightly batch, write-back, versioned models) |
| F1 | Graph explorer; forecast planner |
| F2 | Offline sync; peer logs; inventory entry |

### Milestone M2 (end of Week 2): all three flows run

- [ ] **Flow 2:** peer and activity logs → Neo4j → support score → "support-needed" signal with an explanation → suggested mentor pairing, shown in the graph explorer
- [ ] **Flow 3:** stock use and donations → forecast with a range → runway and stock-out alert → procurement list, shown in the forecast planner
- [ ] The what-if slider recalculates demand and runway
- [ ] Attendance entered in airplane mode syncs correctly when the connection returns
- [ ] The nightly batch scores everything and writes results back to PostgreSQL
- [ ] **Scope check:** decide now whether anything on the cut list must go (see below)

---

## Phase 3: Hardening (Week 3)

**Goal:** a release candidate that is evaluated, deployed, accessible, bilingual
and tested with the real warden.

| Role | Work |
|---|---|
| D | Backups; retention policy; pseudonymised IDs; query tuning |
| B1 | Backtests and forecast evaluation tables; deployment |
| B2 | GNN evaluation and edge-type ablation |
| F1 | Alert Centre polish; PDF reports; accessibility (WCAG 2.1 AA) |
| F2 | Kannada interface; usability test with the warden |

### Milestone M3 (end of Week 3): release candidate

- [ ] Deployed on Vercel, Supabase, Neo4j AuraDB and the ML host
- [ ] All five software tests in [PROJECT_OVERVIEW.md §11](PROJECT_OVERVIEW.md#11-how-we-will-know-it-works) pass
- [ ] GNN table: feature-only baseline vs GNN, precision/recall, edge-type ablation
- [ ] Forecast table: model ladder with MAPE/MAE/RMSE per category and interval coverage
- [ ] The warden completes a class's attendance in under 60 seconds; Lighthouse ≥ 90 on a budget phone
- [ ] Health Card, Doctor's Agenda and Trustee/Donor Report export as PDF
- [ ] Backups run and a restore has been tried once

---

## Phase 4: Handover (End)

All five, together.

- [ ] Real (non-ML) data entry at the trust, through the deployed app only
- [ ] Training session for the warden and the manager
- [ ] Admin guide and synthetic-data documentation finished
- [ ] Project report: one chapter per role, written from the worklogs
- [ ] Demo rehearsal: each member presents their own part; the three flows are the script
- [ ] Final demo

---

## If time runs short

Cut in this order, and record each cut in [DECISIONS.md](DECISIONS.md):

1. The LSTM (forecasting) and the email digest
2. Roommate link prediction (keep mentor pairing)

Never cut: database-level privacy, the human review step on AI signals, the
three main flows, or the worklogs.

## Risks to watch

| Risk | Early sign | Response |
|---|---|---|
| A contract changes mid-phase and breaks another role | "It worked yesterday" at check-in | Contract owner announces changes before merging; integration check at every milestone |
| Three weeks is tight for two AI modules | M1 slips by more than a day | Apply the cut list at M2, not in Week 3 |
| Staff do not adopt the app | Warden interview shows a mismatch with real routines | F2 adjusts the attendance flow in Phase 1; usability test early in Week 3 |
| Free-tier limits (database size, ML host sleeping) | Slow first request, quota warnings | Nightly batch instead of live scoring; keep synthetic data small |
| Too little real history for the models | Known from the start | Synthetic generators, clearly stated in the report and demo |
| One person becomes the bottleneck (D and B1 early on) | Others blocked at check-in | Build against the contract with mocks; coordinator rebalances |

## Open questions to settle at kickoff

These are not answered by the proposal. Record each answer in [DECISIONS.md](DECISIONS.md).

1. Who takes which role, and who is the coordinator?
2. What is the start date, and what are the final demo and report submission dates?
3. Repository layout: one repository holding the web app, the ML service and the database files is recommended (proposed layout in [DECISIONS.md](DECISIONS.md), D-002).
4. Do F1 and F2 build one Next.js app with a manager area and a warden area (recommended, since they share the design system and login), or two apps?
5. Authentication: Supabase Auth is the natural fit with Row Level Security. Confirm.
6. Roughly how many children, classes and caregivers are there? This sizes the synthetic data and the screens.
7. What consent does the trust hold for the children's data, and who approves entering real data at the end?
8. Who is our contact at the trust, and when can we visit?
