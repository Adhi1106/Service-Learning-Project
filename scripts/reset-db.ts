// Wipes the database and reloads it from the records in data/records.
// Run with: npm run db:reset
import fs from "node:fs";
import path from "node:path";
import { DB_FILE, openDb, resetDb } from "../lib/db";

fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
const db = openDb(DB_FILE);
resetDb(db);
const count = (table: string) => (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
console.log(
  `Database reset: ${count("students")} students, ${count("attendance")} attendance rows, ` +
    `${count("inventory_items")} items, ${count("alerts")} alerts.`,
);
db.close();
