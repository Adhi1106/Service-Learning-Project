import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { RECORDS_DIR, importRecords } from "../db/import";
import { todayStr } from "./dates";

export type DB = Database.Database;

const SCHEMA_FILE = path.join(process.cwd(), "db", "schema.sql");
const DATA_DIR = path.join(process.cwd(), "data");
export const DB_FILE = path.join(DATA_DIR, "caretrack.db");

export function openDb(file: string): DB {
  const db = new Database(file);
  db.pragma("foreign_keys = ON");
  return db;
}

export function applySchema(db: DB): void {
  db.exec(fs.readFileSync(SCHEMA_FILE, "utf8"));
}

/** Wipes everything and reloads the home's records from data/records.
 *  Anyone who is logged in stays logged in, so a reset on the laptop does not
 *  throw the warden's phone back to the login screen. */
export function resetDb(db: DB, today: string = todayStr()): void {
  const hasSessions = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'sessions'").get();
  const sessions = hasSessions
    ? (db
        .prepare("SELECT s.token, s.expires_at, u.username FROM sessions s JOIN users u ON u.id = s.user_id")
        .all() as { token: string; expires_at: string; username: string }[])
    : [];

  db.pragma("foreign_keys = OFF");
  const objects = db
    .prepare("SELECT type, name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND type IN ('view', 'trigger', 'table')")
    .all() as { type: string; name: string }[];
  for (const type of ["view", "trigger", "table"]) {
    for (const o of objects.filter((x) => x.type === type)) {
      db.exec(`DROP ${type.toUpperCase()} IF EXISTS "${o.name}"`);
    }
  }
  db.pragma("foreign_keys = ON");
  applySchema(db);
  importRecords(db, RECORDS_DIR, today);

  // Put the logins back, matched by username (user ids may change).
  const restore = db.prepare(
    "INSERT INTO sessions (token, user_id, expires_at) SELECT ?, id, ? FROM users WHERE username = ?",
  );
  for (const s of sessions) restore.run(s.token, s.expires_at, s.username);
}

/** A fresh in-memory database with the schema only. Used by tests. */
export function createEmptyDb(): DB {
  const db = openDb(":memory:");
  applySchema(db);
  return db;
}

// One connection per server process. Kept on globalThis so that hot reloads
// in development do not open a new connection every time.
const g = globalThis as unknown as { __caretrackDb?: DB };

export function getDb(): DB {
  if (!g.__caretrackDb) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const db = openDb(DB_FILE);
    db.pragma("journal_mode = WAL");
    const hasTables = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'users'").get();
    if (!hasTables) {
      applySchema(db);
      importRecords(db, RECORDS_DIR, todayStr());
    }
    g.__caretrackDb = db;
  }
  return g.__caretrackDb;
}
