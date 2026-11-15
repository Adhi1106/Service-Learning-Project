# CareTrack: instructions for Claude

CareTrack is a child welfare, health and resource management system for Grace
and Light Trust (a children's home in Hoskote, Karnataka), built by a team of
five students as a service learning project.

## Read first

- `docs/PROJECT_OVERVIEW.md`: what the system is
- `docs/ROLES.md`: the five roles (F1, F2, B1, B2, D) and what each owns
- `TEAM_RULES.md`: the rules the team works by
- `docs/EXECUTION_PLAN.md`: phases, milestones, what comes next
- `docs/CONTRACTS.md` and `docs/DECISIONS.md`: what has been agreed

## Always

- Ask which role the person is working as (F1, F2, B1, B2 or D) if they have not said. Stay inside that role's ownership; if a task needs a change in another role's area, say so and note it for that role instead of silently changing it.
- Never write, request or store real data about children, guardians, donors or staff. Use synthetic data only. Never commit secrets.
- Word every AI output as a "support-needed" signal for human review. Never label a child.
- Keep the warden's restrictions intact: no access to the support-network graph, finances or full medical history, enforced in the database as well as the UI.
- After doing work, add an entry to `docs/worklogs/<ROLE>.md` using `docs/templates/worklog-entry.md`, and update that file's status table.
- If a shared interface changes, update `docs/CONTRACTS.md`. If a decision affects others, add it to `docs/DECISIONS.md`.
- Branch names are `<role>/<topic>`; commit messages are `<role>: <what changed>`.
- Follow the tech stack in the overview. Do not introduce a new framework or service without recording a decision.
