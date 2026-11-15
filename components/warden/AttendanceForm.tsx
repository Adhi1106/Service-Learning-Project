"use client";

// The warden's attendance screen. Owner: F2 (Frontend: Warden Mobile Screens).
//
// Designed for speed on a phone: everyone starts as present, so the warden
// only taps the children who are absent, picks a reason, and saves.

import { useState } from "react";
import { formatDate } from "@/lib/dates";
import type { AbsenceReason, Illness } from "@/lib/types";

type Row = {
  studentId: number;
  name: string;
  room: string;
  absent: boolean;
  reasonId: number | null;
  illnessId: number | null;
};

type SavedRow = { student_id: number; name: string; room: string; status: string | null; reason_id: number | null; illness_id: number | null };

type Props = {
  classes: string[];
  reasons: AbsenceReason[];
  illnesses: Illness[];
  today: string;
  initialClass: string;
  initialRows: SavedRow[];
};

const toRows = (saved: SavedRow[]): Row[] =>
  saved.map((r) => ({
    studentId: r.student_id,
    name: r.name,
    room: r.room,
    absent: r.status === "absent",
    reasonId: r.reason_id,
    illnessId: r.illness_id,
  }));

export function AttendanceForm({ classes, reasons, illnesses, today, initialClass, initialRows }: Props) {
  const [className, setClassName] = useState(initialClass);
  const [rows, setRows] = useState<Row[]>(() => toRows(initialRows));
  const [alreadySaved, setAlreadySaved] = useState(() => initialRows.some((r) => r.status !== null));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [showProblems, setShowProblems] = useState(false);

  async function selectClass(cls: string) {
    if (cls === className) return;
    setClassName(cls);
    setLoading(true);
    setMessage(null);
    setShowProblems(false);
    try {
      const res = await fetch(`/api/attendance?class=${encodeURIComponent(cls)}&date=${today}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAlreadySaved(data.alreadySaved);
      setRows(toRows(data.rows));
    } catch (err) {
      setRows([]);
      setMessage({ kind: "error", text: err instanceof Error && err.message ? err.message : "Could not load the class. Check the connection." });
    }
    setLoading(false);
  }

  function change(studentId: number, patch: Partial<Row>) {
    setMessage(null);
    setRows((all) => all.map((r) => (r.studentId === studentId ? { ...r, ...patch } : r)));
  }

  const isMedical = (reasonId: number | null) => reasons.some((r) => r.id === reasonId && r.is_medical);
  const incomplete = (r: Row) => r.absent && (r.reasonId === null || (isMedical(r.reasonId) && r.illnessId === null));
  const absentCount = rows.filter((r) => r.absent).length;
  const problems = rows.filter(incomplete);

  async function save() {
    if (problems.length > 0) {
      setShowProblems(true);
      setMessage({ kind: "error", text: `Choose a reason for ${problems.map((p) => p.name).join(", ")}.` });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          class: className,
          entries: rows.map((r) => ({
            studentId: r.studentId,
            status: r.absent ? "absent" : "present",
            reasonId: r.absent ? r.reasonId : null,
            illnessId: r.absent && isMedical(r.reasonId) ? r.illnessId : null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAlreadySaved(true);
      setMessage({ kind: "ok", text: `Saved: ${data.present} present, ${data.absent} absent.` });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error && err.message ? err.message : "Could not save. Check the connection and try again." });
    }
    setSaving(false);
  }

  const chip = (selected: boolean) =>
    `rounded-full border px-3.5 py-2 text-sm font-medium ${selected ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 bg-white text-slate-700"}`;

  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900">Attendance</h1>
      <p className="text-sm text-slate-600">{formatDate(today)} · Tap a child who is absent.</p>

      <div className="mt-4 flex gap-2" role="tablist" aria-label="Class">
        {classes.map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={c === className}
            onClick={() => selectClass(c)}
            className={`flex-1 rounded-lg border px-3 py-2.5 text-base font-semibold ${
              c === className ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 bg-white text-slate-700"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {alreadySaved && !loading && (
        <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
          Already saved for today. You can change it and save again.
        </p>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Loading...</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((r) => (
            <li
              key={r.studentId}
              className={`rounded-xl border bg-white ${
                r.absent ? (showProblems && incomplete(r) ? "border-red-400" : "border-amber-300") : "border-slate-200"
              }`}
            >
              <button
                onClick={() => change(r.studentId, r.absent ? { absent: false, reasonId: null, illnessId: null } : { absent: true })}
                aria-pressed={r.absent}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
              >
                <span>
                  <span className="block text-base font-medium text-slate-900">{r.name}</span>
                  <span className="block text-xs text-slate-500">{r.room}</span>
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    r.absent ? "bg-amber-100 text-amber-900" : "bg-emerald-50 text-emerald-800"
                  }`}
                >
                  {r.absent ? "Absent" : "Present"}
                </span>
              </button>

              {r.absent && (
                <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Reason</p>
                  <div className="flex flex-wrap gap-2">
                    {reasons.map((reason) => (
                      <button
                        key={reason.id}
                        aria-pressed={r.reasonId === reason.id}
                        onClick={() => change(r.studentId, { reasonId: reason.id, illnessId: null })}
                        className={chip(r.reasonId === reason.id)}
                      >
                        {reason.name}
                      </button>
                    ))}
                  </div>
                  {isMedical(r.reasonId) && (
                    <>
                      <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Illness</p>
                      <div className="flex flex-wrap gap-2">
                        {illnesses.map((illness) => (
                          <button
                            key={illness.id}
                            aria-pressed={r.illnessId === illness.id}
                            onClick={() => change(r.studentId, { illnessId: illness.id })}
                            className={chip(r.illnessId === illness.id)}
                          >
                            {illness.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Save bar, fixed above the bottom tabs so it is always in reach. */}
      <div className="fixed inset-x-0 bottom-[52px] z-10 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-lg">
          {message && (
            <p role={message.kind === "error" ? "alert" : "status"} className={`mb-2 rounded-lg px-3 py-2 text-sm ${message.kind === "ok" ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800"}`}>
              {message.text}
            </p>
          )}
          <div className="flex items-center gap-3">
            <p className="flex-1 text-sm text-slate-700">
              <span className="font-semibold tabular-nums">{rows.length - absentCount}</span> present ·{" "}
              <span className="font-semibold tabular-nums">{absentCount}</span> absent
            </p>
            <button
              onClick={save}
              disabled={saving || loading || rows.length === 0}
              className="rounded-lg bg-teal-700 px-6 py-3 text-base font-semibold text-white active:bg-teal-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
      <div className="h-28" aria-hidden />
    </>
  );
}
