"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AlertStatus } from "@/lib/types";

/** Acknowledge and Resolve buttons for one alert. */
export function AlertActions({ id, status }: { id: number; status: AlertStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function setStatus(next: "acknowledged" | "resolved") {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) setError((await res.json()).error ?? "Could not update.");
    setBusy(false);
    router.refresh();
  }

  if (status === "resolved") return null;
  const button = "rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-60";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "open" && (
        <button disabled={busy} onClick={() => setStatus("acknowledged")} className={`${button} border border-slate-300 text-slate-700 hover:bg-slate-100`}>
          Acknowledge
        </button>
      )}
      <button disabled={busy} onClick={() => setStatus("resolved")} className={`${button} bg-teal-700 text-white hover:bg-teal-800`}>
        Resolve
      </button>
      {error && <span className="text-sm text-red-700">{error}</span>}
    </div>
  );
}
