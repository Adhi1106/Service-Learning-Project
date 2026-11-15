# Presentation guide

About 10 minutes, everyone speaks. The demo follows one child's story and one
stock item, so the audience sees the system work rather than hearing a list of
features.

## Before you start

- [ ] Laptop: `npm run build` then `npm start`. Open `http://localhost:3000`
- [ ] Phone on the same Wi-Fi, open `http://<laptop-address>:3000` (or use a narrow browser window if the Wi-Fi blocks it)
- [ ] Log in as manager and press **Reset demo data**
- [ ] Laptop browser: logged in as `manager`. Phone: logged in as `warden`
- [ ] A terminal open in the project folder, ready for `npm test`
- [ ] `db/schema.sql` and `lib/rules/rules.ts` open in an editor

After a reset the system always starts in the same state: 3 warnings, no
health cases, rice at 22 kg, and Aarav K. with 2 asthma absences.

## Running order

| # | Who | Minutes | What |
|---|---|---|---|
| 1 | Coordinator | 1 | The problem |
| 2 | D | 1.5 | The data |
| 3 | F2 | 2 | Warden marks attendance and uses stock |
| 4 | B2 | 2 | The rules that just fired |
| 5 | F1 | 2 | Manager sees and acts |
| 6 | B1 | 1.5 | Who is allowed to do what |
| 7 | Coordinator | 0.5 | What was cut, what comes next |

---

## 1. Coordinator: the problem

**Say**

- Grace and Light Trust runs a children's home in Hoskote. A warden and a manager look after the children, using paper records.
- Three things go unnoticed: a child who keeps missing school, a child who is ill again and again, and supplies running out.
- A child who misses school three times a month for asthma needs a doctor. On paper, nobody connects the three entries.
- CareTrack connects them. The warden records, the system notices, the manager acts.
- Everything you will see is invented data. No real child's information is in this project.

---

## 2. D: the data

**Show:** `db/schema.sql`, then the manager's Students page.

**Say**

- Ten tables. The main ones: students, attendance, stock items, stock transactions, alerts, health cases.
- The database refuses bad data by itself, whatever the app does:
  - one attendance row per child per day
  - an absence must have a reason
  - stock can never go below zero
  - the same alert cannot be open twice
- A trigger keeps each item's balance correct every time stock is recorded.
- The data is invented: 30 children, 60 days of attendance, 15 items. Four patterns are planted on purpose so we can show the rules. It is generated from today's date, so the demo works on any day.

**Questions to expect**

- *Why SQLite and not MySQL or PostgreSQL?* The whole database is one file. Nothing to install and no account needed, which suits a small home with one laptop. The schema is standard SQL and could move to PostgreSQL.
- *What is a trigger?* Code the database runs by itself when a row is added. Ours updates the stock balance.
- *How do you stop two attendance entries for one day?* A UNIQUE constraint on (student, date). Saving again updates the existing row.
- *Is it normalised?* Yes. Reasons and illnesses are their own tables and are referenced by ID, so the rules can count by illness reliably.

---

## 3. F2: the warden's phone

**Do, on the phone**

1. Home screen: both classes show "Not marked".
2. Tap **Class 6**. Everyone is already "Present".
3. Tap **Aarav K.** → **Medical** → **Asthma**. Point out the "14 present · 1 absent" bar.
4. **Save**. "Saved: 14 present, 1 absent."
5. **Stock** tab → **Used** → **Rice** → quantity **5** → **Save**. "Rice: 17 kg now in stock."

**Say**

- The warden has a phone and very little time, so the screen is built for speed: everyone starts as present and you only tap who is absent.
- A reason is required for every absence, and the illness for a medical one. That detail is what makes the alerts possible.
- The warden is told only "Saved". Alerts and health information go to the manager.

**Questions to expect**

- *What if the warden makes a mistake?* Open the class again, correct it, save again. It replaces the earlier entry.
- *What if they forget the reason?* The form names the child and will not save. The server checks again.
- *Does it work offline?* No. Offline entry was in the original proposal and was cut for time.
- *Is it an app from the Play Store?* No, it is a web page designed for a phone screen. Nothing to install.

---

## 4. B2: the rules

**Show:** `lib/rules/rules.ts`, then run `npm test` in the terminal.

**Say**

- Two things just happened without anyone asking. That was Aarav's third asthma absence in 30 days, and rice dropped below its minimum of 20 kg.
- There are three rules:
  1. Same illness, 3 or more absences in 30 days → critical alert, and a health case opens.
  2. Attendance below 85% over 30 days, or 3 school days absent in a row → warning.
  3. Stock below its minimum, or expiring within 30 days → warning.
- The rules run every time attendance or stock is saved.
- An alert is never raised twice for the same thing, so the manager is not flooded.
- 43 automated tests, including the exact boundaries: 2 absences does not fire and 3 does; exactly 85% does not fire.
- This is deliberately not AI. Every alert can be explained by pointing at the records that caused it, and it never judges a child. It only says what happened.

**Questions to expect**

- *Why 3 absences, why 85%?* They come from the project proposal. They are named constants at the top of `rules.ts` and can be changed in one place.
- *What stops duplicate alerts?* Each alert has a key such as `illness:1:1`. A new one is not created while one with the same key is active, and the database enforces that with a unique index.
- *If the manager resolves it, does it come straight back?* No. A repeated-illness alert needs a new absence. The others wait 7 days.
- *Why no machine learning?* With about 30 children there is too little data to train anything trustworthy, and a wrong prediction about a child does harm. Fixed rules are transparent.

---

## 5. F1: the manager's laptop

**Do, on the laptop**

1. Refresh the **Dashboard**. Alerts to review went from 3 to 5; one is critical; one health case is open; rice is on the low-stock list.
2. **Alerts**: the critical asthma alert is at the top. Open Aarav's profile from it and show the three asthma absences.
3. **Health cases**: the case is in "Open". Type a note ("Doctor visit booked"), then move it **Scheduled → Under treatment → Resolved**.
4. Back to **Alerts**: the asthma alert is now resolved. **Acknowledge** the rice alert.

**Say**

- The dashboard answers four questions at a glance: who is in school today, what needs my attention, which children are under care, what is running low.
- The chart shows absences per school day; the list beside it shows why.
- A health case is followed through four steps until it is resolved, so nothing is forgotten. Closing the case closes its alert.

**Questions to expect**

- *How does the page update?* The button calls an API route, then the page reloads its data from the server.
- *Which chart library?* None. The bars are drawn with plain HTML and CSS, which keeps the app small.
- *Can a case move backwards?* No, one step forward at a time. The server refuses anything else.
- *Does it work on a phone?* The manager screens adapt to a narrow screen, but they are designed for a laptop.

---

## 6. B1: who is allowed to do what

**Do**

1. On the phone (logged in as warden), type `/manager/alerts` in the address bar. It bounces back to the warden's home.
2. On the phone, open `/api/alerts`. It shows `{"error":"You do not have access to this."}`.
3. Optional: log out and open `/manager`. It goes to the login page.

**Say**

- Two roles. The manager sees everything. The warden can record attendance and stock and see the student list, and nothing else.
- Hiding the menu is not security. Every page and every API route checks the role on the server, so typing the address directly is refused.
- Passwords are never stored. Only a salted hash is.
- Everything sent to the server is validated before it is saved: dates, quantities, IDs.

**Questions to expect**

- *How does login work?* The password is checked against a scrypt hash. A random token is stored in the `sessions` table and sent to the browser as an http-only cookie, which page scripts cannot read.
- *What is the difference between 401 and 403?* 401: not logged in. 403: logged in, but this role is not allowed.
- *Is it secure enough for real use?* Not yet. Real use would need https, real accounts with strong passwords, and backups. This is listed in what comes next.
- *What framework?* Next.js with TypeScript. Pages and API routes live in one project.

---

## 7. Coordinator: close

**Say**

- The original proposal was larger: two AI modules, offline entry, Kannada, donor reports. We cut those to deliver something complete and tested, and kept the three problems that matter most day to day.
- What comes next: testing with the real warden, https and real accounts, offline entry, Kannada, and then entering real data at the trust with their consent.
- The app was built with the help of an AI coding assistant, and each of us has taken one area to understand and explain. The product itself contains no AI.

---

## Questions anyone might get

| Question | Answer |
|---|---|
| Is this real data? | No. Every name and number is invented. Real children's data is never put in the code, a demo or a slide. |
| Is there AI in it? | No. Alerts come from three fixed rules. |
| Who built what? | The code was written in one session with an AI coding assistant, directed by the team. Each member owns one area: they have read it, run it and can explain and change it. |
| Is it deployed? | It runs on a laptop and is used from a phone over Wi-Fi. It is not on a public server. |
| How is it tested? | 43 automated tests for the rules and database constraints, and a browser run-through of both flows and the access checks. |
| What does it cost the trust? | Nothing. Every tool used is free, and it needs one laptop. |
| What was the hardest part? | Answer for your own area, honestly. |
