// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { eq } from "drizzle-orm";
import { resetDb, seedEmployee, type SeededEmployee } from "./helpers/db";
import { actAs } from "./helpers/session";
import { db } from "@/db";
import { salaryStructures, payrollRuns, payslips } from "@/db/schema";
import {
  getPayrollRuns,
  getPayrollRunById,
  getPayslipsForEmployee,
  getMonthlySalaryReport,
  getMonthlyAttendanceReport,
} from "@/lib/payroll-queries";

vi.mock("@/lib/auth", async () => (await import("./helpers/session")).authMock());

const { processPayrollRunAction } = await import("@/actions/payroll");

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

let employee: SeededEmployee;
let admin: SeededEmployee;

beforeEach(async () => {
  await resetDb();
  employee = await seedEmployee({ firstName: "Rohan", role: "employee" });
  admin = await seedEmployee({ firstName: "Asha", role: "admin" });

  // Add salary structure for employee
  await db.insert(salaryStructures).values({
    employeeId: employee.employeeId,
    effectiveFrom: "2026-01-01",
    currency: "INR",
    basic: "50000.00",
    hra: "20000.00",
    allowances: "5000.00",
    deductions: "5000.00",
    updatedByUserId: admin.userId,
  });

  actAs({ ...admin, role: "admin" });
});

describe("processPayrollRunAction", () => {
  it("executes a monthly payroll run and generates payslips", async () => {
    const res = await processPayrollRunAction(form({ year: "2026", month: "8" }));

    expect(res.success).toBe(true);
    expect(res.runId).toBeDefined();

    const runs = await getPayrollRuns();
    expect(runs.length).toBe(1);
    expect(runs[0].year).toBe(2026);
    expect(runs[0].month).toBe(8);
    expect(Number(runs[0].totalGross)).toBe(75000);
    expect(Number(runs[0].totalNet)).toBe(70000);
    expect(Number(runs[0].totalDeductions)).toBe(5000);

    const empPayslips = await getPayslipsForEmployee(employee.employeeId);
    expect(empPayslips.length).toBe(1);
    expect(empPayslips[0].year).toBe(2026);
    expect(empPayslips[0].month).toBe(8);
    expect(Number(empPayslips[0].gross)).toBe(75000);
    expect(Number(empPayslips[0].net)).toBe(70000);
  });

  it("prevents duplicate payroll runs for the same year and month", async () => {
    await processPayrollRunAction(form({ year: "2026", month: "8" }));

    const duplicateRes = await processPayrollRunAction(form({ year: "2026", month: "8" }));
    expect(duplicateRes.error).toMatch(/already been processed/i);
  });

  it("validates year and month inputs", async () => {
    const invalidYear = await processPayrollRunAction(form({ year: "abc", month: "8" }));
    expect(invalidYear.error).toMatch(/valid year/i);

    const invalidMonth = await processPayrollRunAction(form({ year: "2026", month: "13" }));
    expect(invalidMonth.error).toMatch(/valid month/i);
  });

  it("refuses execution for non-admin users", async () => {
    actAs({ ...employee, role: "employee" });
    await expect(processPayrollRunAction(form({ year: "2026", month: "8" }))).rejects.toThrow();
  });
});

describe("Payroll Queries & Reports", () => {
  it("fetches payroll run details with payslips", async () => {
    const res = await processPayrollRunAction(form({ year: "2026", month: "8" }));
    const runDetail = await getPayrollRunById(res.runId!);

    expect(runDetail).not.toBeNull();
    expect(runDetail?.year).toBe(2026);
    expect(runDetail?.month).toBe(8);
    expect(runDetail?.payslips.length).toBeGreaterThan(0);
  });

  it("generates monthly salary report grouped by department", async () => {
    await processPayrollRunAction(form({ year: "2026", month: "8" }));

    const report = await getMonthlySalaryReport(2026, 8);
    expect(report.grandTotal.employeeCount).toBeGreaterThan(0);
    expect(report.grandTotal.gross).toBeGreaterThan(0);
  });

  it("generates monthly attendance summary report", async () => {
    const attendanceReport = await getMonthlyAttendanceReport(2026, 8);
    expect(attendanceReport.length).toBeGreaterThan(0);
    expect(attendanceReport[0].employeeCode).toBeDefined();
  });
});
