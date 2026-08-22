import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, employees, users } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getCurrentSalaries } from "@/lib/employee-queries";
import { formatDate } from "@/lib/dates";
import { formatMoney, gross, net } from "@/lib/money";
import { Avatar } from "@/components/Avatar";

export default async function AdminPayrollPage() {
  await requireAdmin();

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

  // One query for every employee's salary, not one query per employee.
  const salaries = await getCurrentSalaries(staff.map((s) => s.id));
  const rows = staff.map((s) => ({ ...s, salary: salaries.get(s.id) ?? null }));

  const active = rows.filter((r) => r.isActive);
  const currency = active.find((r) => r.salary)?.salary?.currency ?? "INR";
  const totalGross = active.reduce((sum, r) => sum + (r.salary ? gross(r.salary) : 0), 0);
  const totalNet = active.reduce((sum, r) => sum + (r.salary ? net(r.salary) : 0), 0);
  const missing = active.filter((r) => !r.salary).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Payroll</h1>
        <p className="text-sm text-muted">
          Salary structures across the company. Open an employee to edit theirs.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-muted">Monthly gross</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {formatMoney(totalGross, currency)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-muted">Monthly net</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {formatMoney(totalNet, currency)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-muted">Missing a structure</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{missing}</p>
          <p className="mt-1 text-xs text-muted">of {active.length} active employees</p>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-surface-muted">
              <tr>
                <th className="th">Employee</th>
                <th className="th">Basic</th>
                <th className="th">HRA</th>
                <th className="th">Allowances</th>
                <th className="th">Deductions</th>
                <th className="th">Net</th>
                <th className="th">Effective</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const name = `${r.firstName} ${r.lastName}`.trim();
                const s = r.salary;
                return (
                  <tr key={r.id} className={r.isActive ? undefined : "opacity-60"}>
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <Avatar name={name} photoUrl={r.photoUrl} size={32} />
                        <div>
                          <p className="font-medium">{name}</p>
                          <p className="text-xs text-muted">
                            {r.employeeCode} · {r.jobTitle || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    {s ? (
                      <>
                        <td className="td tabular-nums">
                          {formatMoney(Number(s.basic), s.currency)}
                        </td>
                        <td className="td tabular-nums">
                          {formatMoney(Number(s.hra), s.currency)}
                        </td>
                        <td className="td tabular-nums">
                          {formatMoney(Number(s.allowances), s.currency)}
                        </td>
                        <td className="td tabular-nums">
                          −{formatMoney(Number(s.deductions), s.currency)}
                        </td>
                        <td className="td font-medium tabular-nums">
                          {formatMoney(net(s), s.currency)}
                        </td>
                        <td className="td text-muted">{formatDate(s.effectiveFrom)}</td>
                      </>
                    ) : (
                      <td className="td text-muted" colSpan={6}>
                        No salary structure recorded
                      </td>
                    )}
                    <td className="td text-right">
                      <Link href={`/admin/employees/${r.id}`} className="btn-secondary">
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
