-- CareTrack database schema (SQLite).
-- Owner: D (Database: Schema, Security & Seed Data).
-- Eleven tables, one view, one trigger. The database itself refuses bad data:
--   * one attendance row per child per day
--   * an absence must have a reason; a present row must not
--   * stock balance can never go below zero
--   * the same alert cannot be open twice

CREATE TABLE users (
  id            INTEGER PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('manager', 'warden'))
);

CREATE TABLE sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE students (
  id           INTEGER PRIMARY KEY,
  admission_no TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  gender       TEXT NOT NULL CHECK (gender IN ('M', 'F')),
  dob         TEXT NOT NULL,
  class_name  TEXT NOT NULL,
  room        TEXT NOT NULL,
  school      TEXT NOT NULL,
  admitted_on TEXT NOT NULL
);

-- One health record per child, from the yearly check-up.
CREATE TABLE health_records (
  student_id   INTEGER PRIMARY KEY REFERENCES students(id),
  blood_group  TEXT NOT NULL,
  height_cm    REAL,
  weight_kg    REAL,
  last_checkup TEXT,
  status       TEXT NOT NULL CHECK (status IN ('healthy', 'minor', 'frequent', 'ongoing')),
  conditions   TEXT NOT NULL DEFAULT '',
  allergies    TEXT NOT NULL DEFAULT '',
  medication   TEXT NOT NULL DEFAULT '',
  remarks      TEXT NOT NULL DEFAULT ''
);

CREATE TABLE absence_reasons (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  is_medical INTEGER NOT NULL DEFAULT 0 CHECK (is_medical IN (0, 1))
);

CREATE TABLE illnesses (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE attendance (
  id         INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  date       TEXT NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  reason_id  INTEGER REFERENCES absence_reasons(id),
  illness_id INTEGER REFERENCES illnesses(id),
  entered_by INTEGER REFERENCES users(id),
  UNIQUE (student_id, date),
  CHECK ((status = 'present' AND reason_id IS NULL AND illness_id IS NULL)
      OR (status = 'absent'  AND reason_id IS NOT NULL))
);
CREATE INDEX attendance_by_date ON attendance(date);

CREATE TABLE inventory_items (
  id        INTEGER PRIMARY KEY,
  name      TEXT NOT NULL UNIQUE,
  category  TEXT NOT NULL CHECK (category IN ('Food', 'Medicine', 'Hygiene', 'Stationery')),
  unit      TEXT NOT NULL,
  min_level REAL NOT NULL CHECK (min_level >= 0),
  balance   REAL NOT NULL DEFAULT 0 CHECK (balance >= 0)
);

CREATE TABLE stock_transactions (
  id          INTEGER PRIMARY KEY,
  item_id     INTEGER NOT NULL REFERENCES inventory_items(id),
  type        TEXT NOT NULL CHECK (type IN ('in', 'out')),
  quantity    REAL NOT NULL CHECK (quantity > 0),
  date        TEXT NOT NULL,
  expiry_date TEXT,
  note        TEXT,
  entered_by  INTEGER REFERENCES users(id)
);
CREATE INDEX stock_by_item ON stock_transactions(item_id);

-- Keeps inventory_items.balance correct on every stock entry. If a stock-out
-- would take the balance below zero, the CHECK above fails and the whole
-- entry is rejected.
CREATE TRIGGER stock_apply AFTER INSERT ON stock_transactions
BEGIN
  UPDATE inventory_items
     SET balance = balance + CASE NEW.type WHEN 'in' THEN NEW.quantity ELSE -NEW.quantity END
   WHERE id = NEW.item_id;
END;

CREATE TABLE alerts (
  id           INTEGER PRIMARY KEY,
  rule         TEXT NOT NULL CHECK (rule IN ('repeated_illness', 'low_attendance', 'low_stock', 'expiring_stock')),
  severity     TEXT NOT NULL CHECK (severity IN ('critical', 'warning')),
  student_id   INTEGER REFERENCES students(id),
  item_id      INTEGER REFERENCES inventory_items(id),
  message      TEXT NOT NULL,
  dedupe_key   TEXT NOT NULL,
  trigger_date TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  created_at   TEXT NOT NULL,
  resolved_at  TEXT,
  CHECK ((student_id IS NOT NULL) <> (item_id IS NOT NULL))
);
-- The same alert cannot be active twice.
CREATE UNIQUE INDEX alerts_one_active ON alerts(dedupe_key) WHERE status <> 'resolved';

CREATE TABLE health_cases (
  id         INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  illness_id INTEGER NOT NULL REFERENCES illnesses(id),
  status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'scheduled', 'under_treatment', 'resolved')),
  notes      TEXT NOT NULL DEFAULT '',
  alert_id   INTEGER REFERENCES alerts(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Attendance percentage per child over the last 30 days (today included).
CREATE VIEW attendance_30d AS
SELECT s.id AS student_id,
       COUNT(a.id) AS days_recorded,
       COALESCE(SUM(a.status = 'present'), 0) AS days_present,
       CASE WHEN COUNT(a.id) = 0 THEN NULL
            ELSE ROUND(100.0 * SUM(a.status = 'present') / COUNT(a.id), 1) END AS pct
  FROM students s
  LEFT JOIN attendance a
         ON a.student_id = s.id
        AND a.date >= date('now', 'localtime', '-29 day')
        AND a.date <= date('now', 'localtime')
 GROUP BY s.id;
