# Roles: who owns what

Five people, five roles. Every person owns at least one complex piece **that
no one else builds**. "Owns" means: you design it, build it, test it, document
it in your worklog, write its chapter in the report, and present it in the demo.
It does not mean nobody else may touch it. It means nothing in it changes
without you knowing.

| Role | Title | Member | Worklog |
|---|---|---|---|
| [F1](#f1) | Frontend Engineer: Admin, Analytics & Visualisation | ______ | [worklogs/F1.md](worklogs/F1.md) |
| [F2](#f2) | Frontend Engineer: Mobile, Offline & Data Capture | ______ | [worklogs/F2.md](worklogs/F2.md) |
| [B1](#b1) | Backend Engineer: Core Platform & Resource Forecasting (ML) | ______ | [worklogs/B1.md](worklogs/B1.md) |
| [B2](#b2) | Backend Engineer: Intelligence Engine & Graph ML (GNN) | ______ | [worklogs/B2.md](worklogs/B2.md) |
| [D](#d) | Database & Data Engineer: PostgreSQL, Neo4j & Data Pipelines | ______ | [worklogs/D.md](worklogs/D.md) |

**In one line each**

- **F1** makes the manager able to *see and act*: dashboard, graph explorer, forecast planner, alerts, PDFs.
- **F2** makes the warden able to *enter data fast*: offline phone app, attendance, logs, bilingual.
- **B1** makes it *secure and connected*: login, permissions, core APIs, and the forecasting AI.
- **B2** makes it *intelligent*: rules engine, ML service, and the graph neural network.
- **D** makes it *stored, private and learnable*: both databases, security inside the database, pipelines, synthetic data.

---

## F1

**Frontend Engineer: Admin, Analytics & Visualisation.** The manager's laptop experience.

### Deliverables

- [ ] **Design system** for the whole team: tokens, 30+ components, dark mode, accessibility to WCAG 2.1 AA
- [ ] **Admin dashboard:** KPI cards; attendance trend and calendar heatmap; absence-reason and illness breakdowns; growth charts with healthy-range bands
- [ ] **Support Network Explorer:** interactive force-directed graph (Cytoscape.js / react-force-graph); clusters coloured; node size set by support score; filters by relationship type; a "why was this child flagged?" panel showing the neighbours and features that mattered
- [ ] **Forecast & Budget Planner:** forecast charts with confidence bands; runway gauges per item; anomaly markers on the expense timeline; what-if slider (e.g. +10 children); a model-comparison chart
- [ ] **Alert Centre** and drag-and-drop **health cases board** (Open → Scheduled → Under treatment → Resolved)
- [ ] **PDF reports** built as React components: Student Health Card, Doctor's Agenda, Monthly Trustee/Donor Report
- [ ] Per-module screens: navigation and search (students); heatmap and trend charts (attendance); cases board and growth charts (health); trend charts and achievements wall (academics); inventory dashboard

### Needs from others

| From | What | By |
|---|---|---|
| B1 | API contract; dashboard, health and forecast endpoints | Day 2 (contract), Days 3–7 (endpoints) |
| B2 | Alert shape and lifecycle; GNN scores and explanations | Day 2 (shape), Week 2 (scores) |
| D | Cypher queries for the graph explorer; attendance % and trend views | Week 2 |

### Gives to others

| To | What |
|---|---|
| F2 | The design system and shared components, usable from Day 3 |
| Whole team | Figma wireframes for agreement on Day 2 |

**Without F1:** the AI results and alerts exist but no one can see or act on them.

---

## F2

**Frontend Engineer: Mobile, Offline & Data Capture.** The warden's phone experience, and the source of all daily data.

### Deliverables

- [ ] **Progressive Web App:** installs on the warden's phone; **offline-first** for attendance, sick log and stock entry. Entries queue on the phone, sync when the connection returns, and conflicts are resolved
- [ ] **Bilingual English + Kannada** interface
- [ ] **Attendance in under 60 s per class:** everyone starts as present; tap only the absent ones, then pick a reason (and the illness for medical absences)
- [ ] **360° student profile**, scholarship pipeline, yearly check-up entry forms, marks and achievements entry
- [ ] **Peer & activity logging** (the data for the GNN): room assignments and mentor sessions; activity participation; caregiver-reported friendships (quick picker); incident reports (restricted)
- [ ] **Inventory, donation and expense entry**, with camera capture of bills
- [ ] **Usability testing with the real warden** (tasks timed before and after changes); Lighthouse ≥ 90 on a budget phone
- [ ] **Interview the warden at the trust** (Days 1–2) and write up the findings for the team

### Needs from others

| From | What | By |
|---|---|---|
| F1 | Design system and shared components | Day 3 |
| B1 | API contract; attendance, student, inventory endpoints; upload endpoint for bills | Day 2 (contract), Days 3–7 (endpoints) |
| D | Agreement on record IDs and timestamps so offline entries sync without duplicates | Day 2 |

### Gives to others

| To | What |
|---|---|
| B2, D | Peer/activity/incident data in the agreed shape (this is what the graph is built from) |
| B1 | Stock, donation and expense entries (this is what the forecasts are built from) |
| Whole team | Warden interview notes: what the warden actually does each day, on what phone, with what connectivity |

**Without F2:** no daily data gets into the system, so the databases and both AI models have nothing to learn from.

---

## B1

**Backend Engineer: Core Platform & Resource Forecasting (ML).** The secure core, plus the forecasting AI.

### Deliverables

- [ ] **Authentication and role-based authorisation:** every request is checked on the server; input validation (Zod); audit logging; secure uploads to private storage
- [ ] **Core APIs:** students, attendance and academics; the **health check-up workflow** (yearly schedule, monthly visit agenda, follow-ups); the inventory ledger with FEFO
- [ ] **API contract** published for F1 and F2 (Day 2) and kept up to date in [CONTRACTS.md](CONTRACTS.md)
- [ ] **AI Module: Resource Forecasting:** the model ladder (baselines → Prophet/SARIMA → gradient boosting → optional LSTM); donation forecasting with intervals; runway and stock-out logic and the procurement list; anomaly detection (Isolation Forest); scenario-planner API
- [ ] **Forecast evaluation:** time-based split, rolling backtests, MAPE/MAE/RMSE per category, interval coverage
- [ ] **CI pipeline and deployment**

### Needs from others

| From | What | By |
|---|---|---|
| D | PostgreSQL schema and migrations; weekly time-series tables; synthetic 2–3 year ledgers | Day 2 (schema), Days 3–7 (synthetic data), Week 2 (time series) |
| B2 | The ML service to host the forecasting models; how runway alerts enter the rules engine | Week 2 |
| F2 | The fields each entry screen sends | Day 2 |

### Gives to others

| To | What |
|---|---|
| F1, F2 | Every web endpoint they call, with stable shapes |
| B2 | Stock-out risk and spending-anomaly signals for the rules engine; secure API access for the GNN results |
| Whole team | CI that runs on every pull request; the deployed environments |

**Without B1:** there is no secure access, no core APIs and no resource forecasting.

---

## B2

**Backend Engineer: Intelligence Engine & Graph ML (GNN).** Everything that finds a pattern.

### Deliverables

- [ ] **Early-warning rules engine** (all nine rules in [PROJECT_OVERVIEW.md §7](PROJECT_OVERVIEW.md#7-early-warning-rules-b2)): ranks alerts by severity, prevents duplicates, manages each alert's lifecycle, runs daily and after each entry
- [ ] **Python ML service (FastAPI):** hosts both AI models; scores everything in a nightly batch and writes the results back to PostgreSQL; keeps versioned models
- [ ] **AI Module: Support Network GNN:** NetworkX baselines (degree, betweenness); GraphSAGE/GAT in PyTorch Geometric; link prediction for mentor and roommate pairs; Louvain communities plus incident concentration; an explanation of each flag for human review
- [ ] **GNN evaluation:** feature-only baseline vs GNN; precision/recall against caregiver labels; edge-type ablation
- [ ] **Unit tests for every rule**

### Needs from others

| From | What | By |
|---|---|---|
| D | Neo4j schema; synthetic graph with planted patterns and labels; node-feature pipeline; `alerts` and `support_scores` tables | Day 2 (schema, first synthetic graph), Week 2 (features) |
| B1 | Forecasting models packaged to run inside the ML service; auth for service-to-service calls | Week 2 |
| F2 | Peer, activity and incident logs in the agreed shape | Week 2 |

### Gives to others

| To | What |
|---|---|
| F1 | Alerts (shape, severity, lifecycle) for the Alert Centre; support scores, clusters and per-flag explanations for the graph explorer |
| B1 | A place to deploy and schedule the forecasting models |
| Whole team | Rule specifications (Day 2) so everyone knows what triggers what |

**Without B2:** CareTrack is only a record-keeping app. It never finds a pattern or flags a child.

---

## D

**Database & Data Engineer: PostgreSQL, Neo4j & Data Pipelines.** The foundation every module stands on.

### Deliverables

- [ ] **PostgreSQL design:** about 28 tables normalised to 3NF; keys and constraints (one attendance record per child per day; stock can never go negative); indexes; migrations
- [ ] **Row Level Security:** privacy rules enforced *inside* the database, so even an app bug cannot leak medical, relationship or financial data
- [ ] **Triggers:** automatic audit entries, stock balance updates, BMI calculation
- [ ] **Neo4j graph database:** node and relationship schema; edge weights computed from frequency × recency decay; **sync pipeline from PostgreSQL to Neo4j**; Cypher queries for the graph explorer
- [ ] **Feature pipelines:** node features for the GNN; weekly time-series tables for forecasting
- [ ] **Synthetic data generators (documented):** stochastic block model graph with planted isolated children and bullying clusters, plus labels; 2–3 years of consumption, donation and expense data with seasonality, festival spikes, noise and planted anomalies; attendance and health data with planted illness patterns
- [ ] **Backups, retention policy, pseudonymised IDs for ML training** (DPDP Act 2023)
- [ ] Per-module tables and views: attendance % views; health tables and triggers; academic trend views; stock ledger and triggers

### Needs from others

| From | What | By |
|---|---|---|
| B1 | Which queries the APIs need to be fast | Days 3–7 |
| B2 | Which node features and edge types the GNN needs; what the rules read | Day 2 |
| F2 | The fields captured on each entry screen | Day 2 |

### Gives to others

| To | What |
|---|---|
| Everyone | The schema (ER diagram on Day 2), migrations, and seeded synthetic data to develop against |
| B1 | Time-series tables and synthetic ledgers |
| B2 | The graph, node features, labels |
| F1 | Views for charts; Cypher queries for the explorer |

**Without D:** there is no data to store, no graph to learn from, and no privacy enforced by the database.

---

## Module × role matrix

Every module needs all five. Read across a row to see who to talk to.

| Module | D | B1 | B2 | F1 | F2 |
|---|---|---|---|---|---|
| Students & scholarships | Tables, security rules | APIs, uploads | Scholarship deadline rule | Navigation, search | Profile, scholarship screens |
| Attendance | Table, attendance % views | APIs | Absence rules | Heatmap, trend charts | Offline mobile flow |
| Health | Health tables, triggers | Check-up workflow | Illness, growth and check-up rules | Cases board, growth charts | Check-up forms |
| Academics & achievements | Tables, trend views | APIs | Falling-marks rule | Trend charts, achievements wall | Marks entry |
| Inventory, donations & expenses | Stock ledger, triggers | Ledger, FEFO | Low-stock and expiry rules | Inventory dashboard | Stock and bill entry |
| **AI: Support Network** | Neo4j, graph features, synthetic graph | Secure API access | **GNN models + evaluation** | **Graph explorer** | Peer/activity logging |
| **AI: Forecasting** | Time series, synthetic ledgers | **Forecast models + evaluation** | Runway alerts into the engine | **Forecast & what-if planner** | Donation and expense entry |

## Shared responsibilities (all five)

These belong to everyone, and nobody may leave them to "someone else":

- Keep your worklog current ([TEAM_RULES.md](../TEAM_RULES.md), rule 3).
- Review pull requests from another layer within one working day.
- Write your chapter of the project report and present your part in the demo.
- Take part in real (non-ML) data entry at the trust, the demo rehearsal, and the training session for the warden and manager.
- Protect the children's data.

## Team coordinator (to be assigned)

The proposal does not name a team lead. We recommend choosing one **coordinator**
on Day 1. This is a coordination duty on top of a role, not a sixth role and
not a boss:

- runs the daily check-in and the end-of-phase integration check
- keeps [EXECUTION_PLAN.md](EXECUTION_PLAN.md) and [DECISIONS.md](DECISIONS.md) current
- is the single contact with the trust and the faculty guide
- breaks a tie when a decision is stuck (see [TEAM_RULES.md](../TEAM_RULES.md), rule 9)

Coordinator: ______
