// Shared building blocks used by both the manager and the warden screens.
// Owner: F1 (Frontend: Manager Dashboard & Alerts).

import type { ReactNode } from "react";
import type { AlertStatus, CaseStatus, Severity } from "@/lib/types";
import { CASE_STATUS_LABEL } from "@/lib/types";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

export function PageTitle({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

type Tone = "red" | "amber" | "green" | "slate" | "blue";

const TONES: Record<Tone, string> = {
  red: "bg-red-50 text-red-800 ring-red-200",
  amber: "bg-amber-50 text-amber-900 ring-amber-200",
  green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  blue: "bg-sky-50 text-sky-800 ring-sky-200",
};

export function Badge({ tone = "slate", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return severity === "critical" ? <Badge tone="red">Critical</Badge> : <Badge tone="amber">Warning</Badge>;
}

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  if (status === "open") return <Badge tone="blue">Open</Badge>;
  if (status === "acknowledged") return <Badge tone="slate">Acknowledged</Badge>;
  return <Badge tone="green">Resolved</Badge>;
}

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const tone: Tone = status === "resolved" ? "green" : status === "open" ? "red" : "amber";
  return <Badge tone={tone}>{CASE_STATUS_LABEL[status]}</Badge>;
}

export function StatCard({
  label,
  value,
  detail,
  tone = "slate",
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  tone?: "slate" | "red" | "amber" | "green";
}) {
  const color = { slate: "text-slate-900", red: "text-red-700", amber: "text-amber-700", green: "text-emerald-700" }[tone];
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${color}`}>{value}</p>
      {detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}
    </Card>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">{children}</p>;
}

/** Formats a quantity without trailing zeros: 17, 2.5 */
export function qty(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}
