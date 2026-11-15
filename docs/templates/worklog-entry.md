# Worklog entry template

Copy the block below to the top of the "Entries" section of your worklog
(`docs/worklogs/<ROLE>.md`). One entry per work session. Five minutes is enough.
Leave a heading out if it has nothing under it.

```markdown
### YYYY-MM-DD: <short title of what you worked on>

**Phase / milestone:** Phase 1, towards M1
**Time spent:** 2.5 h
**Branch / PR:** `b1/auth-rbac`, #12

**What I did**
- Concrete things, in past tense. "Added login endpoint with role check", not "worked on auth".

**Why / decisions made**
- Any choice you made and the reason. If others must live with it, also add it to docs/DECISIONS.md.

**How I checked it works**
- Tests added, commands run, numbers measured (for AI work: metric, baseline, dataset).

**Problems and what I learned**
- What went wrong, how you fixed it, what you would tell a teammate to avoid.

**Blocked on / needs from others**
- Role and what you need, for example "D: weekly time-series table for rice".

**Next**
- The next one or two things you will do.

**Help and tools**
- Teammates who helped; where an AI assistant did substantial work.
```

## A filled-in example

```markdown
### 2026-11-18: Attendance table and one-per-day constraint

**Phase / milestone:** Phase 1, towards M1
**Time spent:** 2 h
**Branch / PR:** `d/attendance-table`, #7

**What I did**
- Added the `attendance` table migration with a unique constraint on (student_id, date).
- Added the `attendance_30d` view that B2's low-attendance rule reads.
- Seeded 60 synthetic students with 90 days of attendance.

**Why / decisions made**
- Stored the absence reason as a foreign key to `absence_reasons`, not free text, so the rules can group by illness.

**How I checked it works**
- Pytest: inserting a second record for the same child and day fails. View returns 83.3% for the planted low-attendance student.

**Problems and what I learned**
- Supabase migrations run in filename order; renamed files to use a timestamp prefix.

**Blocked on / needs from others**
- F2: confirm whether "half day" is a status the warden needs.

**Next**
- Row Level Security on `attendance` and `sick_logs`.

**Help and tools**
- B2 reviewed the view definition. Claude drafted the seed script; I checked the planted patterns by hand.
```
