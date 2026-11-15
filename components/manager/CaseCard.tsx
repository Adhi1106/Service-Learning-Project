"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDate } from "@/lib/dates";
import type { CaseRow } from "@/lib/queries";
import { CASE_STATUSES, CASE_STATUS_LABEL } from "@/lib/types";

/** One health case on the board, with a button to move it to the next column. */
export function CaseCard({ c }: { c: CaseRow }) {
  const router = useRouter();
  const [notes, setNotes] = useState(c.notes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const next = CASE_STATUSES[CASE_STATUSES.indexOf(c.status) + 1];

  async function update(change: { status?: string; notes?: string }) {
    // Only a status move disables the button. Saving notes (on leaving the
    // box) must not, or a click on "Move to..." straight after typing is lost.
    if (change.status) setBusy(true);
    setError("");
    const res = await fetch(`/api/cases/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(change),
    });
    if (!res.ok) setError((await res.json()).error ?? "Could not update.");
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <Link href={`/manager/students/${c.student_id}`} className="font-semibold text-slate-900 hover:underline">
        {c.student_name}
      </Link>
      <p className="text-sm text-slate-600">
        {c.illness} · {c.class_name}
      </p>
      <p className="mt-1 text-xs text-slate-500">Opened {formatDate(c.created_at)}</p>

      <label className="mt-3 block text-xs font-medium text-slate-600">
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== c.notes && update({ notes })}
          rows={2}
          placeholder="Doctor's advice, next visit..."
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm font-normal text-slate-900 outline-none focus:border-teal-600"
        />
      </label>

      {next && (
        <button
          disabled={busy}
          onClick={() => update({ status: next, notes })}
          className="mt-2 w-full rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          Move to {CASE_STATUS_LABEL[next]}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
