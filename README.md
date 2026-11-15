# CareTrack

Attendance, health and stores for the children of **Grace and Light Trust**,
a children's home in Hoskote, Bengaluru Rural, Karnataka.

Service Learning Project, team of five. There is **no AI or machine learning**
in the product: alerts come from three simple, fixed rules.

## What it does

The home looks after 47 children in Classes 1 to 7, who all attend
**Government Higher Primary School (Main), Hosakote**. The **warden**,
Manjunatha B, uses CareTrack on a phone to record each day's school attendance
(with the reason for every absence) and what is issued from the store. The
**manager**, Sunitha Prakash, uses it on the office laptop to see who is
missing school and why, which children keep falling ill, each child's health
record, and which supplies are running low. Three fixed rules raise alerts on
their own, for example "absent with asthma 3 times in 30 days", and the
manager follows each health case until it is resolved.

| Manager (laptop) | Warden (phone) |
|---|---|
| ![Dashboard](docs/screenshots/adhira-manager/01-dashboard-before.jpg) | ![Attendance](docs/screenshots/neha-warden/03-attendance-marking.jpg) |

## Run it

You need [Node.js](https://nodejs.org) 22 (LTS). In this folder:

```bash
npm install          # once
npm run db:reset     # loads the home's records into the database
npm run build        # once, and again after any code change
npm start            # http://localhost:3000
```

| Person | Role | Username | Password |
|---|---|---|---|
| Sunitha Prakash | Manager | `sunitha` | `Sunitha@123` |
| Manjunatha B | Warden | `manjunatha` | `Manju@123` |

**On the warden's phone:** connect it to the same Wi-Fi as the laptop, find
the laptop's IP address (`ipconfig` on Windows, `ifconfig` on Mac/Linux), and
open `http://<that-address>:3000`.

| Command | What it does |
|---|---|
| `npm run db:reset` | Rebuilds the database from the records in `data/records/` (nobody is signed out) |
| `npm test` | Runs the 50 automated tests |
| `npm run dev` | Development mode with live reload |
| `npm run lint` | Checks the code style |

## The records

The home's registers are kept as CSV files in [`data/records/`](data/records/),
the format any spreadsheet can save:

| File | Holds |
|---|---|
| `children.csv` | Admission register: 47 children, admission number, date of birth, class, dorm, school |
| `health_records.csv` | Yearly check-up for each child: blood group, height, weight, conditions, allergies, medication, remarks |
| `attendance.csv` | Daily school attendance since August |
| `stock_items.csv`, `stock_entries.csv` | Store items, and every purchase, donation and issue |
| `health_cases.csv` | Health follow-ups with the doctor's notes |
| `staff.csv`, `absence_reasons.csv`, `illnesses.csv` | Sign-in accounts and the lists the warden chooses from |

`npm run db:reset` loads them into the database file `data/caretrack.db`,
which the app uses and which is never committed. Details:
[docs/VIVA_GUIDE.md](docs/VIVA_GUIDE.md#3-joel-thomas-mario-records-and-database-d).

## The team

| Member | Part | Role | Worklog |
|---|---|---|---|
| Adhira Praveen | Manager screens (laptop) | F1 | [F1](docs/worklogs/F1.md) |
| Neha S | Warden screens (phone) | F2 | [F2](docs/worklogs/F2.md) |
| Joel Thomas Mario | Records and database | D | [D](docs/worklogs/D.md) |
| Ashika Valencia A | Sign-in, permissions and APIs | B1 | [B1](docs/worklogs/B1.md) |
| Joseph Mangali | Alert rules and testing | B2 | [B2](docs/worklogs/B2.md) |

## Start here

| If you want to... | Read |
|---|---|
| Prepare for the presentation and viva | [docs/VIVA_GUIDE.md](docs/VIVA_GUIDE.md) |
| Understand the whole project | [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) |
| Know what each person owns | [docs/ROLES.md](docs/ROLES.md) |
| See the tables, endpoints and rules precisely | [docs/CONTRACTS.md](docs/CONTRACTS.md) |
| See why something was decided | [docs/DECISIONS.md](docs/DECISIONS.md) |
| Know the rules the team works by | [TEAM_RULES.md](TEAM_RULES.md) |
| Change the app with Claude | [docs/PROMPT.md](docs/PROMPT.md) |
| Read the original proposal | [docs/proposal/CareTrack_Project_Proposal.pdf](docs/proposal/CareTrack_Project_Proposal.pdf) |

## Where the code is

| Folder | What is in it | Owner |
|---|---|---|
| `data/records/`, `db/`, `lib/db.ts`, `lib/csv.ts` | The records, database design, import | Joel |
| `lib/auth.ts`, `lib/password.ts`, `lib/api.ts`, `lib/queries.ts`, `app/api/` | Sign-in, role checks, queries, API routes | Ashika |
| `lib/rules/` | The three rules, alert writing, and the tests | Joseph |
| `app/manager/`, `components/manager/`, `components/ui.tsx`, `components/icons.tsx`, `components/Brand.tsx` | Manager screens, shared components, icons, logo | Adhira |
| `app/warden/`, `components/warden/`, `app/login/` | Warden phone screens and sign-in | Neha |

## Privacy

Children's records never go to GitHub or into a chat with an AI tool when real
records are used, and health information is shown only to the manager. See
[TEAM_RULES.md](TEAM_RULES.md).

## Status

Working and tested: 50 automated tests pass, and the full presentation flow
passes in a browser. It runs on the office laptop and is used from the phone
over Wi-Fi; it is not on a public server.

## How this was built

Built in November 2026 with the help of Claude Code, an AI coding assistant,
directed by the team; AI tools are allowed for this project. The code is split
into five parts so each member owns, understands and presents one. The product
itself contains no AI.
