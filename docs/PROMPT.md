# Prompt to start a session with Claude

Copy the prompt below, fill in the three blanks, and paste it as your first
message. Any of the five team members can use it. It works because the
repository's documents carry the context, so the prompt only has to say who
you are and what you want.

## The prompt

```
I am working on CareTrack in this repository (adhi1106/service-learning-project).

My role: ____  (F1 / F2 / B1 / B2 / D)
Current phase: ____  (Phase 0 / 1 / 2 / 3 / 4, see docs/EXECUTION_PLAN.md)
Today's task: ____

Before doing anything:
1. Read README.md, docs/PROJECT_OVERVIEW.md, docs/ROLES.md (my role's section
   in full), TEAM_RULES.md, docs/EXECUTION_PLAN.md, docs/CONTRACTS.md,
   docs/DECISIONS.md and my worklog at docs/worklogs/<my role>.md.
2. Tell me in a few lines: what my role owns, what is already done according
   to my worklog, and what the plan says I should be doing in this phase.
3. Propose a short plan for today's task and wait for my go-ahead if the task
   touches anything owned by another role or changes a contract.

While working:
- Stay inside my role's ownership. If something needs to change in another
  role's area, do not change it. List it for me as a request to that role.
- Follow TEAM_RULES.md. In particular: synthetic data only, never real
  children's data or secrets; AI outputs are "support-needed" signals for
  human review, never labels; the warden must not be able to reach
  manager-only data.
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
Current phase: Phase 0
Today's task: Design the PostgreSQL schema for the students, attendance and
health tables as an ER diagram plus the first migration, and list it as
contract C1.
```

## Variations

**Whole-team planning session** (coordinator): replace the three blanks with

```
My role: coordinator
Current phase: ____
Today's task: Read all five worklogs and docs/EXECUTION_PLAN.md. Tell me what
is done, what is late, who is blocked on whom, and whether we should apply the
cut list. Update the milestone checklists in docs/EXECUTION_PLAN.md.
```

**Report writing** (end of project):

```
My role: ____
Current phase: Phase 4
Today's task: Draft my chapter of the project report from my worklog and my
merged pull requests. Use only what is recorded there. Mark anything you are
unsure of so I can check it.
```

**Reviewing a teammate's pull request:**

```
My role: ____  (the reviewer)
Current phase: ____
Today's task: Review pull request #__ against TEAM_RULES.md rule 4 and rule 7.
Check it works, is tested, respects the privacy rules, and includes a worklog
entry. Give me the review comments to post; do not post them yourself.
```
