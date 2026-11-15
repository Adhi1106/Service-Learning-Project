"use client";

import { useState } from "react";

const DEMO = [
  { label: "Manager", name: "Anita D'Souza", username: "anita", password: "manager123" },
  { label: "Warden", name: "Manjunath Gowda", username: "manjunath", password: "warden123" },
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
        setError(data.error ?? "Could not sign in.");
        setBusy(false);
        return;
      }
      window.location.href = data.home;
    } catch {
      setError("Could not reach the server. Check the connection and try again.");
      setBusy(false);
    }
  }

  const field =
    "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10";

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
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button disabled={busy} className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-base font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-60">
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-10">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Demo accounts</p>
        <div className="mt-3 space-y-2">
          {DEMO.map((d) => (
            <button
              key={d.username}
              type="button"
              disabled={busy}
              onClick={() => login(d.username, d.password)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm transition hover:border-teal-600 hover:bg-teal-50/40 disabled:opacity-60"
            >
              <span>
                <span className="block font-medium text-slate-900">{d.name}</span>
                <span className="block text-xs text-slate-500">
                  {d.label} · {d.username} / {d.password}
                </span>
              </span>
              <span className="text-xs font-medium text-teal-700">Sign in</span>
            </button>
          ))}
        </div>
        <p className="mt-6 text-xs leading-relaxed text-slate-400">
          Demonstration version. The children, staff and records shown are invented; no real personal data is stored.
        </p>
      </div>
    </>
  );
}
