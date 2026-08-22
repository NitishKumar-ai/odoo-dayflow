// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { resetDb, seedEmployee } from "./helpers/db";
import { db } from "@/db";
import { payslips, salaryStructures } from "@/db/schema";
import {
  createPayrollRun,
  finalizePayrollRun,
  listPayslipsForEmployee,
} from "@/lib/payroll";

beforeEach(async () => {
  await resetDb();
});

async function withSalary(
  firstName: string,
  parts: { basic: string; hra: string; allowances: string; deductions: string },
  effectiveFrom = "2026-01-01",
) {
  const emp = await seedEmployee({ firstName, year: 2026 });
  const [salary] = await db
    .insert(salaryStructures)
    .values({
      employeeId: emp.employeeId,
      effectiveFrom,
      currency: "INR",
      ...parts,
    })
    .returning();
  return { emp, salary };
}

describe("createPayrollRun", () => {
  it("snapshots the salary in force at the period end", async () => {
    const { emp } = await withSalary("Rohan", {
      basic: "78000.00",
      hra: "31000.00",
      allowances: "9000.00",
      deductions: "9800.00",
    });

    const created = await createPayrollRun({
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
    });
    if ("error" in created) throw new Error(created.error);

    expect(created.payslipCount).toBe(1);
    const slips = await listPayslipsForEmployee(emp.employeeId);
    expect(slips).toHaveLength(1);
    expect(Number(slips[0].gross)).toBe(118000);
    expect(Number(slips[0].net)).toBe(108200);
    expect(slips[0].status).toBe("draft");
  });

  it("does not rewrite a snapshot after a later raise", async () => {
    const { emp } = await withSalary("Priya", {
      basic: "71000.00",
      hra: "28000.00",
      allowances: "8500.00",
      deductions: "8900.00",
    });

    const created = await createPayrollRun({
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
    });
    if ("error" in created) throw new Error(created.error);

    await db.insert(salaryStructures).values({
      employeeId: emp.employeeId,
      effectiveFrom: "2026-09-01",
      currency: "INR",
      basic: "90000.00",
      hra: "36000.00",
      allowances: "10000.00",
      deductions: "11000.00",
    });

    const [slip] = await db
      .select()
      .from(payslips)
      .where(eq(payslips.employeeId, emp.employeeId));
    expect(Number(slip.basic)).toBe(71000);
    expect(Number(slip.gross)).toBe(107500);
  });

  it("refuses a second run for the same period", async () => {
    await withSalary("Mei", {
      basic: "62000.00",
      hra: "24000.00",
      allowances: "15000.00",
      deductions: "7400.00",
    });

    const first = await createPayrollRun({
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
    });
    expect("runId" in first).toBe(true);

    const second = await createPayrollRun({
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
    });
    expect("error" in second && second.error).toMatch(/already exists/i);
  });

  it("rejects a period that ends before it starts", async () => {
    const res = await createPayrollRun({
      periodStart: "2026-08-31",
      periodEnd: "2026-08-01",
    });
    expect("error" in res && res.error).toMatch(/cannot end before/i);
  });

  it("skips employees who have no salary structure", async () => {
    await seedEmployee({ firstName: "NoPay", year: 2026 });
    const created = await createPayrollRun({
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
    });
    if ("error" in created) throw new Error(created.error);
    expect(created.payslipCount).toBe(0);
  });
});

describe("finalizePayrollRun", () => {
  it("marks a draft run as finalized and refuses a second finalize", async () => {
    const created = await createPayrollRun({
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
    });
    if ("error" in created) throw new Error(created.error);

    const first = await finalizePayrollRun(created.runId);
    expect("runId" in first).toBe(true);

    const again = await finalizePayrollRun(created.runId);
    expect("error" in again && again.error).toMatch(/already finalized/i);
  });

  it("reports a missing run", async () => {
    const res = await finalizePayrollRun("00000000-0000-4000-8000-000000000000");
    expect("error" in res && res.error).toMatch(/not found/i);
  });
});
