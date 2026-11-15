# Team rules

Ten rules for five people. They exist so that nobody is blocked,
nobody's work is lost, and no child's data is ever exposed. If a rule is
getting in the way, change it by agreement and record it in
[docs/DECISIONS.md](docs/DECISIONS.md). Do not quietly ignore it.

## 1. Children's data is never in the repository

This rule outranks every other rule and the deadline.

- **No real data** about any child, guardian or staff member goes into git, a pull request, a screenshot, a slide, a chat group, or a prompt to an AI tool.
- We build, test and demo with **invented seed data** from D's seed script.
- **Secrets** (passwords, API keys, `.env` files) and the database file (`data/`) never go into git.
- If you see real data or a secret in the repo, tell the team immediately. Removing it and changing the key comes before any other work.

## 2. Alerts point at something to look at. They never judge a child

- An alert says what happened ("absent for asthma 3 times in 30 days"), not what a child is. No screen, variable name, commit message or document calls a child a problem.
- Nothing happens to a child because of an alert until the manager has looked at it.
- The warden cannot read alerts or health cases. The server enforces this on every page and API route, not only in the menus.
- There is no AI or machine learning in this product. Do not add any.

## 3. Write down what you did, truthfully

- Each role has one worklog: `docs/worklogs/<ROLE>.md`. Add an entry whenever you work on your area, using [the template](docs/templates/worklog-entry.md). Five minutes each.
- Say what you actually did: read, ran, tested, changed, learned. Say where an AI assistant did the work.
- **Never write an entry for work you did not do.** The first entry in each worklog records how the app was built. Yours go above it.
- A choice others must live with goes in [docs/DECISIONS.md](docs/DECISIONS.md). So does everything we cut.

## 4. Small pull requests, fast reviews, `main` always runs

- Nobody pushes directly to `main`.
- Branch names: `<role>/<short-topic>`, for example `b1/login`, `f2/attendance-screen`, `d/schema`.
- Keep pull requests small and merge often. A branch that lives all day will not merge at the end.
- One approval from any teammate, preferably the person whose work it touches. **Review within 15 minutes of being asked.** Check three things: it runs, it does not break `main`, it respects rules 1 and 2.
- Anything touching tables or access rules needs **D**. Anything touching login or role checks needs **B1**.
- If `main` breaks, whoever broke it fixes it before doing anything else.

## 5. Do not change a shared shape silently

- [docs/CONTRACTS.md](docs/CONTRACTS.md) records the shapes the areas share: the tables (D), the endpoints (B1), the rules and alert format (B2), what the screens send (F2), the shared components (F1).
- A change to any of these is announced to the team **before** it is merged, and the file is updated in the same commit.

## 6. Commit often

- Commit message format: `<role>: <what changed>`, for example `d: add attendance table`.
- Commit and push every working step. Nothing should exist only on your laptop for more than 30 minutes.
- Never commit dependencies, build output or secrets (see `.gitignore`).

## 7. Done means working, tested and merged

A piece of work is **done** only when:

- [ ] It works after `npm run build` and `npm start` with freshly reset data
- [ ] `npm test` and `npm run lint` pass
- [ ] It is merged to `main`
- [ ] The warden still cannot reach manager-only data
- [ ] For warden screens: it works on a real phone
- [ ] Your worklog says so

"Almost finished" means **not done**.

## 8. Say it early

- **Stuck for more than 20 minutes? Ask.**
- If you will not finish something another role is waiting for, say so the moment you know.
- **Teach-back and two rehearsals**, all five together (see [docs/EXECUTION_PLAN.md](docs/EXECUTION_PLAN.md)).
- Keep one chat thread for the day. Post there when you merge something others depend on.

## 9. Decide in five minutes, write it down, move on

- The **owner** of a piece decides inside that piece ([docs/ROLES.md](docs/ROLES.md)).
- A decision across roles: the people affected talk for five minutes. Still stuck? The **coordinator** decides.
- **No new features before the presentation.** The must-haves are built and tested. Until the demo is done, only fix bugs.
- **Never claim what is not built.** The list is in [docs/EXECUTION_PLAN.md](docs/EXECUTION_PLAN.md#what-is-not-built).

## 10. Respect the people

- **The trust and its children** are the reason this exists. Do not use their real names or details anywhere, and do not promise them features we have not built.
- **Each other.** Criticise code, not people. Say thank you. Credit help in your worklog.
- **Fair share.** Everyone presents their own part. If someone is overloaded, say so at a check so the team can rebalance.
- **AI coding assistants** (Claude and others) were used to build this and may be used to change it. The product itself contains no AI. You are responsible for your area: read it, run it, and be able to explain it. If asked how it was built, say so plainly; check your course's rules on AI tools. Rule 1 applies to prompts.

---

## Quick reference

| I want to... | Do this |
|---|---|
| Start a piece of work | Branch `<role>/<topic>` from an up-to-date `main` |
| Get work merged | Open a small pull request, ask a teammate in the chat, they review within 15 minutes |
| Change a table, endpoint or alert shape | Tell the team first, update `docs/CONTRACTS.md`, then merge |
| Finish a work session | Push, write the worklog entry |
| Record a decision or a cut | Add a row to `docs/DECISIONS.md` |
| Report a data or secret leak | Tell everyone now. Everything else stops |
