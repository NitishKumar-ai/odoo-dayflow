import { eq, and, desc, sql } from "drizzle-orm";
import { db, payrollRuns, payslips, employees, users, attendance, leaveRequests } from "@/db";
import { gross, net } from "@/lib/money";
import { toDateKey } from "@/lib/dates";

export type PayrollRunItem = typeof payrollRuns.$inferSelect & {
  processorName?: string | null;
};

export type PayslipWithEmployee = typeof payslips.$inferSelect & {
  firstName: string;
  lastName: string;
  employeeCode: string;
  department: string;
  jobTitle: string;
  photoUrl: string | null;
};

export type DepartmentSalarySummary = {
  department: string;
  employeeCount: number;
  totalBasic: number;
  totalHra: number;
  totalAllowances: number;
  totalDeductions: number;
  totalGross: number;
  totalNet: number;
};

export type EmployeeAttendanceSummary = {
  employeeId: string;
  employeeCode: string;
  name: string;
  department: string;
  presentDays: number;
  halfDays: number;
  leaveDays: number;
  absentDays: number;
  totalWorkingDays: number;
};

export async function getPayrollRuns(): Promise<PayrollRunItem[]> {
  const runs = await db
    .select({
      run: payrollRuns,
      firstName: employees.firstName,
      lastName: employees.lastName,
    })
    .from(payrollRuns)
    .leftJoin(users, eq(users.id, payrollRuns.processedByUserId))
    .leftJoin(employees, eq(employees.userId, users.id))
    .orderBy(desc(payrollRuns.year), desc(payrollRuns.month));

  return runs.map((r) => ({
    ...r.run,
    processorName: r.firstName ? `${r.firstName} ${r.lastName}`.trim() : "System",
  }));
}

export async function getPayrollRunById(id: string) {
  const [run] = await db
    .select()
    .from(payrollRuns)
    .where(eq(payrollRuns.id, id))
    .limit(1);

  if (!run) return null;

  const runPayslips = await db
    .select({
      payslip: payslips,
      firstName: employees.firstName,
      lastName: employees.lastName,
      employeeCode: users.employeeCode,
      department: employees.department,
      jobTitle: employees.jobTitle,
      photoUrl: employees.photoUrl,
    })
    .from(payslips)
    .innerJoin(employees, eq(employees.id, payslips.employeeId))
    .innerJoin(users, eq(users.id, employees.userId))
    .where(eq(payslips.payrollRunId, id))
    .orderBy(employees.firstName);

  const formattedPayslips: PayslipWithEmployee[] = runPayslips.map((p) => ({
    ...p.payslip,
    firstName: p.firstName,
    lastName: p.lastName,
    employeeCode: p.employeeCode,
    department: p.department,
    jobTitle: p.jobTitle,
    photoUrl: p.photoUrl,
  }));

  return {
    ...run,
    payslips: formattedPayslips,
  };
}

export async function getPayslipsForEmployee(employeeId: string) {
  return db
    .select()
    .from(payslips)
    .where(eq(payslips.employeeId, employeeId))
    .orderBy(desc(payslips.year), desc(payslips.month));
}

export async function getPayslipById(payslipId: string) {
  const [row] = await db
    .select({
      payslip: payslips,
      firstName: employees.firstName,
      lastName: employees.lastName,
      employeeCode: users.employeeCode,
      department: employees.department,
      jobTitle: employees.jobTitle,
      photoUrl: employees.photoUrl,
      dateOfJoining: employees.dateOfJoining,
      phone: employees.phone,
      address: employees.address,
      runStart: payrollRuns.payPeriodStart,
      runEnd: payrollRuns.payPeriodEnd,
    })
    .from(payslips)
    .innerJoin(employees, eq(employees.id, payslips.employeeId))
    .innerJoin(users, eq(users.id, employees.userId))
    .innerJoin(payrollRuns, eq(payrollRuns.id, payslips.payrollRunId))
    .where(eq(payslips.id, payslipId))
    .limit(1);

  if (!row) return null;

  return row;
}

export async function getMonthlySalaryReport(
  year: number,
  month: number
): Promise<{
  departmentSummaries: DepartmentSalarySummary[];
  grandTotal: { gross: number; net: number; deductions: number; employeeCount: number };
}> {
  const runPayslips = await db
    .select({
      payslip: payslips,
      department: employees.department,
    })
    .from(payslips)
    .innerJoin(employees, eq(employees.id, payslips.employeeId))
    .where(and(eq(payslips.year, year), eq(payslips.month, month)));

  const map = new Map<string, DepartmentSalarySummary>();

  let grandGross = 0;
  let grandNet = 0;
  let grandDeductions = 0;

  for (const { payslip, department } of runPayslips) {
    const dept = department || "Unassigned";
    const basic = Number(payslip.basic);
    const hra = Number(payslip.hra);
    const allowances = Number(payslip.allowances);
    const deductions = Number(payslip.deductions);
    const grossVal = Number(payslip.gross);
    const netVal = Number(payslip.net);

    grandGross += grossVal;
    grandNet += netVal;
    grandDeductions += deductions;

    const existing = map.get(dept) ?? {
      department: dept,
      employeeCount: 0,
      totalBasic: 0,
      totalHra: 0,
      totalAllowances: 0,
      totalDeductions: 0,
      totalGross: 0,
      totalNet: 0,
    };

    existing.employeeCount += 1;
    existing.totalBasic += basic;
    existing.totalHra += hra;
    existing.totalAllowances += allowances;
    existing.totalDeductions += deductions;
    existing.totalGross += grossVal;
    existing.totalNet += netVal;

    map.set(dept, existing);
  }

  return {
    departmentSummaries: Array.from(map.values()),
    grandTotal: {
      gross: grandGross,
      net: grandNet,
      deductions: grandDeductions,
      employeeCount: runPayslips.length,
    },
  };
}

export async function getMonthlyAttendanceReport(
  year: number,
  month: number
): Promise<EmployeeAttendanceSummary[]> {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const staff = await db
    .select({
      id: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      department: employees.department,
      employeeCode: users.employeeCode,
    })
    .from(employees)
    .innerJoin(users, eq(users.id, employees.userId))
    .where(eq(users.isActive, true))
    .orderBy(employees.firstName);

  const attendanceRecords = await db
    .select()
    .from(attendance)
    .where(sql`${attendance.workDate} >= ${startDate} AND ${attendance.workDate} <= ${endDate}`);

  const attendanceMap = new Map<string, { present: number; halfDay: number; leave: number; absent: number }>();

  for (const r of attendanceRecords) {
    const existing = attendanceMap.get(r.employeeId) ?? { present: 0, halfDay: 0, leave: 0, absent: 0 };
    if (r.status === "present") existing.present += 1;
    else if (r.status === "half_day") existing.halfDay += 1;
    else if (r.status === "leave") existing.leave += 1;
    else if (r.status === "absent") existing.absent += 1;
    attendanceMap.set(r.employeeId, existing);
  }

  return staff.map((s) => {
    const counts = attendanceMap.get(s.id) ?? { present: 0, halfDay: 0, leave: 0, absent: 0 };
    return {
      employeeId: s.id,
      employeeCode: s.employeeCode,
      name: `${s.firstName} ${s.lastName}`.trim(),
      department: s.department || "General",
      presentDays: counts.present,
      halfDays: counts.halfDay,
      leaveDays: counts.leave,
      absentDays: counts.absent,
      totalWorkingDays: counts.present + counts.halfDay * 0.5 + counts.leave,
    };
  });
}
