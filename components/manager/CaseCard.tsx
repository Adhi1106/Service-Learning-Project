"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui";
import { daysBetween, dayOf, formatDate } from "@/lib/dates";
import type { CaseRow } from "@/lib/queries";
import { CASE_STATUSES, CASE_STATUS_LABEL } from "@/lib/types";

/** One health case on the board, with a button to move it to the next column. */
export function CaseCard({ c, today }: { c: CaseRow; today: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState(c.notes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const next = CASE_STATUSES[CASE_STATUSES.indexOf(c.status) + 1];
  const resolved = c.status === "resolved";
  const daysOpen = daysBetween(dayOf(c.created_at), resolved ? dayOf(c.updated_at) : today);

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
    <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <div className="flex items-start gap-2.5">
        <Avatar name={c.student_name} size="sm" />
        <div className="min-w-0 flex-1">
          <Link href={`/manager/students/${c.student_id}`} className="block truncate text-sm font-semibold text-slate-900 hover:underline">
            {c.student_name}
          </Link>
          <p className="text-xs text-slate-500">{c.class_name}</p>
        </div>
        <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">{c.illness}</span>
      </div>
      <p className="mt-2.5 text-xs text-slate-500">
        Opened {formatDate(dayOf(c.created_at))} · {resolved ? `closed after ${daysOpen} days` : daysOpen === 0 ? "today" : `${daysOpen} days open`}
      </p>

      {resolved ? (
        c.notes && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{c.notes}</p>
      ) : (
        <>
          <label className="mt-3 block text-xs font-medium text-slate-500">
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== c.notes && update({ notes })}
              rows={3}
              placeholder="Doctor's advice, next visit..."
              className="mt-1 w-full resize-none rounded-md border border-slate-200 bg-slate-50/60 px-2 py-1.5 text-sm font-normal text-slate-800 outline-none focus:border-teal-600 focus:bg-white"
            />
          </label>
          {next && (
            <button
              disabled={busy}
              onClick={() => update({ status: next, notes })}
              className="mt-2 w-full rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-teal-800 disabled:opacity-60"
            >
              Move to {CASE_STATUS_LABEL[next]}
            </button>
          )}
        </>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
