# Team rules

Ten rules for five people and one day. They exist so that nobody is blocked,
nobody's work is lost, and no child's data is ever exposed. If a rule is
getting in the way, change it by agreement and record it in
[docs/DECISIONS.md](docs/DECISIONS.md). Do not quietly ignore it.

## 1. Children's data is never in the repository

This rule outranks every other rule and the deadline.

- **No real data** about any child, guardian or staff member goes into git, a pull request, a screenshot, a slide, a chat group, or a prompt to an AI tool.
- We build, test and demo with **invented seed data** from D's seed script.
- **Secrets** (database passwords, API keys, `.env` files) never go into git. Share them privately and set them in the Vercel and Supabase dashboards.
- If you see real data or a secret in the repo, tell the team immediately. Removing it and changing the key comes before any other work.

## 2. Alerts point at something to look at. They never judge a child

- An alert says what happened ("absent for asthma 3 times in 30 days"), not what a child is. No screen, variable name, commit message or document calls a child a problem.
- Nothing happens to a child because of an alert until the manager has looked at it.
- The warden cannot read alerts or health cases. The database enforces this (Row Level Security), not only the screens.
- There is no AI or machine learning in this product. Do not add any.

## 3. Write down what you did at the end of every block

- Each role has one worklog: `docs/worklogs/<ROLE>.md`. Add an entry at the **end of each block** (four in the day), using [the template](docs/templates/worklog-entry.md). Five minutes each.
- Say what you built, what works, what does not, and what you need from someone.
- A choice others must live with goes in [docs/DECISIONS.md](docs/DECISIONS.md). So does everything we cut.
- The worklogs are the record of who did what. Without an entry, the work is not credited.

## 4. Small pull requests, fast reviews, `main` always runs

- Nobody pushes directly to `main`.
- Branch names: `<role>/<short-topic>`, for example `b1/login`, `f2/attendance-screen`, `d/schema`.
- Keep pull requests small and merge **at least once per block**. A branch that lives all day will not merge at the end.
- One approval from any teammate, preferably the person whose work it touches. **Review within 15 minutes of being asked.** Check three things: it runs, it does not break `main`, it respects rules 1 and 2.
- Anything touching tables or access rules needs **D**. Anything touching login or role checks needs **B1**.
- If `main` breaks, whoever broke it fixes it before doing anything else.

## 5. Agree the shapes in the first hour, then do not change them silently

- Block 0 produces [docs/CONTRACTS.md](docs/CONTRACTS.md): the tables (D), the endpoints (B1), the alert format (B2), the fields each screen sends (F2), the shared components (F1).
- After Block 0, a change to any of these is announced out loud to the team **before** it is merged.
- If the other side is not ready, build against the agreed shape with placeholder data. Do not wait, and do not invent your own shape.

## 6. Commit often

- Commit message format: `<role>: <what changed>`, for example `d: add attendance table`.
- Commit and push every working step. Nothing should exist only on your laptop for more than 30 minutes.
- Never commit dependencies, build output or secrets (see `.gitignore`).

## 7. Done means working on the deployed app

A piece of work is **done** only when:

- [ ] It works on the deployed app with the seed data, not only on your laptop
- [ ] It is merged to `main`
- [ ] The warden still cannot reach manager-only data
- [ ] For rules: the unit tests pass
- [ ] For warden screens: it works on a real phone
- [ ] Your worklog says so

"Almost finished" means **not done**.

## 8. Say it early

- **Stuck for more than 20 minutes? Ask.** On a one-day build, 20 minutes is a lot.
- If you will not finish something another role is waiting for, say so the moment you know.
- **Three checks in the day**, all five together, 30 minutes each (see [docs/EXECUTION_PLAN.md](docs/EXECUTION_PLAN.md)). Stop what you are doing and attend.
- Keep one chat thread for the day. Post there when you merge something others depend on.

## 9. Decide in five minutes, write it down, move on

- The **owner** of a piece decides inside that piece ([docs/ROLES.md](docs/ROLES.md)).
- A decision across roles: the people affected talk for five minutes. Still stuck? The **coordinator** decides.
- **Must-haves before stretch.** Nobody starts a stretch item until all eight must-haves pass Check 2.
- **Feature freeze at Check 2.** After it, only bug fixes, testing and deployment.
- **If the day runs late**, cut in this order: all stretch items; the 30-day chart; the stock table for the manager; the low-attendance rule. Never cut login and roles, attendance entry, the repeated-illness rule, the alert centre, or database-level access rules.

## 10. Respect the people

- **The trust and its children** are the reason this exists. Do not use their real names or details anywhere, and do not promise them features we have not built.
- **Each other.** Criticise code, not people. Say thank you. Credit help in your worklog.
- **Fair share.** Everyone presents their own part. If someone is overloaded, say so at a check so the team can rebalance.
- **AI coding assistants** (Claude and others) may be used to write code and documents. The product itself contains no AI. You are responsible for what you commit: read it, run it, and be able to explain it in the demo. Rule 1 applies to prompts.

---

## Quick reference

| I want to... | Do this |
|---|---|
| Start a piece of work | Branch `<role>/<topic>` from an up-to-date `main` |
| Get work merged | Open a small pull request, ask a teammate in the chat, they review within 15 minutes |
| Change a table, endpoint or alert shape | Tell the team first, update `docs/CONTRACTS.md`, then merge |
| Finish a block | Push, merge, write the worklog entry |
| Record a decision or a cut | Add a row to `docs/DECISIONS.md` |
| Report a data or secret leak | Tell everyone now. Everything else stops |
