"use client";

import { useState } from "react";
import { IconRefresh } from "../icons";

/** Puts the demo data back to its starting state. Logins are kept. */
export function ResetButton() {
  const [busy, setBusy] = useState(false);

  async function reset() {
    if (!window.confirm("Reset all demo data to its starting state? Everything entered since will be removed.")) return;
    setBusy(true);
    await fetch("/api/admin/reset", { method: "POST" });
    window.location.reload();
  }

  return (
    <button
      onClick={reset}
      disabled={busy}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60"
    >
      <IconRefresh size={14} />
      {busy ? "Resetting..." : "Reset demo data"}
    </button>
  );
}
