"use client";

import { useState } from "react";

const DEMO = [
  { label: "Manager", username: "manager", password: "manager123" },
  { label: "Warden", username: "warden", password: "warden123" },
];

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function login(u: string, p: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not log in.");
        setBusy(false);
        return;
      }
      window.location.href = data.home;
    } catch {
      setError("Could not reach the server. Check the connection and try again.");
      setBusy(false);
    }
  }

  const field = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20";

  return (
    <>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          login(username, password);
        }}
      >
        <label className="block text-sm font-medium text-slate-700">
          Username
          <input className={field} value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" autoComplete="username" required />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input className={field} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        <button disabled={busy} className="w-full rounded-lg bg-teal-700 px-4 py-3 text-base font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
          {busy ? "Logging in..." : "Log in"}
        </button>
      </form>

      <div className="mt-8 border-t border-slate-200 pt-5">
        <p className="text-sm font-medium text-slate-700">Demo logins</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {DEMO.map((d) => (
            <button
              key={d.username}
              type="button"
              disabled={busy}
              onClick={() => login(d.username, d.password)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-left text-sm hover:border-teal-600 disabled:opacity-60"
            >
              <span className="block font-semibold text-slate-900">{d.label}</span>
              <span className="block text-xs text-slate-500">
                {d.username} / {d.password}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
