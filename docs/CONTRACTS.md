# Contracts between roles

A contract is something one role produces and another role builds on. Each has
one owner. The owner may change it, but only after telling the roles that
depend on it and updating this file in the same pull request
([TEAM_RULES.md](../TEAM_RULES.md), rule 5).

This file is the index. Keep the detail next to the code (migrations, an
OpenAPI file, a schema file) and link to it from here.

| # | Contract | Owner | Used by | First version due | Status | Where the detail lives |
|---|---|---|---|---|---|---|
| C1 | PostgreSQL schema (tables, keys, constraints, views) | D | B1, B2, F1, F2 | Day 2 | Not started | _link_ |
| C2 | Row Level Security: who can read and write what | D | B1, everyone | Days 3–7 | Not started | _link_ |
| C3 | Neo4j schema (node labels, relationship types, properties) | D | B2, F1 | Day 2 | Not started | _link_ |
| C4 | Web API contract (endpoints, request and response shapes, errors) | B1 | F1, F2 | Day 2 | Not started | _link_ |
| C5 | Roles and permissions table (manager, warden) | B1 | Everyone | Day 2 | Not started | _link_ |
| C6 | Alert format and lifecycle | B2 | F1, B1, D | Day 2 | Not started | _link_ |
| C7 | Rule specifications (the nine early-warning rules) | B2 | D, B1, F1 | Day 2 | Not started | _link_ |
| C8 | ML service API and write-back tables (`support_scores`, `forecasts`) | B2 (service), B1 (forecast part) | F1, D | Week 2 | Not started | _link_ |
| C9 | Entry-screen data shapes, including offline record IDs and timestamps | F2 | B1, D | Day 2 | Not started | _link_ |
| C10 | Peer, activity and incident log format | F2 | B2, D | Day 2 | Not started | _link_ |
| C11 | Design system (tokens, shared components) | F1 | F2 | Day 3 | Not started | _link_ |
| C12 | Synthetic data: what is generated, with which planted patterns | D | B1, B2, everyone | Day 2 (first cut) | Not started | _link_ |

Status values: Not started / Draft / Agreed / Changed (see log).

## Fixed points from the proposal

These are already decided and every contract must respect them.

- **Two user roles.** Manager: everything. Warden: daily attendance, sick log, peer/activity logs, stock usage. The warden cannot view the support-network graph, finances or full medical history.
- **One attendance record per child per day.** Stock can never go negative.
- **Alert severities:** Critical, Warning, Info.
- **Health case states:** Open → Scheduled → Under treatment → Resolved.
- **AI results are written back to PostgreSQL** by a nightly batch, and the web app reads them from there.
- **Forecasts are ranges**, not single numbers.
- **GNN outputs are "support-needed" signals** with an explanation, reviewed by the manager.

## Change log

Add a row every time an agreed contract changes.

| Date | Contract | What changed | Changed by | Roles told |
|---|---|---|---|---|
| | | | | |
