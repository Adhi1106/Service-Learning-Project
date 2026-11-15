"use client";

import Link from "next/link";
import { useState } from "react";
import { IconSearch } from "@/components/icons";
import { Avatar, Card } from "@/components/ui";
import type { Student } from "@/lib/types";

type Row = Student & { pct: number | null };

/** The children list, with search and a class filter. */
export function StudentsTable({ students, classes, minPct }: { students: Row[]; classes: string[]; minPct: number }) {
  const [query, setQuery] = useState("");
  const [cls, setCls] = useState("All");
  const q = query.trim().toLowerCase();
  const shown = students.filter((s) => (cls === "All" || s.class_name === cls) && (!q || s.name.toLowerCase().includes(q)));

  const chip = (selected: boolean) =>
    `rounded-full px-3 py-1 text-sm font-medium ${selected ? "bg-teal-700 text-white" : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"}`;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <span className="sr-only">Search by name</span>
          <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {["All", ...classes].map((c) => (
            <button key={c} onClick={() => setCls(c)} className={chip(cls === c)} aria-pressed={cls === c}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs font-medium text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-3 py-3 font-medium">Class</th>
              <th className="px-3 py-3 font-medium">Dorm</th>
              <th className="px-5 py-3 font-medium">Attendance (30 days)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-5 py-2.5">
                  <Link href={`/manager/students/${s.id}`} className="flex items-center gap-3 font-medium text-slate-900 hover:text-teal-800">
                    <Avatar name={s.name} size="sm" />
                    {s.name}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-slate-600">{s.class_name}</td>
                <td className="px-3 py-2.5 text-slate-600">{s.room}</td>
                <td className="px-5 py-2.5">
                  {s.pct === null ? (
                    <span className="text-slate-400">No records</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${s.pct < minPct ? "bg-amber-500" : "bg-teal-500"}`} style={{ width: `${s.pct}%` }} />
                      </div>
                      <span className={`tabular-nums ${s.pct < minPct ? "font-medium text-amber-700" : "text-slate-700"}`}>{s.pct}%</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-500">No children match.</p>}
      </Card>
      <p className="mt-3 text-sm text-slate-500">
        Showing {shown.length} of {students.length} children
      </p>
    </>
  );
}
