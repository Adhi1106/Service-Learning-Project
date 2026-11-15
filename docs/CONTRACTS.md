# Contracts between the five areas

The exact shapes each area relies on: the tables, who may do what, the
endpoints, the rules, and what the screens send. This describes the code as it
is built. If you change one of these, update this file in the same commit and
tell the areas that use it ([TEAM_RULES.md](../TEAM_RULES.md), rule 5).

| # | Contract | Owner | Used by |
|---|---|---|---|
| [C1](#c1-database-tables-d) | Database tables | D | Everyone |
| [C2](#c2-access-b1-d) | Who can read and write what | B1, D | Everyone |
| [C3](#c3-api-endpoints-b1) | API endpoints | B1 | F1, F2 |
| [C4](#c4-rules-and-alert-format-b2) | Rules and alert format | B2 | B1, F1, D |
| [C5](#c5-what-the-warden-screens-send-f2) | What the warden screens send | F2 | B1, D |
| [C6](#c6-shared-components-f1) | Shared components | F1 | F2 |

## C1: Database tables (D)

Defined in `db/schema.sql`. SQLite, stored in `data/caretrack.db` (not in git).

| Table | Columns | Notes |
|---|---|---|
| `users` | id, username, name, password_hash, role | role is `manager` or `warden`; username is unique |
| `sessions` | token, user_id, expires_at | One row per login; lasts 12 hours |
| `students` | id, name, dob, class_name, room, school, admitted_on | room is the dorm, e.g. "Boys' Dorm 1" |
| `absence_reasons` | id, name, is_medical | Medical, Family visit, Festival or function, Other |
| `illnesses` | id, name | Asthma, Fever, Cold and cough, Stomach upset, Skin infection, Eye infection, Injury, Dental problem |
| `attendance` | id, student_id, date, status, reason_id, illness_id, entered_by | **Unique (student_id, date).** status is `present` or `absent`. An absent row must have a reason; a present row must not |
| `inventory_items` | id, name, category, unit, min_level, balance | **balance ≥ 0.** category is Food, Medicine, Hygiene or Stationery |
| `stock_transactions` | id, item_id, type, quantity, date, expiry_date, note, entered_by | type is `in` or `out`; quantity > 0; note is optional ("Issued to kitchen", "Donation in kind") |
| `alerts` | id, rule, severity, student_id, item_id, message, dedupe_key, trigger_date, status, created_at, resolved_at | Exactly one of student_id and item_id is set. **Only one non-resolved alert per dedupe_key** |
| `health_cases` | id, student_id, illness_id, status, notes, alert_id, created_at, updated_at | |

- **Trigger `stock_apply`:** after a row is added to `stock_transactions`, adds or subtracts the quantity from the item's balance. If the balance would go below zero, the entry is rejected.
- **View `attendance_30d`:** per student, days recorded, days present and the percentage, over the last 30 days including today.
- Dates are text in `YYYY-MM-DD` form. Timestamps are ISO 8601.

## C2: Access (B1, D)

Checked on the server for every page (`requireRole`) and every API route (`apiUser`), in `lib/auth.ts`.

| Data | Manager | Warden |
|---|---|---|
| Students: name, class, room | read | read |
| Student profile: attendance history, health cases | read | none |
| Absence reasons, illnesses, item list | read | read |
| Attendance | read, write | read and write for a class and a day |
| Stock entries | read, write | write; sees the current balance of the chosen item |
| Stock table, low and expiring status | read | none |
| Alerts | read, acknowledge, resolve | none |
| Health cases | read, update | none |
| Dashboard | read | none |
| Reset demo data | yes | no |

A request with no login gets **401**. A logged-in user with the wrong role gets
**403** from an API route, or is redirected to their own home page.

SQLite has no per-user permissions, so access is enforced in the server code,
not inside the database. What the database does enforce is in C1.

## C3: API endpoints (B1)

All under `app/api/`. Requests and responses are JSON. Errors are
`{ "error": "message" }` with status 400 (bad input), 401, 403, 404 or 409.

| Method and path | Who | Body or query | Returns |
|---|---|---|---|
| `POST /api/auth/login` | Anyone | `{ username, password }` | `{ name, role, home }` and sets the session cookie |
| `POST /api/auth/logout` | Anyone | | `{ ok }` |
| `GET /api/lookups` | Both | | `{ classes, reasons, illnesses, items }` |
| `GET /api/students` | Both | `?class=` (optional) | `{ students }` |
| `GET /api/attendance` | Both | `?class=&date=` | `{ date, class, alreadySaved, rows }` |
| `POST /api/attendance` | Both | `{ date, class, entries: [{ studentId, status, reasonId?, illnessId? }] }` | `{ saved, present, absent }` |
| `GET /api/stock` | Manager | | `{ items }` |
| `POST /api/stock` | Both | `{ itemId, type, quantity, expiryDate?, note? }` | `{ item, unit, balance }` |
| `GET /api/alerts` | Manager | | `{ alerts }` |
| `PATCH /api/alerts/:id` | Manager | `{ status: "acknowledged" \| "resolved" }` | `{ id, status }` |
| `GET /api/cases` | Manager | | `{ cases }` |
| `PATCH /api/cases/:id` | Manager | `{ status?, notes? }` | `{ id, status }` |
| `POST /api/admin/reset` | Manager | | `{ ok }`; nobody is signed out |

Rules the endpoints apply:

- `POST /api/attendance`: the date cannot be in the future; every student must belong to the class; an absence needs a reason; a medical absence needs an illness. Saving the same class and day again replaces the earlier rows. The student rules then run for each child.
- `POST /api/stock`: an expiry date cannot be in the past, and is only kept for stock in. A stock-out larger than the balance returns 409. The item rules then run.
- `PATCH /api/cases/:id`: status can only move one step forward. Moving to `resolved` also resolves the alert that opened the case.
- The warden's responses never contain alerts.

## C4: Rules and alert format (B2)

Thresholds are constants at the top of `lib/rules/rules.ts`. "30 days" means
today and the 29 days before it.

| Rule | `rule` value | Fires when | Severity | Also does |
|---|---|---|---|---|
| Repeated medical absence | `repeated_illness` | 3 or more absences with the same illness in 30 days | critical | Opens a health case, unless one is already open for that child and illness |
| Low attendance | `low_attendance` | Below 85% over 30 days (only once 10 or more days are recorded), **or** the latest 3 recorded school days are all absences | warning | |
| Low stock | `low_stock` | Balance is below the item's minimum level | warning | |
| Expiring stock | `expiring_stock` | Stock remains and the newest delivery expires in 30 days or fewer | warning | |

Exactly at the limit: 3 absences fires; 85% does not; a balance equal to the
minimum is not low; expiry in exactly 30 days fires.

**When they run:** after every attendance save (for each child in it) and after
every stock entry (for that item). Also once over everything when the database
is seeded.

**No duplicates:**

| Alert | `dedupe_key` | Not raised again while... |
|---|---|---|
| Repeated illness | `illness:<student>:<illness>` | one is active, or there has been no new absence for that illness since the last one was raised |
| Low attendance | `attendance:<student>` | one is active, or one was resolved in the last 7 days |
| Low stock | `stock:<item>` | one is active, or one was resolved in the last 7 days |
| Expiring stock | `expiry:<item>` | one is active, or one was resolved in the last 7 days |

"Active" means status `open` or `acknowledged`.

**Statuses**

- Alert: `open` → `acknowledged` → `resolved` (may go straight from open to resolved).
- Health case: `open` → `scheduled` → `under_treatment` → `resolved`, one step at a time.

**Wording:** an alert message states what happened and the numbers behind it.
It never describes or judges a child.

## C5: What the warden screens send (F2)

**Attendance** (`components/warden/AttendanceForm.tsx`) sends the whole class at once:

```json
{
  "date": "2026-11-15",
  "class": "Class 6",
  "entries": [
    { "studentId": 1, "status": "absent", "reasonId": 1, "illnessId": 1 },
    { "studentId": 2, "status": "present", "reasonId": null, "illnessId": null }
  ]
}
```

The form will not send until every absent child has a reason, and an illness
when the reason is medical. `illnessId` is sent as null for non-medical reasons.

**Stock** (`components/warden/StockForm.tsx`):

```json
{ "itemId": 1, "type": "out", "quantity": 5, "expiryDate": null, "note": "Issued to kitchen" }
```

`expiryDate` is only sent for `"type": "in"`, and is optional. `note` is
optional, up to 120 characters.

## C6: Shared components (F1)

In `components/ui.tsx`: `Card`, `CardHeader`, `PageTitle`, `StatCard`,
`Avatar`, `Badge`, `SeverityBadge`, `AlertStatusBadge`, `CaseStatusBadge`,
`Empty`. In `components/icons.tsx`: line icons. In `components/Brand.tsx`: the
logo. In `components/NavLinks.tsx`: side navigation (manager) and bottom tabs
(warden). Quantity and name formatting (`amount`, `initials`) is in
`lib/format.ts`.

Colours: teal for actions, red for critical, amber for warnings, green for
fine. Colour is never the only signal; the text always says it too.

## Change log

| Date | Contract | What changed | Changed by | Team told |
|---|---|---|---|---|
| | | | | |
