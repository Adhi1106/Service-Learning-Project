"use client";

import { useState } from "react";

/** Puts the invented demo data back to its starting state. */
export function ResetButton() {
  const [busy, setBusy] = useState(false);

  async function reset() {
    if (!window.confirm("Reset all demo data to its starting state? Everything entered since will be removed.")) return;
    setBusy(true);
    await fetch("/api/admin/reset", { method: "POST" });
    window.location.reload();
  }

  return (
    <button onClick={reset} disabled={busy} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60">
      {busy ? "Resetting..." : "Reset demo data"}
    </button>
  );
}
