/** All dates are handled as local YYYY-MM-DD strings to match the `date` columns. */

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function today(): string {
  return toDateKey(new Date());
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Monday-start week containing `key`. */
export function weekRange(key: string): { start: string; end: string; days: string[] } {
  const d = parseDateKey(key);
  const offset = (d.getDay() + 6) % 7; // Mon = 0
  const start = new Date(d);
  start.setDate(d.getDate() - offset);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(start);
    x.setDate(start.getDate() + i);
    days.push(toDateKey(x));
  }
  return { start: days[0], end: days[6], days };
}

export function addDays(key: string, n: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

export function isWeekend(key: string): boolean {
  const day = parseDateKey(key).getDay();
  return day === 0 || day === 6;
}

/** Inclusive range of date keys. */
export function eachDate(start: string, end: string): string[] {
  const out: string[] = [];
  let cur = start;
  let guard = 0;
  while (cur <= end && guard++ < 400) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export function formatDate(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDay(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, { weekday: "short" });
}

export function formatTime(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function hoursBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 3_600_000;
}
