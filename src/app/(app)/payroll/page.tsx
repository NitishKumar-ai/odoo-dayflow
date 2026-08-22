import { requireUser } from "@/lib/auth";
import { getCurrentSalary, getSalaryHistory } from "@/lib/employee-queries";
import { formatDate } from "@/lib/dates";
import { formatMoney, gross, net } from "@/lib/money";
import { SalaryCard } from "@/components/SalaryCard";
import {
  IconPayroll,
  IconFileText,
  IconTrendingUp,
} from "@/components/Icons";

export default async function PayrollPage() {
  const user = await requireUser();
  const current = await getCurrentSalary(user.employeeId);
  const history = await getSalaryHistory(user.employeeId);

  return (
    <div className="space-y-8">
      {/* Title & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My Compensation & Payroll
          </h1>
          <p className="mt-1 text-sm text-muted">
            View your active salary structure, monthly breakdown, and historical compensation revisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="pill bg-brand-soft text-brand font-bold ring-brand/20">
            Confidential & Verified
          </span>
        </div>
      </div>

      {!current ? (
        <div className="card p-12 text-center text-muted">
          <IconPayroll size={36} className="mx-auto mb-2 text-muted/50" />
          <p className="font-bold text-foreground">No Salary Structure Configured</p>
          <p className="mt-1 text-xs text-muted">
            Your compensation package has not been recorded by the HR department yet. Please reach out to your HR administrator.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Salary Card */}
          <div className="lg:col-span-2 space-y-6">
            <SalaryCard salary={current} />

            {/* Compensation Revision History */}
            {history.length > 0 && (
              <section className="card overflow-hidden shadow-xs">
                <div className="flex items-center justify-between border-b border-line px-6 py-4">
                  <div className="flex items-center gap-2">
                    <IconTrendingUp size={16} className="text-brand" />
                    <h2 className="text-base font-bold text-foreground">
                      Salary Revision History
                    </h2>
                  </div>
                  <span className="text-xs text-muted font-medium">
                    {history.length} revision{history.length === 1 ? "" : "s"} logged
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface-muted/60">
                      <tr>
                        <th className="th">Effective Date</th>
                        <th className="th">Gross Monthly</th>
                        <th className="th">Deductions</th>
                        <th className="th">Net Take-Home</th>
                        <th className="th">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {history.map((h) => {
                        const isCurrent = h.id === current.id;
                        return (
                          <tr
                            key={h.id}
                            className={`hover:bg-surface-muted/30 transition-colors ${
                              isCurrent ? "bg-brand-soft/20 font-medium" : ""
                            }`}
                          >
                            <td className="td">
                              <span className="font-bold text-foreground">
                                {formatDate(h.effectiveFrom)}
                              </span>
                              {isCurrent && (
                                <span className="ml-2 pill bg-brand text-white text-[9px] px-1.5 py-0">
                                  Current
                                </span>
                              )}
                            </td>
                            <td className="td tabular-nums font-semibold text-foreground">
                              {formatMoney(gross(h), h.currency)}
                            </td>
                            <td className="td tabular-nums text-rose-600 dark:text-rose-400 font-semibold">
                              −{formatMoney(Number(h.deductions), h.currency)}
                            </td>
                            <td className="td tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                              {formatMoney(net(h), h.currency)}
                            </td>
                            <td className="td">
                              <span
                                className={`pill ${
                                  isCurrent
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                    : "bg-surface-muted text-muted ring-line"
                                }`}
                              >
                                {isCurrent ? "Active" : "Archived"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>

          {/* Side Info Cards */}
          <div className="space-y-6">
            <div className="card p-6 bg-linear-to-br from-brand-soft/50 via-surface to-surface border-brand/20">
              <div className="flex items-center gap-2 mb-3">
                <IconFileText size={18} className="text-brand" />
                <h3 className="font-bold text-foreground">Payroll Policy</h3>
              </div>
              <ul className="space-y-2.5 text-xs text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-brand font-bold">✓</span>
                  <span>Salaries are disbursed on the last working day of each calendar month.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand font-bold">✓</span>
                  <span>TDS and tax deductions are computed in accordance with statutory tax brackets.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand font-bold">✓</span>
                  <span>Unpaid leaves taken beyond accrued balances are prorated against monthly gross.</span>
                </li>
              </ul>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-foreground text-sm mb-2">Need a Pay Adjustment?</h3>
              <p className="text-xs text-muted mb-4">
                Salary structures, tax declarations, and bank details are managed by HR. Submit an inquiry through the HR helpdesk for any clarifications.
              </p>
              <a
                href="mailto:hr@dayflow.test"
                className="btn-secondary btn-sm w-full text-center text-xs font-bold"
              >
                Contact HR Support
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
