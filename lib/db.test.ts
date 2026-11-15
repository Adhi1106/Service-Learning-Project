import { describe, expect, it } from "vitest";
import { createEmptyDb, resetDb } from "./db";
import { seed } from "../db/seed";

describe("resetDb", () => {
  it("puts the demo data back and keeps everyone logged in", () => {
    const db = createEmptyDb();
    seed(db, "2026-11-18");
    const insert = db.prepare("INSERT INTO sessions (token, user_id, expires_at) SELECT ?, id, ? FROM users WHERE username = ?");
    insert.run("manager-token", "2099-01-01T00:00:00.000Z", "anita");
    insert.run("warden-token", "2099-01-01T00:00:00.000Z", "manjunath");
    const before = db.prepare("SELECT COUNT(*) AS n FROM alerts").get();
    db.prepare("INSERT INTO stock_transactions (item_id, type, quantity, date) VALUES (1, 'out', 5, '2026-11-18')").run();

    resetDb(db, "2026-11-18");

    expect(db.prepare("SELECT balance FROM inventory_items WHERE id = 1").get()).toEqual({ balance: 53 });
    expect(db.prepare("SELECT COUNT(*) AS n FROM alerts").get()).toEqual(before);
    const sessions = db
      .prepare("SELECT s.token, u.username FROM sessions s JOIN users u ON u.id = s.user_id ORDER BY s.token")
      .all();
    expect(sessions).toEqual([
      { token: "manager-token", username: "anita" },
      { token: "warden-token", username: "manjunath" },
    ]);
  });
});
