import { eq } from "drizzle-orm";
import { db, employees, users } from "@/db";
import { requireUser } from "@/lib/auth";
import { getCurrentSalary, getSalaryHistory } from "@/lib/employee-queries";
import { getPayslipsForEmployee } from "@/lib/payroll-queries";
import { EmployeePayrollClient } from "@/components/EmployeePayrollClient";

export default async function PayrollPage() {
  const user = await requireUser();
  const current = await getCurrentSalary(user.employeeId);
  const history = await getSalaryHistory(user.employeeId);
  const rawPayslips = await getPayslipsForEmployee(user.employeeId);

  // Fetch employee details for payslip header
  const [emp] = await db
    .select({
      firstName: employees.firstName,
      lastName: employees.lastName,
      department: employees.department,
      jobTitle: employees.jobTitle,
      employeeCode: users.employeeCode,
    })
    .from(employees)
    .innerJoin(users, eq(users.id, employees.userId))
    .where(eq(employees.id, user.employeeId))
    .limit(1);

  const employeePayslips = rawPayslips.map((p) => ({
    ...p,
    firstName: emp?.firstName || "",
    lastName: emp?.lastName || "",
    employeeCode: emp?.employeeCode || "",
    department: emp?.department || "",
    jobTitle: emp?.jobTitle || "",
  }));

  return (
    <EmployeePayrollClient
      currentSalary={current}
      salaryHistory={history}
      employeePayslips={employeePayslips}
    />
  );
}
