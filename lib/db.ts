import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { seed } from "../db/seed";
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

/** Wipes everything and rebuilds the schema and the invented seed data. */
export function resetDb(db: DB, today: string = todayStr()): void {
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
  seed(db, today);
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
      seed(db, todayStr());
    }
    g.__caretrackDb = db;
  }
  return g.__caretrackDb;
}
