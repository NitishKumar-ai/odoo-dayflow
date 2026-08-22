import { eachDate, isWeekend } from "./dates";

export type LeaveType = "paid" | "sick" | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected";

/** Default annual entitlement. The spec has no quota model, so these are the defaults. */
export const DEFAULT_ENTITLEMENT: Record<Exclude<LeaveType, "unpaid">, number> = {
  paid: 18,
  sick: 12,
};

/** Weekends do not consume leave. */
export function countLeaveDays(start: string, end: string): number {
  return eachDate(start, end).filter((d) => !isWeekend(d)).length;
}

export const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  paid: "Paid leave",
  sick: "Sick leave",
  unpaid: "Unpaid leave",
};

export const LEAVE_STATUS_TONE: Record<LeaveStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  rejected: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20",
};

export const LEAVE_STATUS_LABEL: Record<LeaveStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};
