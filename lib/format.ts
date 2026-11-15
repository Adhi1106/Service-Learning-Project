// Small formatting helpers shared by the rules, the seed data and the screens.

/** 17 -> "17", 2.5 -> "2.5" */
export function qty(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

const NO_PLURAL = new Set(["kg", "L", "pcs", "g", "ml"]);

/** A quantity with its unit: "17 kg", "1 bottle", "9 bottles", "2 boxes". */
export function amount(n: number, unit: string): string {
  if (unit === "pcs" && n === 1) return "1 pc";
  if (NO_PLURAL.has(unit) || n === 1) return `${qty(n)} ${unit}`;
  return `${qty(n)} ${unit.endsWith("x") ? `${unit}es` : `${unit}s`}`;
}

/** Drops a leading "Subject: " from a message that is shown under the subject. */
export function withoutSubject(message: string, subject: string | null): string {
  return subject && message.startsWith(`${subject}: `) ? message.slice(subject.length + 2).replace(/^./, (c) => c.toUpperCase()) : message;
}

/** "Shivakumar N" -> "SN" */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
