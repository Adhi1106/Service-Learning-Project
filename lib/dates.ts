// Dates are stored and passed around as "YYYY-MM-DD" strings in local time.

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

function parts(s: string): [number, number, number] {
  const [y, m, d] = s.split("-").map(Number);
  return [y, m, d];
}

export function addDays(s: string, n: number): string {
  const [y, m, d] = parts(s);
  return toDateStr(new Date(y, m - 1, d + n));
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  const [y1, m1, d1] = parts(from);
  const [y2, m2, d2] = parts(to);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

export function isSunday(s: string): boolean {
  const [y, m, d] = parts(s);
  return new Date(y, m - 1, d).getDay() === 0;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-15" -> "15 Nov 2026" */
export function formatDate(s: string): string {
  const [y, m, d] = parts(s.slice(0, 10));
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function isDateStr(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = parts(s);
  return toDateStr(new Date(y, m - 1, d)) === s;
}
