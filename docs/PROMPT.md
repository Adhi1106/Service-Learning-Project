# Prompt to start a session with Claude

Copy the prompt below, fill in the two blanks, and paste it as your first
message. Any of the five team members can use it. It works because the
repository's documents carry the context, so the prompt only has to say who
you are and what you want.

## The prompt

```
I am working on CareTrack in this repository (adhi1106/service-learning-project).

My role: ____  (F1 / F2 / B1 / B2 / D)
Today's task: ____

Before doing anything:
1. Read README.md, docs/PROJECT_OVERVIEW.md, docs/ROLES.md (my role's section
   in full), TEAM_RULES.md, docs/CONTRACTS.md, docs/DECISIONS.md, my worklog
   at docs/worklogs/<my role>.md, and the code files listed for my role.
2. Tell me in a few lines: what my role owns, and what is already built.
3. Propose a short plan for today's task and wait for my go-ahead if the task
   touches anything owned by another role or changes a contract.

While working:
- Stay inside my role's ownership. If something needs to change in another
  role's area, do not change it. List it for me as a request to that role.
- The app is built and working, with NO AI or machine learning in the
  product. Keep changes small. Do not break the two presentation flows in
  docs/VIVA_GUIDE.md.
- Follow TEAM_RULES.md. In particular: never put real children's data or
  secrets in a chat or a commit; alerts describe what happened and never judge
  a child; the warden must not be able to read alerts or health cases.
- Use the tech stack in docs/PROJECT_OVERVIEW.md. Do not add a new framework
  or service without asking me.
- After any change run npm test, npm run lint and npm run build.
- Work on a branch named <role>/<topic> and use commit messages in the form
  "<role>: <what changed>".

When finished:
- Add an entry to my worklog using docs/templates/worklog-entry.md. Say
  truthfully what I did and what you did.
- If a shared interface changed, update docs/CONTRACTS.md. If I made a
  decision that affects others, add it to docs/DECISIONS.md.
- Tell me: what was done, what was tested and the result, what is not done,
  and what I need to ask other roles for.
- Do not open a pull request unless I ask.
```

## Examples of a filled-in opening

**Learn your area** (the most useful one today):

```
My role: B2
Today's task: Teach me my area. Walk me through each of my files in the order
they run when the warden saves attendance, then ask me the questions from my
section of docs/VIVA_GUIDE.md one at a time and correct my answers. Change
no code.
```

**Make a change:**

```
My role: D
Today's task: Add a new child to data/records/children.csv and a matching
row in health_records.csv, reload with npm run db:reset, and check the child
appears on the Children page with all tests still passing.
```

**Check readiness** (coordinator):

```
My role: coordinator
Today's task: Run the tests, the build, and both presentation flows from
docs/VIVA_GUIDE.md in a browser. Tell me anything that does not behave as
the script says. Change no code.
```

**Write-up after the presentation:**

```
My role: ____
Today's task: Draft my section of the project report from my worklog and the
code in my area. Use only what is recorded there, including how the app was
built. Mark anything you are unsure of so I can check it.
```
