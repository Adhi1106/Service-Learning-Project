# Worklog entry template

Copy the block below to the top of the "Entries" section of your worklog
(`docs/worklogs/<ROLE>.md`), above the build record. One entry each time you work on your area.
Five minutes is enough. Write only what you actually did.
Leave a heading out if it has nothing under it.

```markdown
### YYYY-MM-DD: <short title of what you worked on>

**Branch / PR:** `b1/login`, #4 (if you changed code)

**What I did**
- Concrete things, in past tense: read, ran, tested, changed. "Read lib/auth.ts and traced a login", not "worked on auth".

**Why / decisions made**
- Any choice you made and the reason. If others must live with it, also add it to docs/DECISIONS.md.

**How I checked it works**
- Commands run, what you clicked through in the app, tests added.

**Problems and what I learned**
- What went wrong, how you fixed it, what you would tell a teammate to avoid.

**Blocked on / needs from others**
- Role and what you need, for example "B1: endpoint to list absence reasons".

**Next**
- The next one or two things you will do.

**Help and tools**
- Teammates who helped; where an AI assistant did substantial work.
```

## A filled-in example

```markdown
### 2026-11-15: Read the schema and added an item to the store records

**What I did**
- Read `db/schema.sql` and drew the eleven tables and their links on paper.
- Tried inserting a second attendance row for the same child and day with the sqlite3 command line: it was refused.
- Added "Hand wash (refill)" to `data/records/stock_items.csv` and ran `npm run db:reset`.

**How I checked it works**
- `npm test`: 50 passing. The new item shows in the manager's stock table.

**Problems and what I learned**
- The stock balance is never written by the app. The `stock_apply` trigger updates it, and the `balance >= 0` check is what rejects a stock-out that is too large.

**Blocked on / needs from others**
- Joseph: the test that counts 21 store items needs updating if I keep the new item.

**Next**
- Be able to explain the trigger without looking at the file.

**Help and tools**
- Asked Claude to explain the `attendance_30d` view line by line.
```
