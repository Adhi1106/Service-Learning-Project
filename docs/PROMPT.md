# Prompt to start a session with Claude

Copy the prompt below, fill in the three blanks, and paste it as your first
message. Any of the five team members can use it. It works because the
repository's documents carry the context, so the prompt only has to say who
you are and what you want.

## The prompt

```
I am working on CareTrack in this repository (adhi1106/service-learning-project).

My role: ____  (F1 / F2 / B1 / B2 / D)
Current block: ____  (Evening before / Block 0 / 1 / 2 / 3 / 4, see docs/EXECUTION_PLAN.md)
Today's task: ____

Before doing anything:
1. Read README.md, docs/PROJECT_OVERVIEW.md, docs/ROLES.md (my role's section
   in full), TEAM_RULES.md, docs/EXECUTION_PLAN.md, docs/CONTRACTS.md,
   docs/DECISIONS.md and my worklog at docs/worklogs/<my role>.md.
2. Tell me in a few lines: what my role owns, what is already done according
   to my worklog, and what the plan says I should be doing in this block.
3. Propose a short plan for today's task and wait for my go-ahead if the task
   touches anything owned by another role or changes a contract.

While working:
- Stay inside my role's ownership. If something needs to change in another
  role's area, do not change it. List it for me as a request to that role.
- This is a one-day build with NO AI or machine learning in the product.
  Build only the must-haves in docs/PROJECT_OVERVIEW.md section 3 unless I
  say Check 2 has passed. Choose the simplest thing that works.
- Follow TEAM_RULES.md. In particular: invented seed data only, never real
  children's data or secrets; alerts describe what happened and never judge
  a child; the warden must not be able to read alerts or health cases.
- Use the tech stack in docs/PROJECT_OVERVIEW.md. Do not add a new framework
  or service without asking me.
- Write tests for what you build and run them.
- Work on a branch named <role>/<topic> and use commit messages in the form
  "<role>: <what changed>".

When finished:
- Add an entry to my worklog using docs/templates/worklog-entry.md and update
  the status table at the top of that file.
- If a shared interface changed, update docs/CONTRACTS.md. If I made a
  decision that affects others, add it to docs/DECISIONS.md.
- Tell me: what was done, what was tested and the result, what is not done,
  and what I need to ask other roles for.
- Do not open a pull request unless I ask.
```

## Example of a filled-in opening

```
My role: D
Current block: Block 1
Today's task: Write the migration for the nine tables in contract C1 and a
seed script with 30 invented students, 60 days of attendance and the planted
patterns listed in my role's deliverables.
```

## Variations

**Whole-team planning session** (coordinator): replace the three blanks with

```
My role: coordinator
Current block: ____
Today's task: Read all five worklogs and docs/EXECUTION_PLAN.md. Tell me what
is done, what is late, who is blocked on whom, and whether we should apply the
cut list. Update the check checklists in docs/EXECUTION_PLAN.md.
```

**Building the whole thing with Claude in one session** (if the team wants a head start):

```
My role: all five (I am setting up the base for the team)
Current block: Block 1
Today's task: Scaffold the Next.js app using the layout in docs/DECISIONS.md
D-007, write the migration and seed script for the nine tables, and build
login with the two roles. Stop there and tell me what each of the five roles
should pick up next. Add a worklog entry to each role's file for the part of
their area you built.
```

**Write-up after the build:**

```
My role: ____
Current block: Block 4
Today's task: Draft my section of the project report from my worklog and my
merged pull requests. Use only what is recorded there. Mark anything you are
unsure of so I can check it.
```

**Reviewing a teammate's pull request:**

```
My role: ____  (the reviewer)
Current block: ____
Today's task: Review pull request #__ against TEAM_RULES.md rule 4. Check it
runs, does not break main, and respects rules 1 and 2. Give me the review
comments to post; do not post them yourself.
```
