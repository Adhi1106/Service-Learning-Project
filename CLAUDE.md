# CareTrack: instructions for Claude

CareTrack is an attendance, health and stock tracking system for Grace and
Light Trust (a children's home in Hoskote, Karnataka), built by a team of five
students **in one day**. The product contains **no AI or machine learning**:
alerts come from three fixed rules.

## Read first

- `docs/PROJECT_OVERVIEW.md`: what we build (must-haves, stretch, what was cut)
- `docs/ROLES.md`: the five roles (F1, F2, B1, B2, D) and what each owns
- `TEAM_RULES.md`: the rules the team works by
- `docs/EXECUTION_PLAN.md`: the hour-by-hour plan and the three checks
- `docs/CONTRACTS.md` and `docs/DECISIONS.md`: what has been agreed

The PDF in `docs/proposal/` is the original, larger, AI-based proposal. It is
background only. Do not build anything from it that the overview has cut.

## Always

- Ask which role the person is working as (F1, F2, B1, B2 or D) if they have not said. Stay inside that role's ownership; if a task needs a change in another role's area, say so instead of silently changing it.
- Build must-haves only, in the simplest way that works. No stretch items until the person says Check 2 has passed. Do not add AI, ML, Neo4j, a Python service or offline sync.
- Never write, request or store real data about children, guardians or staff. Invented seed data only. Never commit secrets.
- Alerts describe what happened. Never label or judge a child.
- Keep the warden's restrictions intact: no access to alerts or health cases, enforced in the database as well as the UI.
- After doing work, add an entry to `docs/worklogs/<ROLE>.md` using `docs/templates/worklog-entry.md`, and update that file's status table.
- If a table, endpoint or alert shape changes, update `docs/CONTRACTS.md`. If a decision affects others or something is cut, add it to `docs/DECISIONS.md`.
- Branch names are `<role>/<topic>`; commit messages are `<role>: <what changed>`.
- Stack: one Next.js + TypeScript app, Tailwind + shadcn/ui, Recharts, Zod, Supabase (PostgreSQL, Auth, Row Level Security), Vitest, Vercel. Do not introduce anything else without recording a decision.
