import "server-only";
import { and, eq, ne, sql } from "drizzle-orm";
import { db, leaveRequests, leaveBalances } from "@/db";
import type { LeaveType } from "./leave";

/**
 * Days already committed this year for a leave type (approved + still pending).
 * Accepts a transaction so the balance check can run inside the caller's lock.
 */
export async function daysUsed(
  employeeId: string,
  leaveType: LeaveType,
  year: number,
  tx: Pick<typeof db, "select"> = db,
) {
  const [row] = await tx
    .select({ total: sql<number>`coalesce(sum(${leaveRequests.days}), 0)::int` })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.employeeId, employeeId),
        eq(leaveRequests.leaveType, leaveType),
        ne(leaveRequests.status, "rejected"),
        sql`extract(year from ${leaveRequests.startDate}) = ${year}`,
      ),
    );
  return row?.total ?? 0;
}

export type LeaveSummaryRow = {
  leaveType: LeaveType;
  entitled: number;
  used: number;
  left: number;
};

export async function leaveSummary(
  employeeId: string,
  year: number,
): Promise<LeaveSummaryRow[]> {
  const balances = await db
    .select({ leaveType: leaveBalances.leaveType, entitled: leaveBalances.entitledDays })
    .from(leaveBalances)
    .where(and(eq(leaveBalances.employeeId, employeeId), eq(leaveBalances.year, year)));

  const out: LeaveSummaryRow[] = [];
  for (const b of balances) {
    const used = await daysUsed(employeeId, b.leaveType, year);
    out.push({
      leaveType: b.leaveType,
      entitled: b.entitled,
      used,
      left: Math.max(0, b.entitled - used),
    });
  }
  return out;
}
