import { hoursBetween, isWeekend } from "./dates";

/**
 * The spec lists Present / Absent / Half-day / Leave but never says how a day
 * earns its status. Rule chosen here: derive from worked hours at check-out,
 * with approved leave and explicit admin overrides winning.
 */
export const FULL_DAY_HOURS = 6;
export const HALF_DAY_HOURS = 3;

export type AttendanceStatus = "present" | "absent" | "half_day" | "leave";

export function deriveStatus(
  checkInAt: Date | null,
  checkOutAt: Date | null,
): AttendanceStatus {
  if (!checkInAt) return "absent";
  if (!checkOutAt) return "present"; // still on the clock
  const worked = hoursBetween(checkInAt, checkOutAt);
  if (worked >= FULL_DAY_HOURS) return "present";
  if (worked >= HALF_DAY_HOURS) return "half_day";
  return "absent";
}

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  half_day: "Half-day",
  leave: "Leave",
};

export const STATUS_TONE: Record<AttendanceStatus, string> = {
  present: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  absent: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20",
  half_day: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
  leave: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20",
};

export function workedHours(checkInAt: Date | null, checkOutAt: Date | null): string {
  if (!checkInAt || !checkOutAt) return "—";
  const h = hoursBetween(checkInAt, checkOutAt);
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return `${hours}h ${mins}m`;
}

/** Business days in a Monday-start week — the denominator the dashboard shows. */
export const BUSINESS_DAYS_PER_WEEK = 5;

/**
 * Days counted as present for the weekly "x / 5" metric. Weekend rows are
 * excluded: a Saturday check-in is real attendance, but counting it against a
 * five-day denominator renders as "6 / 5".
 */
export function countPresentBusinessDays(
  rows: { status: string; workDate: string }[],
): number {
  return rows.filter((r) => r.status === "present" && !isWeekend(r.workDate)).length;
}
