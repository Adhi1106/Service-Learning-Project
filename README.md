# CareTrack

An AI-assisted child welfare, health and resource management system for
**Grace and Light Trust**, a children's home in Hoskote, Karnataka.

Service Learning Project, team of five (2 frontend, 2 backend, 1 database).

## What we are making, in one paragraph

The trust's manager and warden look after dozens of children using scattered
records. CareTrack gives the **warden a phone app** to record daily attendance,
sickness, peer activity and stock use in seconds (even offline), and gives the
**manager a laptop dashboard** that turns those records into early warnings:
a child who keeps missing school for the same illness, a child who is becoming
isolated, rice that will run out before the next donation. Two AI modules sit
behind it: a **graph neural network** over the children's support network, and
**resource forecasting** for stock, donations and budget. Every AI output is a
"support-needed" signal that a human reviews. It is never a label on a child.

## Start here

| If you want to... | Read |
|---|---|
| Understand the whole project | [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) |
| Know what you personally own | [docs/ROLES.md](docs/ROLES.md) |
| Know the rules we work by | [TEAM_RULES.md](TEAM_RULES.md) |
| Know what to do first, and when | [docs/EXECUTION_PLAN.md](docs/EXECUTION_PLAN.md) |
| See what the roles have promised each other | [docs/CONTRACTS.md](docs/CONTRACTS.md) |
| See why something was decided | [docs/DECISIONS.md](docs/DECISIONS.md) |
| Record your own work | [docs/worklogs/](docs/worklogs/) (one file per role) |
| Start a session with Claude | [docs/PROMPT.md](docs/PROMPT.md) |
| Read the original proposal | [docs/proposal/CareTrack_Project_Proposal.pdf](docs/proposal/CareTrack_Project_Proposal.pdf) |

## The team

Fill in the names once roles are assigned.

| Role | Title | Member | Worklog |
|---|---|---|---|
| F1 | Frontend Engineer: Admin, Analytics & Visualisation | ______ | [F1](docs/worklogs/F1.md) |
| F2 | Frontend Engineer: Mobile, Offline & Data Capture | ______ | [F2](docs/worklogs/F2.md) |
| B1 | Backend Engineer: Core Platform & Resource Forecasting (ML) | ______ | [B1](docs/worklogs/B1.md) |
| B2 | Backend Engineer: Intelligence Engine & Graph ML (GNN) | ______ | [B2](docs/worklogs/B2.md) |
| D | Database & Data Engineer: PostgreSQL, Neo4j & Data Pipelines | ______ | [D](docs/worklogs/D.md) |

## The one rule that outranks all others

**No real children's data ever goes into this repository, a demo, a screenshot
or a chat with an AI tool.** Development and demos use documented synthetic
data. See [TEAM_RULES.md](TEAM_RULES.md).

## Current status

Planning and documentation only. No application code has been written yet.
The next step is Phase 0 in [docs/EXECUTION_PLAN.md](docs/EXECUTION_PLAN.md).
