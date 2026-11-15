# CareTrack: instructions for Claude

CareTrack is an attendance, health and stock tracking system for Grace and
Light Trust (a children's home in Hoskote, Karnataka), built by a team of five
students. The product contains **no AI or machine learning**: alerts come
from three fixed rules. The app is built and working.

## Read first

- `docs/PROJECT_OVERVIEW.md`: what we build (must-haves, stretch, what was cut)
- `docs/ROLES.md`: the five roles (F1, F2, B1, B2, D) and what each owns
- `TEAM_RULES.md`: the rules the team works by
- `docs/CONTRACTS.md`: the tables, endpoints, rules and payloads, exactly as built
- `docs/VIVA_GUIDE.md`: each member's part, screenshots and the presentation script
- `docs/EXECUTION_PLAN.md`: today's plan
- `docs/DECISIONS.md`: what was decided and cut
- `AGENTS.md`: this Next.js version differs from older ones; read the bundled docs before changing framework code

The PDF in `docs/proposal/` is the original, larger, AI-based proposal. It is
background only. Do not build anything from it that the overview has cut.

## Always

- Team: Adhira Praveen (F1, manager screens), Neha S (F2, warden screens), Joel Thomas Mario (D, records and database), Ashika Valencia A (B1, sign-in and APIs), Joseph Mangali (B2, rules and tests). Ask who is working if they have not said. Stay inside that role's ownership; if a task needs a change in another role's area, say so instead of silently changing it.
- Keep changes small and simple. Do not add AI, ML, a second database or a new service. Do not break the two flows in `docs/VIVA_GUIDE.md` (Shivakumar's asthma absence; issuing rice).
- The app's records are CSV files in `data/records/`, loaded by `db/import.ts`. Never write or request real children's data in a chat or commit it. Never commit secrets or `data/caretrack.db`.
- Alerts describe what happened. Never label or judge a child.
- Keep the warden's restrictions intact: no access to alerts, health cases or student history. Every page calls `requireRole` and every API route calls `apiUser`.
- After any code change run `npm test`, `npm run lint` and `npm run build`.
- After doing work, add an entry to `docs/worklogs/<ROLE>.md` using `docs/templates/worklog-entry.md`. Say truthfully who did what, including what you (the assistant) did. Never write an entry describing work a person did not do.
- If a table, endpoint or alert shape changes, update `docs/CONTRACTS.md`. If a decision affects others or something is cut, add it to `docs/DECISIONS.md`.
- Branch names are `<role>/<topic>`; commit messages are `<role>: <what changed>`.
- Stack: one Next.js 16 + TypeScript app, Tailwind CSS 4, Zod, SQLite via better-sqlite3, Vitest. Do not introduce anything else without recording a decision.

## Commands

- `npm run dev`: development server
- `npm run build` then `npm start`: production server on port 3000
- `npm test`: unit tests
- `npm run db:reset`: rebuild the database from `data/records/`
