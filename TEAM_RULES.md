# Team rules

Ten rules for five people. They exist so that nobody is blocked, nobody's work
is lost, and no child's data is ever exposed. If a rule is getting in the way,
change it by agreement and record the change in
[docs/DECISIONS.md](docs/DECISIONS.md). Do not quietly ignore it.

## 1. Children's data is never in the repository

This rule outranks every other rule and every deadline.

- **No real data** about any child, guardian, donor or staff member goes into git, a pull request, an issue, a screenshot, a slide, a chat group, or a prompt to an AI tool. That includes names, photos, medical notes, incident reports and bills.
- Development, tests and demos use **synthetic data** from D's documented generators.
- Real data lives only in the production database, entered through the app, at the trust.
- **Secrets** (database passwords, API keys, `.env` files) never go into git. Share them through the hosting dashboards.
- Notes from visits to the trust describe *workflows*, never individual children.
- If you see real data or a secret in the repo, tell the team immediately. Removing it and rotating the key comes before any other work.

## 2. AI outputs are signals, never labels

- Every model output is worded as a **"support-needed" signal** for a human to review. No screen, log, variable name, commit message or document calls a child "problematic", "at risk" as a verdict, "bully" or similar.
- Every signal carries an **explanation**, and nothing happens to a child because of a signal until the manager has reviewed it.
- Relationship, incident and medical data are visible **only to the manager**. This is enforced in the database (Row Level Security), not only on the screen.
- We report model results honestly, including when a complex model loses to a simple one, and we always say that the data is synthetic.

## 3. Document what you do, when you do it

- Each role has one worklog: `docs/worklogs/<ROLE>.md`. Add an entry for **every work session**, using [the template](docs/templates/worklog-entry.md).
- The worklog entry is committed **in the same pull request as the work**. A PR without a worklog entry is not ready for review.
- Write for a teammate who was not there: what you did, why, what you learned, what is blocked, what comes next.
- A decision that others must live with (a library, a schema choice, a cut feature) goes in [docs/DECISIONS.md](docs/DECISIONS.md).
- A change to something another role depends on (database schema, API shape, alert or score format) goes in [docs/CONTRACTS.md](docs/CONTRACTS.md) **before** it is merged.
- Your worklog is the source for your chapter of the final report. Ten minutes a day now saves days at the end.

## 4. Nothing reaches `main` without a pull request and a cross-layer review

- `main` always works. Nobody pushes to it directly.
- Branch names: `<role>/<short-topic>`, for example `b1/auth-rbac`, `f2/attendance-offline`, `d/rls-policies`.
- One PR does one thing. Aim for under about 400 changed lines; split bigger work.
- Every PR needs **one approval from a different layer**, so that knowledge crosses the team:

  | Author | Default reviewer | Why |
  |---|---|---|
  | F1 | B2 | B2 produces the alerts and scores F1 displays |
  | F2 | B1 | B1 serves the endpoints F2 calls |
  | B1 | D | D owns the tables B1 reads and writes |
  | B2 | F1 | F1 consumes what B2 produces |
  | D | B1 or B2 | They consume the schema and pipelines |

  Anything that touches the schema, security rules or migrations also needs **D**. Anything that touches login or permissions also needs **B1**.
- Review within **one working day**. If you cannot, say so and hand it to someone else.
- The author merges after approval and green CI. Use squash merge. Delete the branch.
- Reviewers check: does it work, is it tested, does it respect rules 1 and 2, is the worklog there.

## 5. Agree the contract before building on it

- The interfaces between roles are written down in [docs/CONTRACTS.md](docs/CONTRACTS.md): the database schema (D), the API contract (B1), the alert and score formats (B2), the entry-screen data shapes (F2), the design system (F1).
- The owner of a contract may change it, but only after telling every role that depends on it and updating the file.
- If the other side is not ready, build against the contract with mock or synthetic data. Do not wait, and do not invent your own shape.

## 6. Commit small, commit clearly

- Commit message format: `<role>: <what changed>`, for example `d: add attendance table with one-per-day constraint`.
- Commit working steps often. Push at least once per work session so nothing lives only on your laptop.
- Never commit generated files, dependencies, trained model binaries or secrets (see `.gitignore`).
- Do not rewrite history on a branch someone else is using.

## 7. Tested means done

A piece of work is **done** only when all of these are true:

- [ ] It does what the plan says, on synthetic data
- [ ] It has automated tests (Vitest, Pytest or Playwright) and CI is green
- [ ] It respects the access rules: the warden cannot reach manager-only data
- [ ] It is merged to `main` through a reviewed PR
- [ ] The worklog entry is written and the status table in your worklog is updated
- [ ] For user-facing work: it works on a phone (F2) or a laptop (F1) and meets the accessibility target
- [ ] For AI work: the evaluation numbers are recorded, with the baseline next to them

"It works on my machine" and "it is almost finished" both mean **not done**.

## 8. Talk early, especially about being stuck

- **Daily check-in**, 10 minutes, or three written lines in the team chat: what I finished, what I am doing next, what is blocking me.
- **Stuck for more than 2 hours? Ask.** Being stuck quietly is the most expensive thing on a 3-week project.
- If you will miss a date that another role depends on, say so **as soon as you know**, not on the day.
- **Integration check at the end of every phase** (see [docs/EXECUTION_PLAN.md](docs/EXECUTION_PLAN.md)): all five together, run the three main flows end to end, record what broke.
- Keep technical discussion in GitHub (PRs, issues) so it is findable later. Chat is for coordination.

## 9. Decide quickly, record it, move on

- The **owner** of a piece decides inside that piece (see [docs/ROLES.md](docs/ROLES.md)).
- A decision that crosses roles is made by the people affected, together. Aim to settle it the same day.
- If it is still stuck after one discussion, the **coordinator** decides.
- Once decided, it is written in [docs/DECISIONS.md](docs/DECISIONS.md) and everyone follows it. Reopen it only with new information.
- **If time runs short, cut in this order** (from the proposal): the LSTM and the email digest first, then roommate link prediction (keep mentor pairing). Record every cut.

## 10. Respect the people

- **The trust's staff are the reason this exists.** Be punctual and prepared at the trust, do not take photos of children, and do not promise features we may cut. Contact with the trust goes through the coordinator.
- **Each other.** Criticise code, not people. Review kindly and specifically. Give credit in worklogs and in the report for help you received.
- **Fair share.** Everyone presents their own part in the demo and writes their own chapter. If someone is overloaded or falling behind, raise it at the check-in so the team can rebalance, rather than covering for it silently.
- **AI assistants** (Claude and others) are allowed for code and documentation. You remain responsible for what you commit: read it, test it, understand it well enough to explain it in the demo. Note in your worklog where an assistant did substantial work. Rule 1 applies to prompts.

---

## Quick reference

| I want to... | Do this |
|---|---|
| Start a piece of work | Branch `<role>/<topic>` from an up-to-date `main` |
| Finish a work session | Commit, push, add a worklog entry |
| Get work merged | Open a PR with the template filled in, request the cross-layer reviewer |
| Change the schema or an API | Tell the affected roles, update `docs/CONTRACTS.md`, then open the PR |
| Record a decision | Add a row to `docs/DECISIONS.md` |
| Report a problem | Tell the team in chat now, open a GitHub issue for the record |
| Report a data or secret leak | Tell the whole team immediately. Everything else stops |
