// Shared building blocks used by both the manager and the warden screens.
// Owner: F1 (Frontend: Manager Dashboard & Alerts).

import type { ReactNode } from "react";
import { initials } from "@/lib/format";
import type { AlertStatus, CaseStatus, Severity } from "@/lib/types";
import { CASE_STATUS_LABEL } from "@/lib/types";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>{children}</div>;
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const AVATAR_COLOURS = [
  "bg-teal-100 text-teal-800",
  "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-violet-100 text-violet-800",
  "bg-emerald-100 text-emerald-800",
  "bg-orange-100 text-orange-800",
  "bg-indigo-100 text-indigo-800",
];

/** Initials in a coloured circle. The colour is fixed for each name. */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" | "xl" }) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const colour = AVATAR_COLOURS[hash % AVATAR_COLOURS.length];
  const box = { sm: "h-7 w-7 text-[11px]", md: "h-9 w-9 text-xs", lg: "h-11 w-11 text-sm", xl: "h-16 w-16 text-xl" }[size];
  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${box} ${colour}`}>
      {initials(name)}
    </span>
  );
}

export function PageTitle({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
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
  icon,
  children,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "slate" | "red" | "amber" | "green" | "teal";
  icon?: ReactNode;
  children?: ReactNode;
}) {
  const chip = {
    slate: "bg-slate-100 text-slate-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-emerald-50 text-emerald-600",
    teal: "bg-teal-50 text-teal-700",
  }[tone];
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${chip}`}>{icon}</span>}
      </div>
      <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">{value}</p>
      {detail && <p className="mt-2 text-sm text-slate-500">{detail}</p>}
      {children}
    </Card>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-10 text-center text-sm text-slate-500">{children}</p>;
}

export { amount, qty } from "@/lib/format";
