# CareTrack

A child attendance, health and stock tracking system for **Grace and Light
Trust**, a children's home in Hoskote, Karnataka.

Service Learning Project, team of five, **built in one day**. There is **no AI
or machine learning** in this project: alerts come from simple, fixed rules.

## What we are making, in one paragraph

The warden opens CareTrack on a phone and records the day's school attendance
(with the reason for each absence) and what stock was used. The manager opens
it on a laptop and sees a dashboard: who is missing school and why, which
children have been ill repeatedly, and which supplies are running low. Three
fixed rules raise alerts automatically, for example "absent for asthma 3 times
in 30 days", and the manager follows each health case until it is resolved.

## Start here

| If you want to... | Read |
|---|---|
| Understand the whole project | [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) |
| Know what you personally own | [docs/ROLES.md](docs/ROLES.md) |
| Know the rules we work by | [TEAM_RULES.md](TEAM_RULES.md) |
| Know what to do, hour by hour | [docs/EXECUTION_PLAN.md](docs/EXECUTION_PLAN.md) |
| See what the roles have promised each other | [docs/CONTRACTS.md](docs/CONTRACTS.md) |
| See why something was decided or cut | [docs/DECISIONS.md](docs/DECISIONS.md) |
| Record your own work | [docs/worklogs/](docs/worklogs/) (one file per role) |
| Start a session with Claude | [docs/PROMPT.md](docs/PROMPT.md) |
| Read the original (larger) proposal | [docs/proposal/CareTrack_Project_Proposal.pdf](docs/proposal/CareTrack_Project_Proposal.pdf) |

## The team

Fill in the names once roles are assigned.

| Role | Title | Member | Worklog |
|---|---|---|---|
| F1 | Frontend: Manager Dashboard & Alerts | ______ | [F1](docs/worklogs/F1.md) |
| F2 | Frontend: Warden Mobile Screens | ______ | [F2](docs/worklogs/F2.md) |
| B1 | Backend: Login, Permissions & APIs | ______ | [B1](docs/worklogs/B1.md) |
| B2 | Backend: Rules, Alerts & Testing | ______ | [B2](docs/worklogs/B2.md) |
| D | Database: Schema, Security & Seed Data | ______ | [D](docs/worklogs/D.md) |

## The one rule that outranks all others

**No real children's data ever goes into this repository, a demo, a screenshot
or a chat with an AI tool.** We build and demo with made-up seed data. See
[TEAM_RULES.md](TEAM_RULES.md).

## Current status

Planning and documentation only. No application code has been written yet.
The next step is the "evening before" checklist in
[docs/EXECUTION_PLAN.md](docs/EXECUTION_PLAN.md).

## Relation to the original proposal

The proposal describes a three-week, AI-assisted system. This build is a
one-day, rule-based subset of it. What was cut, and why, is in
[docs/DECISIONS.md](docs/DECISIONS.md) (D-006).
