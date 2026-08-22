"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db, payrollRuns, payslips, employees, users } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getCurrentSalaries } from "@/lib/employee-queries";
import { gross, net } from "@/lib/money";

export async function processPayrollRunAction(formData: FormData) {
  const adminUser = await requireAdmin();

  const yearStr = formData.get("year")?.toString();
  const monthStr = formData.get("month")?.toString();

  const year = Number(yearStr);
  const month = Number(monthStr);

  if (!year || isNaN(year) || year < 2000 || year > 2100) {
    return { error: "Please enter a valid year." };
  }

  if (!month || isNaN(month) || month < 1 || month > 12) {
    return { error: "Please select a valid month (1-12)." };
  }

  // Check if a run already exists for this pay period
  const existing = await db
    .select({ id: payrollRuns.id })
    .from(payrollRuns)
    .where(and(eq(payrollRuns.year, year), eq(payrollRuns.month, month)))
    .limit(1);

  if (existing.length > 0) {
    return { error: `Payroll run for ${year}-${String(month).padStart(2, "0")} has already been processed.` };
  }

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDayNum = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDayNum).padStart(2, "0")}`;

  // Fetch active employees
  const activeStaff = await db
    .select({ id: employees.id, userId: employees.userId })
    .from(employees)
    .innerJoin(users, eq(users.id, employees.userId))
    .where(eq(users.isActive, true));

  if (activeStaff.length === 0) {
    return { error: "No active employees found to process payroll." };
  }

  const staffIds = activeStaff.map((s) => s.id);
  const salaryMap = await getCurrentSalaries(staffIds);

  const eligibleStaff = activeStaff.filter((s) => salaryMap.has(s.id));

  if (eligibleStaff.length === 0) {
    return { error: "No active employees have a configured salary structure." };
  }

  const now = new Date();

  // Create payroll run record
  const [run] = await db
    .insert(payrollRuns)
    .values({
      year,
      month,
      payPeriodStart: startDate,
      payPeriodEnd: endDate,
      status: "completed",
      processedByUserId: adminUser.userId,
      processedAt: now,
    })
    .returning({ id: payrollRuns.id });

  let runTotalGross = 0;
  let runTotalNet = 0;
  let runTotalDeductions = 0;
  let count = 0;

  for (const s of eligibleStaff) {
    const sal = salaryMap.get(s.id);
    if (!sal) continue;

    const g = gross(sal);
    const n = net(sal);
    const d = Number(sal.deductions);

    runTotalGross += g;
    runTotalNet += n;
    runTotalDeductions += d;
    count += 1;

    await db.insert(payslips).values({
      payrollRunId: run.id,
      employeeId: s.id,
      year,
      month,
      basic: sal.basic,
      hra: sal.hra,
      allowances: sal.allowances,
      deductions: sal.deductions,
      gross: g.toFixed(2),
      net: n.toFixed(2),
      currency: sal.currency || "INR",
    });
  }

  // Update totals in payroll_runs
  await db
    .update(payrollRuns)
    .set({
      totalGross: runTotalGross.toFixed(2),
      totalDeductions: runTotalDeductions.toFixed(2),
      totalNet: runTotalNet.toFixed(2),
      employeeCount: count,
    })
    .where(eq(payrollRuns.id, run.id));

  revalidatePath("/admin/payroll");
  revalidatePath("/payroll");

  return { success: true, runId: run.id };
}
