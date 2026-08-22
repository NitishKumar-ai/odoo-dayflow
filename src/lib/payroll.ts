import "server-only";
import { eq } from "drizzle-orm";
import { db, employees, payrollRuns, payslips } from "@/db";
import { getCurrentSalaries } from "./employee-queries";
import { gross, net } from "./money";

export type PayrollResult<T> = { error: string } | T;

/**
 * Open a pay period and freeze each employee's applicable salary into a
 * payslip. Later structure edits do not rewrite these rows.
 */
export async function createPayrollRun(opts: {
  periodStart: string;
  periodEnd: string;
  createdByUserId?: string | null;
}): Promise<PayrollResult<{ runId: string; payslipCount: number }>> {
  const { periodStart, periodEnd, createdByUserId = null } = opts;
  if (periodEnd < periodStart) {
    return { error: "The period cannot end before it starts." };
  }

  return db.transaction(async (tx) => {
    const [run] = await tx
      .insert(payrollRuns)
      .values({ periodStart, periodEnd, createdByUserId })
      .onConflictDoNothing({
        target: [payrollRuns.periodStart, payrollRuns.periodEnd],
      })
      .returning({ id: payrollRuns.id });

    if (!run) {
      return { error: "A payroll run for that period already exists." };
    }

    const people = await tx.select({ id: employees.id }).from(employees);
    const salaries = await getCurrentSalaries(
      people.map((p) => p.id),
      periodEnd,
    );

    const rows = [...salaries.entries()].map(([employeeId, salary]) => ({
      payrollRunId: run.id,
      employeeId,
      salaryStructureId: salary.id,
      currency: salary.currency,
      basic: salary.basic,
      hra: salary.hra,
      allowances: salary.allowances,
      deductions: salary.deductions,
      gross: gross(salary).toFixed(2),
      net: net(salary).toFixed(2),
    }));

    if (rows.length) await tx.insert(payslips).values(rows);

    return { runId: run.id, payslipCount: rows.length };
  });
}

export async function finalizePayrollRun(
  runId: string,
): Promise<PayrollResult<{ runId: string }>> {
  const [run] = await db
    .select({ id: payrollRuns.id, status: payrollRuns.status })
    .from(payrollRuns)
    .where(eq(payrollRuns.id, runId))
    .limit(1);

  if (!run) return { error: "Payroll run not found." };
  if (run.status === "finalized") return { error: "That run is already finalized." };

  await db
    .update(payrollRuns)
    .set({ status: "finalized", finalizedAt: new Date() })
    .where(eq(payrollRuns.id, runId));

  return { runId };
}

export async function listPayslipsForEmployee(employeeId: string) {
  return db
    .select({
      id: payslips.id,
      payrollRunId: payslips.payrollRunId,
      periodStart: payrollRuns.periodStart,
      periodEnd: payrollRuns.periodEnd,
      status: payrollRuns.status,
      currency: payslips.currency,
      basic: payslips.basic,
      hra: payslips.hra,
      allowances: payslips.allowances,
      deductions: payslips.deductions,
      gross: payslips.gross,
      net: payslips.net,
    })
    .from(payslips)
    .innerJoin(payrollRuns, eq(payrollRuns.id, payslips.payrollRunId))
    .where(eq(payslips.employeeId, employeeId))
    .orderBy(payrollRuns.periodStart);
}
