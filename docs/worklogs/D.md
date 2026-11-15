# Worklog: D

**Area:** Database, constraints and seed data
**Member:** _(write your name here)_
**What I own:** see [ROLES.md](../ROLES.md#d)

This is the record of work on the D area. Write only what was actually
done, and by whom.

## How to use this file

1. Tick the review checklist below as you complete each item.
2. Add an entry each time you work on your area, **newest first**, under "Entries" and above the build record. Use [the entry template](../templates/worklog-entry.md).
3. Never paste real children's data, passwords or keys here.

## My review checklist

To be ticked by the member who owns this area.

- [ ] I have run `npm run db:reset` and looked at the result in the app
- [ ] I have read `db/schema.sql` and `db/seed.ts` in full
- [ ] I can draw the main tables and their links from memory
- [ ] I can explain the stock trigger and the four things the database refuses
- [ ] I can point to the four planted patterns in the seed and say what each is for
- [ ] I have rehearsed my part of PRESENTATION.md

## Entries

<!-- Your entries go here, newest first. Copy docs/templates/worklog-entry.md. -->

### 2026-11-15: Reset no longer logs people out

**Who did this:** Claude (the AI coding assistant), during a readiness check
asked for by the project owner. No team member was involved. The owner of this
area should read the change and tick it off here.

**What was done**
- Found while following PRESENTATION.md in a browser: pressing "Reset demo data" on the laptop logged the warden's phone out, because the reset rebuilt every table, including `sessions`.
- `resetDb` in `lib/db.ts` now saves the current logins before the reset and puts them back afterwards, matched by username.
- Added `lib/db.test.ts`: after a reset the data is back to its start state and both logins still work.

**How it was checked**
- `npm test`: 44 passing. Lint, type check and build clean.
- The whole presentation script ran twice in a row in a browser, with resets between runs: 30 of 30 checks passed both times.


### 2026-11-15: Build record

**Who did this:** the whole app, including this area, was written in a single
session using Claude Code (an AI coding assistant), directed by the project
owner. No team member wrote this code by hand. The member who owns this area
is responsible for reading it, running it and being able to explain it, and
records that work in their own entries above.

**What was built in this area**

- Ten tables with keys, foreign keys and CHECK constraints (`db/schema.sql`)
- Trigger `stock_apply` that keeps each item's balance, and rejects a stock-out below zero
- View `attendance_30d` for per-child attendance percentage
- Unique index so the same alert cannot be active twice
- Seed data generated relative to today: 30 invented students, 60 days of attendance, 15 items, 2 logins, and four planted patterns (`db/seed.ts`)
- Automatic database creation on first run, and reset by command or button (`lib/db.ts`, `scripts/reset-db.ts`)

**How it was checked**

- Tests: a second attendance row for the same child and day is refused; an absence without a reason is refused; a stock-out larger than the balance is refused and the balance is unchanged; a second active alert with the same key is refused; the seed raises exactly the three expected warnings.
- Decision: SQLite instead of the PostgreSQL in the proposal (DECISIONS.md, D-011). Access by role is enforced in the server code, not inside the database.
