import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, employees, users } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getCurrentSalary } from "@/lib/employee-queries";
import { formatDate } from "@/lib/dates";
import { formatMoney, gross, net } from "@/lib/money";
import { Avatar } from "@/components/Avatar";
import { StatCard } from "@/components/StatCard";
import {
  IconPayroll,
  IconTrendingUp,
  IconAlertCircle,
  IconBriefcase,
  IconArrowUpRight,
} from "@/components/Icons";

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

  const rows = await Promise.all(
    staff.map(async (s) => ({ ...s, salary: await getCurrentSalary(s.id) })),
  );

  const active = rows.filter((r) => r.isActive);
  const currency = active.find((r) => r.salary)?.salary?.currency ?? "INR";
  const totalGross = active.reduce((sum, r) => sum + (r.salary ? gross(r.salary) : 0), 0);
  const totalNet = active.reduce((sum, r) => sum + (r.salary ? net(r.salary) : 0), 0);
  const totalDeductions = totalGross - totalNet;
  const missing = active.filter((r) => !r.salary).length;

  return (
    <div className="space-y-8">
      {/* Title & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Company Payroll Master
          </h1>
          <p className="mt-1 text-sm text-muted">
            Overview of total monthly payroll liability, itemized staff compensation, and structure configurations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="pill bg-emerald-50 text-emerald-700 ring-emerald-600/20 font-bold">
            {active.length - missing} Active Compensation Profiles
          </span>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <section className="grid gap-4 sm:grid-cols-4">
        <StatCard
          title="Total Monthly Gross"
          value={formatMoney(totalGross, currency)}
          tone="brand"
          subtitle="Company monthly gross payout"
          icon={<IconPayroll size={20} />}
        />
        <StatCard
          title="Total Monthly Net"
          value={formatMoney(totalNet, currency)}
          tone="success"
          subtitle="Total direct take-home liability"
          icon={<IconTrendingUp size={20} />}
        />
        <StatCard
          title="Total TDS / Deductions"
          value={formatMoney(totalDeductions, currency)}
          tone="warning"
          subtitle="Statutory tax withholding"
          icon={<IconBriefcase size={20} />}
        />
        <StatCard
          title="Pending Structures"
          value={missing}
          tone={missing > 0 ? "danger" : "neutral"}
          subtitle={`Out of ${active.length} active team members`}
          icon={<IconAlertCircle size={20} />}
        />
      </section>

      {/* Employee Compensation Grid */}
      <section className="card overflow-hidden shadow-xs">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Employee Compensation Roll
            </h2>
            <p className="text-xs text-muted">All company staff and active compensation records</p>
          </div>
          <span className="text-xs font-semibold text-muted">
            {rows.length} total team member{rows.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-surface-muted/60">
              <tr>
                <th className="th">Team Member</th>
                <th className="th">Basic</th>
                <th className="th">HRA</th>
                <th className="th">Allowances</th>
                <th className="th">Deductions</th>
                <th className="th">Net Take-Home</th>
                <th className="th">Effective Since</th>
                <th className="th text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const name = `${r.firstName} ${r.lastName}`.trim();
                const s = r.salary;

                return (
                  <tr
                    key={r.id}
                    className={`transition-colors hover:bg-surface-muted/30 ${
                      r.isActive ? "" : "opacity-50 bg-surface-muted/10"
                    }`}
                  >
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <Avatar name={name} photoUrl={r.photoUrl} size={36} />
                        <div>
                          <Link
                            href={`/admin/employees/${r.id}`}
                            className="font-bold text-foreground hover:text-brand hover:underline"
                          >
                            {name}
                          </Link>
                          <p className="text-xs text-muted">
                            {r.employeeCode} · {r.jobTitle || "Role not set"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {s ? (
                      <>
                        <td className="td tabular-nums text-xs font-medium">
                          {formatMoney(Number(s.basic), s.currency)}
                        </td>
                        <td className="td tabular-nums text-xs font-medium">
                          {formatMoney(Number(s.hra), s.currency)}
                        </td>
                        <td className="td tabular-nums text-xs font-medium">
                          {formatMoney(Number(s.allowances), s.currency)}
                        </td>
                        <td className="td tabular-nums text-xs font-medium text-rose-600 dark:text-rose-400">
                          −{formatMoney(Number(s.deductions), s.currency)}
                        </td>
                        <td className="td font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatMoney(net(s), s.currency)}
                        </td>
                        <td className="td text-xs text-muted">
                          {formatDate(s.effectiveFrom)}
                        </td>
                      </>
                    ) : (
                      <td className="td text-muted" colSpan={6}>
                        <span className="pill bg-amber-50 text-amber-700 ring-amber-600/20 text-[11px] font-bold">
                          ⚠️ No Structure Configured
                        </span>
                      </td>
                    )}

                    <td className="td text-right">
                      <Link
                        href={`/admin/employees/${r.id}`}
                        className="btn-secondary btn-sm text-xs font-bold"
                      >
                        <span>Configure</span>
                        <IconArrowUpRight size={13} />
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
