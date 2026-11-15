# Contracts between roles

A contract is something one role produces and another builds on. Each has one
owner. All six are agreed in **Block 0** (the first hour). After that, the
owner announces any change to the team before merging it
([TEAM_RULES.md](../TEAM_RULES.md), rule 5).

Fill in the sections below during Block 0. Keep them short: this is the page
everyone has open all day.

| # | Contract | Owner | Used by | Status |
|---|---|---|---|---|
| C1 | Database tables | D | Everyone | Not started |
| C2 | Who can read and write what | D, B1 | Everyone | Not started |
| C3 | API endpoints | B1 | F1, F2 | Not started |
| C4 | Rules and alert format | B2 | B1, F1, D | Not started |
| C5 | What each warden screen sends | F2 | B1, D | Not started |
| C6 | Shared components and layout | F1 | F2 | Not started |

Status values: Not started / Agreed / Changed (see log).

## Fixed points

Already decided. Every contract must respect them.

- **Two roles.** Manager: everything. Warden: read students; write attendance and stock. The warden cannot read alerts or health cases.
- **One attendance row per child per day.** Saving again for the same day updates it.
- **Stock balance can never go below zero.**
- **Alert severities:** Critical, Warning. **Alert statuses:** Open, Acknowledged, Resolved.
- **Health case statuses:** Open → Scheduled → Under treatment → Resolved.
- **Rules run after each attendance or stock save**, inside the web app. There is no separate service and no AI.

## C1: Database tables (D)

_List each table with its columns, key and constraints, or link to the migration file._

## C2: Access (D, B1)

| Table | Manager | Warden |
|---|---|---|
| `profiles` | read | read own |
| `students` | read, write | read |
| `absence_reasons`, `illnesses` | read, write | read |
| `attendance` | read, write | read, write |
| `inventory_items` | read, write | read |
| `stock_transactions` | read, write | read, write |
| `alerts` | read, write | none |
| `health_cases` | read, write | none |

## C3: API endpoints (B1)

_For each: method, path, who may call it, what it takes, what it returns._

| Endpoint | Who | Purpose |
|---|---|---|
| | | |

## C4: Rules and alert format (B2)

_For each rule: the exact condition, the severity, what stops a duplicate, what clears it. Then the fields of an alert._

## C5: What each warden screen sends (F2)

_Attendance screen and stock entry screen: the fields, which are required, and the allowed values._

## C6: Shared components and layout (F1)

_Where the shared components live and which ones exist._

## Change log

| Time | Contract | What changed | Changed by | Team told |
|---|---|---|---|---|
| | | | | |
