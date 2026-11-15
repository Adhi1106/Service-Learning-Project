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

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "2026-11-15" -> "Sunday, 15 November 2026" */
export function formatLongDate(s: string): string {
  const [y, m, d] = parts(s);
  const date = new Date(y, m - 1, d);
  const month = date.toLocaleString("en-IN", { month: "long" });
  return `${WEEKDAYS[date.getDay()]}, ${d} ${month} ${y}`;
}

/** The local date of a stored value: a plain date, or an ISO timestamp. */
export function dayOf(value: string): string {
  return value.length === 10 ? value : toDateStr(new Date(value));
}

/** "Today", "Yesterday", "3 days ago", or the date. */
export function relativeDay(value: string, today: string): string {
  const days = daysBetween(dayOf(value), today);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 7) return `${days} days ago`;
  return formatDate(dayOf(value));
}

/** Second Saturday of the month: a school holiday in Karnataka. */
export function isSecondSaturday(s: string): boolean {
  const [y, m, d] = parts(s);
  return new Date(y, m - 1, d).getDay() === 6 && d >= 8 && d <= 14;
}

export function isSchoolDay(s: string): boolean {
  return !isSunday(s) && !isSecondSaturday(s);
}

/** For use mid-sentence: "today", "yesterday", "3 days ago", "on 6 Nov 2026". */
export function whenPhrase(value: string, today: string): string {
  const r = relativeDay(value, today);
  return /^(Today|Yesterday|\d+ days ago)$/.test(r) ? r.toLowerCase() : `on ${r}`;
}
