import { eq } from "drizzle-orm";
import { db, employees, users } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getCurrentSalaries } from "@/lib/employee-queries";
import { gross, net } from "@/lib/money";
import {
  getPayrollRuns,
  getMonthlySalaryReport,
  getMonthlyAttendanceReport,
} from "@/lib/payroll-queries";
import { AdminPayrollClient } from "@/components/admin/AdminPayrollClient";

export default async function AdminPayrollPage() {
  await requireAdmin();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const staff = await db
    .select({
      id: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      photoUrl: employees.photoUrl,
      department: employees.department,
      jobTitle: employees.jobTitle,
      employeeCode: users.employeeCode,
      isActive: users.isActive,
    })
    .from(employees)
    .innerJoin(users, eq(users.id, employees.userId))
    .orderBy(employees.firstName);

  const salaries = await getCurrentSalaries(staff.map((s) => s.id));
  const rows = staff.map((s) => {
    const sal = salaries.get(s.id) ?? null;
    return {
      ...s,
      salary: sal
        ? {
            currency: sal.currency || "INR",
            basic: sal.basic,
            hra: sal.hra,
            allowances: sal.allowances,
            deductions: sal.deductions,
            effectiveFrom: sal.effectiveFrom,
          }
        : null,
    };
  });

  const active = rows.filter((r) => r.isActive);
  const currency = active.find((r) => r.salary)?.salary?.currency ?? "INR";
  const totalGross = active.reduce((sum, r) => sum + (r.salary ? gross(r.salary) : 0), 0);
  const totalNet = active.reduce((sum, r) => sum + (r.salary ? net(r.salary) : 0), 0);
  const totalDeductions = totalGross - totalNet;
  const missing = active.filter((r) => !r.salary).length;

  const payrollRuns = await getPayrollRuns();
  const salaryReportData = await getMonthlySalaryReport(year, month);
  const attendanceReportData = await getMonthlyAttendanceReport(year, month);

  return (
    <AdminPayrollClient
      activeCount={active.length - missing}
      missing={missing}
      totalGross={totalGross}
      totalNet={totalNet}
      totalDeductions={totalDeductions}
      currency={currency}
      rows={rows}
      payrollRuns={payrollRuns}
      reports={{
        salaryByDept: salaryReportData.departmentSummaries,
        attendanceSummary: attendanceReportData,
      }}
    />
  );
}
