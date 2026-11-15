# Plan for today

The app is built and tested. What is left today is for five people to make it
theirs: run it, read their area, rehearse, and present.

| Step | Who | Time needed |
|---|---|---|
| [1. Get it running](#1-get-it-running) | Everyone | 20 min |
| [2. Do both flows by hand](#2-do-both-flows-by-hand) | Everyone | 15 min |
| [3. Read your area](#3-read-your-area) | Each role | 45–60 min |
| [4. Teach it back](#4-teach-it-back) | Everyone together | 30 min |
| [5. Rehearse](#5-rehearse) | Everyone together | 30 min, twice |
| [6. Present](#6-present) | Everyone | 10 min |

Before step 1: assign the five roles and write the names in
[README.md](../README.md) and [ROLES.md](ROLES.md).

---

## 1. Get it running

- [ ] Install Node.js 22 (LTS) from nodejs.org
- [ ] Get the code: `git clone`, then `git checkout claude/team-plan-roles-docs-togjoo` (or `main` once it is merged)
- [ ] `npm install`
- [ ] `npm run build`, then `npm start`
- [ ] Open `http://localhost:3000` and log in as `manager` / `manager123`
- [ ] `npm test` shows 43 tests passing

If `npm install` fails on Windows with an error about `better-sqlite3`, check
that Node is version 22 with `node -v`, delete the `node_modules` folder, and
run `npm install` again.

At least two laptops should be able to run it, in case one fails on the day.

## 2. Do both flows by hand

Press **Reset demo data** on the dashboard first.

**Flow 1: health**

- [ ] Log in as `warden` (on a phone, or a narrow browser window)
- [ ] Attendance → Class 6 → tap Aarav K. → Medical → Asthma → Save
- [ ] Log in as `manager`: a critical alert is at the top of Alerts
- [ ] Health cases: one case in "Open". Move it to Resolved
- [ ] Alerts: the asthma alert is now resolved

**Flow 2: stock**

- [ ] As `warden`: Stock → Used → Rice → 5 → Save. It says 17 kg left
- [ ] As `manager`: a "Rice: 17 kg left" warning is in Alerts, and rice is on the dashboard's low-stock list

**Access check**

- [ ] As `warden`, open `/manager/alerts`. You are sent back to the warden's home
- [ ] As `warden`, open `/api/alerts`. It says you do not have access

## 3. Read your area

Open [ROLES.md](ROLES.md), find your role, and work through "Your files" and
"Understand before you present". Then:

- [ ] Make one small change in your area and see it take effect (ideas below)
- [ ] Tick the review checklist in your worklog and write what you learned

| Role | A small change to try |
|---|---|
| D | Add a new item to `ITEMS` in `db/seed.ts`, run `npm run db:reset`, find it in the stock table |
| B2 | Change `REPEAT_ILLNESS_THRESHOLD` to 2 in `lib/rules/rules.ts`, run `npm test`, see which tests fail and why. Change it back |
| B1 | Open `/api/students` in the browser while logged in, then while logged out. Compare the answers |
| F1 | Change a card label on the dashboard in `app/manager/page.tsx` |
| F2 | Add an absence reason in `db/seed.ts` (`REASONS`), reset, and see it appear as a button on the attendance screen |

Use `npm run dev` while making changes: the page reloads by itself. Undo
experiments you do not want to keep with `git checkout -- <file>`.

## 4. Teach it back

All five together. Each person explains their area to the others in three
minutes, without notes, and the others ask the questions from
[PRESENTATION.md](PRESENTATION.md). Anything you could not answer, look up and
write in your worklog.

## 5. Rehearse

Follow [PRESENTATION.md](PRESENTATION.md) exactly, with a timer, twice.

- [ ] Reset demo data before each run
- [ ] First run: find what goes wrong (Wi-Fi, logins, who has which screen)
- [ ] Second run: under 10 minutes, with handovers that do not need discussion
- [ ] Decide the fallback if the phone cannot reach the laptop: a narrow browser window on the laptop

## 6. Present

- [ ] `npm run build` and `npm start` on the presenting laptop
- [ ] Reset demo data
- [ ] Manager logged in on the laptop, warden logged in on the phone
- [ ] Terminal and editor open for B2 and D

---

## What is built

All eight must-haves from [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md#3-what-we-build), plus one stretch item (the absence-reason breakdown on the dashboard).

| Check | Result |
|---|---|
| Unit tests (`npm test`) | 43 passing |
| Browser run of both flows, access checks, bad input and reset | 25 checks passing |
| Type check and lint | Clean |
| Production build | Succeeds |

## What is not built

Say so if asked. Do not claim any of these.

- No deployment to a public server. It runs on a laptop
- No offline entry, no Kannada, no PDF reports
- No marks, scholarships, donations or expenses
- No testing with the real warden, and no real data
- No https. The demo runs over plain http on local Wi-Fi

## Still to settle

1. **Has the faculty guide agreed to a non-AI version?** The approved proposal is titled "AI-Assisted" and promises two AI modules. Ask before presenting.
2. **How the build is described.** If asked who wrote the code, the answer is in the [README](../README.md#how-this-was-built). Check your course's rules on AI tools.
3. Who is the coordinator?
