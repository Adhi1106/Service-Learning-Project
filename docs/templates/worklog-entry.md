# Worklog entry template

Copy the block below to the top of the "Entries" section of your worklog
(`docs/worklogs/<ROLE>.md`). One entry at the end of each block. Five minutes is enough.
Leave a heading out if it has nothing under it.

```markdown
### Block N: <short title of what you worked on>

**Block:** Block 1 (1:00–4:00)
**Branch / PR:** `b1/login`, #4

**What I did**
- Concrete things, in past tense. "Added login endpoint with role check", not "worked on auth".

**Why / decisions made**
- Any choice you made and the reason. If others must live with it, also add it to docs/DECISIONS.md.

**How I checked it works**
- Tests added, commands run, what you clicked through on the deployed app.

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
### Block 1: Tables, seed data and the attendance view

**Block:** Block 1 (1:00–4:00)
**Branch / PR:** `d/schema`, #2 and `d/seed`, #5

**What I did**
- Created the nine tables, with a unique constraint on (student_id, date) in `attendance`.
- Added the `attendance_30d` view that B2's low-attendance rule reads.
- Seeded 30 invented students with 60 days of attendance and 15 stock items.

**Why / decisions made**
- Stored the absence reason as a foreign key to `absence_reasons`, not free text, so the rules can group by illness.

**How I checked it works**
- Inserting a second row for the same child and day is rejected. The view returns 83.3% for the planted low-attendance student.

**Problems and what I learned**
- Migrations run in filename order; renamed files to use a number prefix.

**Blocked on / needs from others**
- F2: confirm whether "half day" is a status the warden needs.

**Next**
- Row Level Security on every table, tested with both logins.

**Help and tools**
- B2 reviewed the view definition. Claude drafted the seed script; I checked the planted patterns by hand.
```
