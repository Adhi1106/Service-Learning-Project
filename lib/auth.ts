// Login sessions and role checks.
// Owner: B1 (Backend: Login, Permissions & APIs).
//
// A successful login creates a random session token, stores it in the
// `sessions` table and sends it to the browser in an http-only cookie.
// Every page and every API route calls one of the helpers below, so the
// role check always happens on the server and never only in the browser.

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import { verifyPassword } from "./password";
import type { Role, User } from "./types";

const COOKIE = "caretrack_session";
const SESSION_HOURS = 12;

export function homeFor(role: Role): string {
  return role === "manager" ? "/manager" : "/warden";
}

/** Checks a username and password. Returns the user, or null. */
export function checkLogin(username: string, password: string): User | null {
  const row = getDb()
    .prepare("SELECT id, username, name, role, password_hash FROM users WHERE username = ?")
    .get(username.trim().toLowerCase()) as (User & { password_hash: string }) | undefined;
  if (!row || !verifyPassword(password, row.password_hash)) return null;
  return { id: row.id, username: row.username, name: row.name, role: row.role };
}

export async function startSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_HOURS * 3600_000);
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(new Date().toISOString());
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expires.toISOString());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
    // The app runs over plain http on the home's local network, so the cookie is not
    // marked "secure". Behind https in production this must be set to true.
    secure: false,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  store.delete(COOKIE);
}

/** The logged-in user, or null. */
export async function getUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.username, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token = ? AND s.expires_at > ?`,
    )
    .get(token, new Date().toISOString()) as User | undefined;
  return row ?? null;
}

/** For pages: sends the visitor away unless they are logged in with this role. */
export async function requireRole(role: Role): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect(homeFor(user.role));
  return user;
}

/** For API routes: returns the user, or the error response to send back. */
export async function apiUser(...allowed: Role[]): Promise<{ user: User } | { error: Response }> {
  const user = await getUser();
  if (!user) return { error: Response.json({ error: "Please log in." }, { status: 401 }) };
  if (!allowed.includes(user.role)) {
    return { error: Response.json({ error: "You do not have access to this." }, { status: 403 }) };
  }
  return { user };
}
