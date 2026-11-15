# Decision log

One row per decision that others have to live with: a tool, a structure, a
schema choice, a cut feature, a change to the plan. Newest at the bottom. Keep
each entry short. If it needs more than a few lines, link to a pull request or
a worklog entry.

Status: **Proposed** (needs agreement), **Agreed**, **Replaced by D-xxx**.

| ID | Date | Decision | Why | Decided by | Status |
|---|---|---|---|---|---|
| D-001 | 2026-11-15 | The proposal PDF in `docs/proposal/` is the source of truth for scope. Changes to scope are recorded here. | One reference everyone can point to | Team | Proposed |
| D-002 | 2026-11-15 | One repository with this layout: `apps/web` (Next.js: manager and warden areas), `services/ml` (Python FastAPI), `db/postgres` (migrations, RLS, triggers), `db/neo4j` (schema, Cypher, sync), `data/synthetic` (generators), `docs/` | Cross-layer reviews and one CI are simpler in one place | Team | Proposed |
| D-003 | 2026-11-15 | One Next.js app for both users, with a manager area and a warden area, sharing F1's design system and B1's login | Shared components and auth; one deployment | F1, F2, B1 | Proposed |
| D-004 | 2026-11-15 | Cut order if time is short: LSTM and email digest first, then roommate link prediction (mentor pairing stays) | From the proposal | Team | Agreed |
| D-005 | 2026-11-15 | Work is documented in per-role worklogs, committed with the work | Feeds the per-role report chapters | Team | Proposed |

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
