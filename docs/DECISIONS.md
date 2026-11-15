# Decision log

One row per decision that others have to live with: a tool, a structure, a
schema choice, a cut feature, a change to the plan. Newest at the bottom. Keep
each entry short. If it needs more than a few lines, link to a pull request or
a worklog entry.

Status: **Proposed** (needs agreement), **Agreed**, **Open question**, **Replaced by D-xxx**.

| ID | Date | Decision | Why | Decided by | Status |
|---|---|---|---|---|---|
| D-001 | 2026-11-15 | The proposal PDF in `docs/proposal/` is the source of truth for scope. Changes to scope are recorded here. | One reference everyone can point to | Team | Replaced by D-006 |
| D-002 | 2026-11-15 | One repository with this layout: `apps/web` (Next.js: manager and warden areas), `services/ml` (Python FastAPI), `db/postgres` (migrations, RLS, triggers), `db/neo4j` (schema, Cypher, sync), `data/synthetic` (generators), `docs/` | Cross-layer reviews and one CI are simpler in one place | Team | Replaced by D-007 |
| D-003 | 2026-11-15 | One Next.js app for both users, with a manager area and a warden area, sharing F1's design system and B1's login | Shared components and auth; one deployment | F1, F2, B1 | Proposed |
| D-004 | 2026-11-15 | Cut order if time is short: LSTM and email digest first, then roommate link prediction (mentor pairing stays) | From the proposal | Team | Replaced by D-008 |
| D-005 | 2026-11-15 | Work is documented in per-role worklogs, one entry at the end of each block | The record of who did what | Team | Proposed |
| D-006 | 2026-11-15 | **Scope reduced to a one-day build with no AI or machine learning.** Kept: login with two roles, students, attendance with absence reasons, stock in/out, three fixed rules, alert centre, health cases, dashboard. Cut: the GNN and support-network module, Neo4j, forecasting, anomaly detection, what-if planner, Python ML service, offline sync, scholarships, achievements, peer logs, growth charts, yearly check-up workflow, PDF reports, Kannada, work at the trust. `docs/PROJECT_OVERVIEW.md` is now the source of truth for scope. | The whole project must be built in one day | Project owner | Agreed |
| D-007 | 2026-11-15 | One repository holding one Next.js app at the root: `app/` (manager and warden areas, API routes), `components/` (UI), `lib/` (login, queries, `rules/`), `db/` (schema and seed data), `docs/` | One app is the least setup | Team | Agreed (built this way) |
| D-008 | 2026-11-15 | Cut order if the day runs late: all stretch items, then the 30-day chart, then the manager's stock table, then the low-attendance rule | Protects the two demo flows | Team | Not needed: all must-haves were built |
| D-009 | 2026-11-15 | Supabase Auth for login, with the role stored in `profiles` and enforced by Row Level Security | Works directly with the database access rules; no auth code to write | B1, D | Replaced by D-011 |
| D-010 | 2026-11-15 | Faculty guide to be asked whether a non-AI subset of the approved "AI-Assisted" proposal is acceptable | The approved proposal promises two AI modules | Coordinator | Open question |
| D-011 | 2026-11-15 | **SQLite instead of Supabase/PostgreSQL, and our own login instead of Supabase Auth.** The database is one file created on first run. Access is checked in the server code on every page and API route. | No accounts or keys to set up, runs on any laptop, and the whole app could be built and tested in one sitting. Cost: no Row Level Security inside the database, and no hosted deployment. | Project owner | Agreed |
| D-012 | 2026-11-15 | No chart or component library. Charts are plain HTML and CSS; components are a small set in `components/ui.tsx`. | Fewer dependencies to install and explain | F1 | Agreed |
| D-013 | 2026-11-15 | Alerts are not raised twice: an active alert blocks a new one; a repeated-illness alert needs a new absence; other alerts wait 7 days after being resolved | Otherwise a resolved alert would return on the next save | B2 | Agreed |
| D-014 | 2026-11-15 | The app runs on a laptop and is reached from a phone over Wi-Fi. No public deployment. | SQLite needs a disk, which free serverless hosts do not keep. Enough for a demo. | Team | Agreed |
| D-015 | 2026-11-15 | The app was built in one session with an AI coding assistant. Each member owns one area to read, run, explain and present. Worklogs record this truthfully. | One day to finish; five people must present | Project owner | Agreed |
| D-016 | 2026-11-15 | Demo data is a realistic, invented three-month history: 40 children with common Karnataka names, two staff accounts (`anita`, `manjunath`), school holidays, purchases, donations and past health cases. Every reset gives the same data for the same date. | So the demo looks and behaves like a system in daily use, while no real person's data is involved | Project owner | Replaced by D-021 |
| D-017 | 2026-11-15 | Stock entries carry an optional note (where it went, who supplied it). Students carry school and admission date. | Makes the store ledger and profiles read like real records | D, B1 | Agreed |
| D-018 | 2026-11-15 | Visual redesign: logo, line icons drawn in-house, initials avatars, sidebar with the signed-in user. Still no UI or chart library. | The first version looked generic | F1, F2 | Agreed |
| D-019 | 2026-11-15 | AI coding tools are allowed for this project. The rule against AI applies only to the product (no ML features). | Clarified by the project owner | Project owner | Agreed |
| D-020 | 2026-11-15 | Children's names changed to everyday names of poor Bangalore families (Kannada, Tamil, Telugu, Urdu), written as name and initial like a government school register. All children attend one school: Govt. Model Higher Primary School, Hoskote. | The first names sounded middle-class and fake; the real children are orphans from poor local families | Project owner | Replaced by D-021 |
| D-021 | 2026-11-15 | The app's records are CSV files in `data/records/` (one per register), loaded into the database by `db/import.ts` with `npm run db:reset`. This replaces the generated data of D-016 and D-020. The reset link in the app was removed. | It is how the trust's own registers would be handed over and loaded; reloading is a command, not a button staff could press by mistake | Project owner | Agreed |
| D-022 | 2026-11-15 | 47 children in Classes 1 to 7 with everyday Bengaluru names, all at Government Higher Primary School (Main), Hosakote. One health record per child in four groups. Staff: Sunitha Prakash (manager), Manjunatha B (warden). | Matches the home: children of different ages at the government school near the home | Project owner | Agreed |
| D-023 | 2026-11-15 | Team: Adhira Praveen (F1, manager screens), Neha S (F2, warden screens), Joel Thomas Mario (D, records and database), Ashika Valencia A (B1, sign-in and APIs), Joseph Mangali (B2, rules and tests). Coordinator: Adhira Praveen. | Assigned by the project owner | Project owner | Agreed |

## Template for a longer decision

Use this only when a table row is not enough.

```
### D-0xx: <title>
Date:
Decided by:
Context: what problem forced a decision
Options considered: A, B, C with one line each
Decision: what we chose
Consequences: what this makes easier, what it makes harder, who has to change something
```
