# Project overview: what CareTrack is

This is the plain-language explanation of the project. It restates the
[proposal](proposal/CareTrack_Project_Proposal.pdf) so that anyone on the team
can explain the whole system, not only their own part. Where this file and the
proposal disagree, the proposal wins until a change is recorded in
[DECISIONS.md](DECISIONS.md).

## 1. Who it is for

**Grace and Light Trust** runs a children's home in Hoskote, Karnataka. The
children live at the home and attend nearby schools.

| User | Device | What they do in CareTrack | What they cannot see |
|---|---|---|---|
| **Manager (Admin)** | Laptop | Everything: dashboard, alerts, health, support network, forecasts, finance, reports | Nothing is hidden |
| **Warden / Caregiver** | Mobile phone | Daily attendance, sick log, peer and activity logs, stock usage | The support-network graph, finances, full medical history |

## 2. The problems we are solving

1. **School attendance.** Staff cannot see which children miss school, how often, or why.
2. **Health.** Repeated illness goes unnoticed, and yearly check-ups are not compared year to year. A child who misses school three times a month for asthma needs a doctor, but nobody connects the events.
3. **Social wellbeing.** With dozens of children, caregivers cannot see who is isolated, who may be bullied, or which mentor bonds are weak.
4. **Resources.** Donations arrive in bursts while needs are steady or seasonal, so stock runs out, cash runs short, medicines expire, and donors get no clear financial picture.
5. **Scattered records.** Academics, scholarships and achievements live in different places.

## 3. What the system does (objectives)

1. Record daily attendance with the **reason** for every absence.
2. **Automatically detect warning patterns** (repeated illness, low attendance, falling marks, low stock) and alert the manager.
3. Digitise health care: a **yearly check-up** for every child, a **monthly doctor visit** for flagged children, follow-ups tracked until resolved.
4. Map the children's **support network as a graph** and use a **Graph Neural Network** to surface children who may need support. A human reviews every signal.
5. **Forecast consumption, donations and budget runway** to plan ahead for stock-outs and cash shortages.
6. Keep **one complete profile per child**: health, academics, scholarships, achievements.
7. **Protect** the children's personal, medical and relationship data.

## 4. The seven modules

| # | Module | Purpose |
|---|---|---|
| 1 | Student Records, Scholarships & Peer Logs | One profile per child; guardian consent; scholarship tracker; room, mentor, activity and friendship logs |
| 2 | Attendance & Absence Reasons | Daily attendance on a phone, with reasons and the illness for medical absences |
| 3 | Health & Medical Care | Yearly check-up, monthly doctor visit, vaccinations, growth charts, health cases board |
| 4 | Academics & Achievements | Marks by term, trend graphs, extracurricular achievements |
| 5 | Inventory, Donations & Expenses | Groceries, stationery, medicines, hygiene items, uniforms: stock in/out, first-expiry-first-out (FEFO), donor log, expenses |
| 6 | **AI: Support Network Intelligence (GNN)** | Finds isolated children, recommends mentor and roommate pairings, flags clusters with many negative incidents |
| 7 | **AI: Predictive Resource & Budget Forecasting** | Forecasts demand and donations, warns of runway and stock-outs, detects anomalies, plans scenarios |

## 5. How the pieces fit together

```
        MANAGER (laptop, full access)        WARDEN (phone, daily entry)
                      |                                 |
        LOGIN + ROLE-BASED ACCESS + AUDIT LOG + CHILD DATA PRIVACY   (B1, D)
                      |
   +---------+-----------+---------+-----------+------------+
   | Student | Attendance| Health  | Academics | Inventory, |
   | records | & reasons | & care  | & achieve.| donations  |
   | (F2,B1) | (F2,B1)   |(F1,F2,B1)| (F2,B1)  | (F2,B1)    |
   +---------+-----------+---------+-----------+------------+
                      |
        +-------------+--------------+
        |                            |
  EARLY-WARNING RULES ENGINE    AI / ML SERVICE (Python, FastAPI)
  (B2)                          - Support network GNN      (B2)
                                - Resource forecasting     (B1)
        +-------------+--------------+
                      |
                 ALERT CENTRE (F1, B2)
                      |
   +------------------+-------------------+
   | Health check-ups | Support plans     | Procurement & budget |
   | (F2, B1)         | (F1, B2)          | (F1, B1)             |
   +------------------+-------------------+
                      |
        ADMIN DASHBOARD & REPORTS (F1)
        KPIs, alerts, trends, graph explorer, forecast planner, PDFs

  ===================================================================
  PostgreSQL (Supabase): records, stock, donations, expenses
  Neo4j graph DB: children, caregivers, mentors, relationships
  Security rules, triggers, data pipelines, synthetic data        (D)
  ===================================================================
```

### Three flows to remember

These are the stories we demo. If these three work end to end, the project works.

1. **Health.** A child is marked absent for asthma for the 3rd time → critical alert → child added to the monthly doctor visit → findings recorded → follow-up until resolved → history compared at the yearly check-up.
2. **Social.** Peer, room and activity logs → graph in Neo4j → the GNN gives a child a low support score → "support-needed" signal → the manager reviews it → the system suggests a mentor pairing.
3. **Resources.** Daily stock use and donations → forecast shows "rice lasts 9 days, next confirmed donation in 20 days" → procurement list and budget runway on the dashboard.

## 6. The two AI modules

### 6.1 Support network (GNN), owned by B2

- **Graph (Neo4j).** Nodes: children, caregivers, teachers, mentors, volunteers. Node features: age, school grade, attendance rate, health flags, activity participation, tenure at the home. Typed, weighted edges: shares room, sibling, same class, mentor-of, caregiver-assigned, peer interaction. Edge weight reflects how often and how recently the interaction happened.
- **What it does.**
  1. *Isolation detection:* baseline from centrality (degree, betweenness), then a richer score from GNN embeddings.
  2. *Link prediction:* recommends mentor-child and roommate pairings.
  3. *Community detection:* Louvain clusters; clusters with many negative incident reports are flagged as possible bullying groups.
  4. *Node classification:* predicts "needs support" with GraphSAGE or GAT.
- **Evaluation.** Feature-only model vs GNN (the gain from graph structure); precision and recall against caregiver labels; ablation removing one edge type at a time.
- **Safeguards.** Real data is small, so a synthetic graph (stochastic block model with planted isolated children and bullying clusters) is used and clearly stated. Outputs are "support-needed" signals reviewed by a human. Only the manager sees interaction data, and every access is logged.

### 6.2 Resource and budget forecasting, owned by B1

- **Data streams.** Daily food use and inventory; medicine use and expiry; donations (cash and in-kind, with donor type); expenses by category; headcount.
- **What it does.** Demand forecasting per item per week (with seasonality: June school reopening, festivals, monsoon illness); donation forecasting given as a **range**, not a single number; runway and stock-out alerts with an automatic procurement list; anomaly detection (Isolation Forest, residual z-scores); a what-if scenario planner; FEFO for medicines and food.
- **Model ladder.** Each model must beat the one below it: (1) moving average and seasonal naive, (2) SARIMA or Prophet, (3) gradient boosting with calendar and headcount features, (4) optional LSTM, reported honestly if it loses.
- **Evaluation.** Time-based split (never random); MAPE, MAE and RMSE per category; rolling-window backtests; how often the actual value falls inside the forecast range.
- **Safeguards.** The trust's ledgers are used where available and topped up by a documented synthetic generator. Forecasts use weekly or monthly buckets because one-off gifts are noisy.

## 7. Early-warning rules (B2)

| Rule | Fires when | Action |
|---|---|---|
| Repeated medical absence | ≥3 absences for the same illness in 30 days | Critical → health case + monthly doctor visit |
| Low attendance | < 85% over 30 days, or 3+ absences in a row | Warning |
| Falling marks | Term average drops ≥10% | Warning |
| Growth concern | BMI below the healthy range, or >5% weight loss | Critical → health case |
| Check-up / vaccine overdue | More than 12 months since the last check-up, or a vaccine past its due date | Warning |
| Scholarship deadline | Due within 14 days | Info |
| Stock-out risk *(from forecasting)* | Runway < 7 days, or expiry < 30 days | Warning → procurement list |
| Spending anomaly *(from forecasting)* | Anomaly score above the threshold | Warning → manager review |
| Support-needed *(from GNN)* | High-risk score or isolation flag | Info → human review → support plan |

## 8. Technology stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React) + TypeScript, Tailwind CSS + shadcn/ui, Recharts, Cytoscape.js / react-force-graph, PWA + IndexedDB (offline), English/Kannada |
| Backend (web) | Next.js server APIs, Zod validation, scheduled jobs (Vercel Cron) |
| Backend (AI) | Python, FastAPI, PyTorch Geometric, NetworkX, scikit-learn, Prophet, statsmodels (SARIMA), LightGBM |
| Databases | PostgreSQL (Supabase) with Row Level Security; Neo4j AuraDB (graph) |
| Testing | Vitest, Pytest, Playwright, Lighthouse |
| Hosting | Vercel + Supabase + Neo4j AuraDB free tiers; ML service on a free container host (Render). No cost to the trust |
| Teamwork | GitHub branches, cross-layer pull-request reviews, CI |

## 9. Data design

**PostgreSQL (about 28 tables, 3NF):** students · guardians/consent · attendance ·
conditions · medical_profile · sick_logs · vaccinations · growth_measurements ·
annual_checkups · health_cases · doctor_visits · terms · marks · achievements ·
scholarships · student_scholarships · inventory_items · stock_transactions ·
donations · expenses · peer_interactions · incidents · room_assignments ·
mentorships · alerts · support_scores · forecasts · audit_log

**Neo4j:** `(:Child)`, `(:Caregiver)`, `(:Teacher)`, `(:Mentor)`, `(:Volunteer)`
linked by `SHARES_ROOM`, `SIBLING_OF`, `SAME_CLASS`, `MENTOR_OF`, `ASSIGNED_TO`,
`INTERACTS_WITH {weight, last_seen}`

## 10. Privacy and ethics

- **No real children's data** is used in college demos or stored in the code repository. Demos use documented synthetic data, and this is stated clearly.
- AI outputs are **support signals, never labels**. A human always reviews them before anything happens, and each one comes with an explanation. No child is ever labelled "problematic".
- Relationship, incident and medical data are visible only to the manager. Access is enforced by the database and logged.
- ML training uses **pseudonymised IDs**. Data is collected and kept according to the trust's consent and the **DPDP Act 2023**.

## 11. How we will know it works

**Software**

1. Unit tests for every rule; planted patterns must trigger the right alerts.
2. Security test: the warden is blocked from medical, graph and finance data at both the screen and the database level.
3. Offline test in airplane mode, then sync.
4. Usability test: the warden completes a class's attendance in under 60 seconds.
5. End-to-end test: absence → alert → doctor visit → resolved → report.

**AI**

- GNN: gain over the feature-only baseline; precision/recall against caregiver labels; edge-type ablation table.
- Forecasting: time-based split; MAPE/MAE/RMSE per category; rolling backtest; interval coverage; model-ladder comparison table.

## 12. What we hand over (deliverables)

1. Deployed web app + mobile PWA used by the trust.
2. Python ML service with trained models, notebooks and evaluation reports.
3. Source code on GitHub with a README, an admin guide and documentation for the synthetic data.
4. Project report (one chapter per role) and a live demo (each member presents their part).
5. Training session for the trust's warden and manager.

## 13. Expected impact

- Children with repeated illness get timely care, and every child is reviewed at least once a year.
- Isolated or struggling children are noticed earlier and matched with mentors.
- Fewer stock-outs, cash shortages and expired medicines.
- Donors see clear, transparent reports.
- The trust gets a free, working system with training and a user guide.
