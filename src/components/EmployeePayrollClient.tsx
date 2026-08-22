"use client";

import { useState } from "react";
import { formatMoney, gross, net, SalaryParts } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { SalaryCard } from "@/components/SalaryCard";
import { PayslipView } from "@/components/PayslipModal";
import {
  IconPayroll,
  IconFileText,
  IconTrendingUp,
  IconEye,
  IconPrinter,
} from "@/components/Icons";
import type { Payslip, SalaryStructure } from "@/db";

export type EmployeePayrollClientProps = {
  currentSalary: SalaryStructure | null;
  salaryHistory: SalaryStructure[];
  employeePayslips: Array<
    Payslip & {
      firstName: string;
      lastName: string;
      employeeCode: string;
      department: string;
      jobTitle: string;
    }
  >;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function EmployeePayrollClient({
  currentSalary,
  salaryHistory,
  employeePayslips,
}: EmployeePayrollClientProps) {
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  return (
    <div className="space-y-8">
      {/* Title & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My Compensation & Payslips
          </h1>
          <p className="mt-1 text-sm text-muted">
            View active salary structure, itemized monthly payslips, and historical compensation revisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="pill bg-brand-soft text-brand font-bold ring-brand/20">
            Confidential & Verified
          </span>
        </div>
      </div>

      {!currentSalary ? (
        <div className="card p-12 text-center text-muted">
          <IconPayroll size={36} className="mx-auto mb-2 text-muted/50" />
          <p className="font-bold text-foreground">No Salary Structure Configured</p>
          <p className="mt-1 text-xs text-muted">
            Your compensation package has not been recorded by the HR department yet. Please reach out to your HR administrator.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <SalaryCard salary={currentSalary} />

            {/* Issued Monthly Payslips Section */}
            <section className="card overflow-hidden shadow-xs">
              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <div className="flex items-center gap-2">
                  <IconFileText size={18} className="text-brand" />
                  <h2 className="text-base font-bold text-foreground">
                    Issued Monthly Payslips
                  </h2>
                </div>
                <span className="text-xs text-muted font-medium">
                  {employeePayslips.length} payslip{employeePayslips.length === 1 ? "" : "s"} available
                </span>
              </div>

              {employeePayslips.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted">
                  No monthly payslips have been generated yet for your account. Payslips are published at the end of each monthly payroll run.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface-muted/60">
                      <tr>
                        <th className="th">Pay Period</th>
                        <th className="th">Gross Earnings</th>
                        <th className="th">Deductions</th>
                        <th className="th">Net Take-Home</th>
                        <th className="th text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {employeePayslips.map((p) => {
                        const monthName = MONTH_NAMES[p.month - 1] || `Month ${p.month}`;
                        return (
                          <tr
                            key={p.id}
                            className="hover:bg-surface-muted/30 transition-colors"
                          >
                            <td className="td">
                              <span className="font-bold text-foreground">
                                {monthName} {p.year}
                              </span>
                            </td>
                            <td className="td tabular-nums font-semibold text-foreground text-xs">
                              {formatMoney(Number(p.gross), p.currency)}
                            </td>
                            <td className="td tabular-nums text-rose-600 dark:text-rose-400 font-semibold text-xs">
                              −{formatMoney(Number(p.deductions), p.currency)}
                            </td>
                            <td className="td tabular-nums font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                              {formatMoney(Number(p.net), p.currency)}
                            </td>
                            <td className="td text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedPayslip(p)}
                                className="btn-secondary btn-sm text-xs font-bold gap-1"
                              >
                                <IconEye size={13} />
                                <span>View Payslip</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Compensation Revision History */}
            {salaryHistory.length > 0 && (
              <section className="card overflow-hidden shadow-xs">
                <div className="flex items-center justify-between border-b border-line px-6 py-4">
                  <div className="flex items-center gap-2">
                    <IconTrendingUp size={16} className="text-brand" />
                    <h2 className="text-base font-bold text-foreground">
                      Salary Revision History
                    </h2>
                  </div>
                  <span className="text-xs text-muted font-medium">
                    {salaryHistory.length} revision{salaryHistory.length === 1 ? "" : "s"} logged
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
                      {salaryHistory.map((h) => {
                        const isCurrent = h.id === currentSalary.id;
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
                            <td className="td tabular-nums font-semibold text-foreground text-xs">
                              {formatMoney(gross(h), h.currency)}
                            </td>
                            <td className="td tabular-nums text-rose-600 dark:text-rose-400 font-semibold text-xs">
                              −{formatMoney(Number(h.deductions), h.currency)}
                            </td>
                            <td className="td tabular-nums font-bold text-emerald-600 dark:text-emerald-400 text-xs">
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
                <h3 className="font-bold text-foreground">Payroll & Payslip Policy</h3>
              </div>
              <ul className="space-y-2.5 text-xs text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-brand font-bold">✓</span>
                  <span>Salaries are disbursed on the last working day of each calendar month.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand font-bold">✓</span>
                  <span>Official monthly payslips are published immediately upon payroll run completion.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand font-bold">✓</span>
                  <span>Payslips serve as valid proof of income for financial institutions and tax filings.</span>
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

      {/* Payslip Modal */}
      {selectedPayslip && (
        <PayslipView payslip={selectedPayslip} onClose={() => setSelectedPayslip(null)} />
      )}
    </div>
  );
}
