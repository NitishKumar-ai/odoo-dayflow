"use client";

import { useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { Avatar } from "@/components/Avatar";
import { StatCard } from "@/components/StatCard";
import { ProcessPayrollModal } from "@/components/admin/ProcessPayrollModal";
import { PayslipView } from "@/components/PayslipModal";
import {
  IconPayroll,
  IconTrendingUp,
  IconAlertCircle,
  IconBriefcase,
  IconArrowUpRight,
  IconPlus,
  IconFileText,
  IconEmployees,
  IconCalendar,
  IconEye,
} from "@/components/Icons";
import type { PayrollRunItem } from "@/lib/payroll-queries";

export type AdminPayrollClientProps = {
  activeCount: number;
  missing: number;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  currency: string;
  rows: Array<{
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    department: string;
    jobTitle: string;
    employeeCode: string;
    isActive: boolean;
    salary: {
      currency: string;
      basic: string;
      hra: string;
      allowances: string;
      deductions: string;
      effectiveFrom: string;
    } | null;
  }>;
  payrollRuns: PayrollRunItem[];
  reports: {
    salaryByDept: Array<{
      department: string;
      employeeCount: number;
      totalBasic: number;
      totalHra: number;
      totalAllowances: number;
      totalDeductions: number;
      totalGross: number;
      totalNet: number;
    }>;
    attendanceSummary: Array<{
      employeeId: string;
      employeeCode: string;
      name: string;
      department: string;
      presentDays: number;
      halfDays: number;
      leaveDays: number;
      absentDays: number;
      totalWorkingDays: number;
    }>;
  };
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function AdminPayrollClient({
  activeCount,
  missing,
  totalGross,
  totalNet,
  totalDeductions,
  currency,
  rows,
  payrollRuns,
  reports,
}: AdminPayrollClientProps) {
  const [activeTab, setActiveTab] = useState<"runs" | "roll" | "reports">("runs");
  const [showProcessModal, setShowProcessModal] = useState<boolean>(false);
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  return (
    <div className="space-y-8">
      {/* Title & Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Company Payroll Master
          </h1>
          <p className="mt-1 text-sm text-muted">
            Execute monthly payroll runs, manage employee compensation structures, and review attendance & salary reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowProcessModal(true)}
            className="btn-primary btn-md text-xs font-bold gap-2 shadow-xs"
          >
            <IconPlus size={16} />
            <span>Process Monthly Payroll Run</span>
          </button>
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
          title="Completed Runs"
          value={payrollRuns.length}
          tone="neutral"
          subtitle={`${payrollRuns.length} monthly run(s) recorded`}
          icon={<IconCalendar size={20} />}
        />
      </section>

      {/* Navigation Tabs */}
      <div className="border-b border-line flex items-center gap-6 text-sm font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("runs")}
          className={`pb-3 transition-colors relative flex items-center gap-2 ${
            activeTab === "runs"
              ? "text-brand border-b-2 border-brand"
              : "text-muted hover:text-foreground"
          }`}
        >
          <IconPayroll size={16} />
          <span>Payroll Runs ({payrollRuns.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("roll")}
          className={`pb-3 transition-colors relative flex items-center gap-2 ${
            activeTab === "roll"
              ? "text-brand border-b-2 border-brand"
              : "text-muted hover:text-foreground"
          }`}
        >
          <IconEmployees size={16} />
          <span>Compensation Directory ({rows.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`pb-3 transition-colors relative flex items-center gap-2 ${
            activeTab === "reports"
              ? "text-brand border-b-2 border-brand"
              : "text-muted hover:text-foreground"
          }`}
        >
          <IconFileText size={16} />
          <span>Payroll & Attendance Reports</span>
        </button>
      </div>

      {/* Tab 1: Payroll Runs */}
      {activeTab === "runs" && (
        <section className="card overflow-hidden shadow-xs">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Executed Monthly Payroll Runs</h2>
              <p className="text-xs text-muted">History of all completed monthly payroll disbursements</p>
            </div>
            <button
              type="button"
              onClick={() => setShowProcessModal(true)}
              className="btn-secondary btn-sm text-xs font-bold gap-1.5"
            >
              <IconPlus size={14} />
              <span>New Run</span>
            </button>
          </div>

          {payrollRuns.length === 0 ? (
            <div className="p-12 text-center text-muted">
              <IconCalendar size={36} className="mx-auto mb-2 text-muted/50" />
              <p className="font-bold text-foreground">No Payroll Runs Executed Yet</p>
              <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
                Click &quot;Process Monthly Payroll Run&quot; to generate stable monthly payslips for all active employees.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-surface-muted/60">
                  <tr>
                    <th className="th">Pay Period</th>
                    <th className="th">Staff Count</th>
                    <th className="th">Total Gross</th>
                    <th className="th">Total Deductions</th>
                    <th className="th">Total Net Payout</th>
                    <th className="th">Status</th>
                    <th className="th">Processed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {payrollRuns.map((run) => {
                    const monthName = MONTH_NAMES[run.month - 1] || `Month ${run.month}`;
                    return (
                      <tr key={run.id} className="hover:bg-surface-muted/30 transition-colors">
                        <td className="td">
                          <span className="font-bold text-foreground">{monthName} {run.year}</span>
                          <p className="text-[11px] text-muted">
                            {formatDate(run.payPeriodStart)} – {formatDate(run.payPeriodEnd)}
                          </p>
                        </td>
                        <td className="td font-medium tabular-nums">
                          {run.employeeCount} employee{run.employeeCount === 1 ? "" : "s"}
                        </td>
                        <td className="td tabular-nums text-xs font-medium">
                          {formatMoney(Number(run.totalGross))}
                        </td>
                        <td className="td tabular-nums text-xs font-medium text-rose-600 dark:text-rose-400">
                          −{formatMoney(Number(run.totalDeductions))}
                        </td>
                        <td className="td font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatMoney(Number(run.totalNet))}
                        </td>
                        <td className="td">
                          <span className="pill bg-emerald-50 text-emerald-700 ring-emerald-600/20 font-bold">
                            {run.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="td text-xs text-muted">
                          {run.processorName}
                          {run.processedAt && (
                            <p className="text-[10px]">
                              {formatDate(run.processedAt.toISOString().slice(0, 10))}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Compensation Directory */}
      {activeTab === "roll" && (
        <section className="card overflow-hidden shadow-xs">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Employee Compensation Roll</h2>
              <p className="text-xs text-muted">Active compensation structures configured by HR</p>
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
                            {formatMoney(Number(s.basic) + Number(s.hra) + Number(s.allowances) - Number(s.deductions), s.currency)}
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
      )}

      {/* Tab 3: Reports */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          {/* Department Salary Summary Report */}
          <section className="card overflow-hidden shadow-xs">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-foreground">Department-Wise Salary Cost Report</h2>
                <p className="text-xs text-muted">Aggregated payroll expenditure grouped by organizational department</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-muted/60">
                  <tr>
                    <th className="th">Department</th>
                    <th className="th">Staff</th>
                    <th className="th">Total Basic</th>
                    <th className="th">Total HRA</th>
                    <th className="th">Total Allowances</th>
                    <th className="th">Total Deductions</th>
                    <th className="th">Gross Cost</th>
                    <th className="th">Net Liability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {reports.salaryByDept.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-xs text-muted">
                        No processed payroll reports available yet. Process a monthly run to view department statistics.
                      </td>
                    </tr>
                  ) : (
                    reports.salaryByDept.map((dept) => (
                      <tr key={dept.department} className="hover:bg-surface-muted/30 transition-colors">
                        <td className="td font-bold text-foreground">{dept.department}</td>
                        <td className="td tabular-nums text-xs">{dept.employeeCount}</td>
                        <td className="td tabular-nums text-xs">{formatMoney(dept.totalBasic)}</td>
                        <td className="td tabular-nums text-xs">{formatMoney(dept.totalHra)}</td>
                        <td className="td tabular-nums text-xs">{formatMoney(dept.totalAllowances)}</td>
                        <td className="td tabular-nums text-xs text-rose-600 dark:text-rose-400">
                          −{formatMoney(dept.totalDeductions)}
                        </td>
                        <td className="td font-semibold tabular-nums text-xs">{formatMoney(dept.totalGross)}</td>
                        <td className="td font-bold tabular-nums text-xs text-emerald-600 dark:text-emerald-400">
                          {formatMoney(dept.totalNet)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Monthly Attendance Summary Report */}
          <section className="card overflow-hidden shadow-xs">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-foreground">Monthly Attendance & Leave Report</h2>
                <p className="text-xs text-muted">Individual attendance breakdown for the current period</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-muted/60">
                  <tr>
                    <th className="th">Team Member</th>
                    <th className="th">Department</th>
                    <th className="th">Present Days</th>
                    <th className="th">Half Days</th>
                    <th className="th">Leave Days</th>
                    <th className="th">Absences</th>
                    <th className="th">Effective Working Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {reports.attendanceSummary.map((emp) => (
                    <tr key={emp.employeeId} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="td font-bold text-foreground">
                        {emp.name}
                        <p className="text-[11px] font-normal text-muted">{emp.employeeCode}</p>
                      </td>
                      <td className="td text-xs text-muted">{emp.department}</td>
                      <td className="td tabular-nums text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {emp.presentDays}
                      </td>
                      <td className="td tabular-nums text-xs text-amber-600 dark:text-amber-400">
                        {emp.halfDays}
                      </td>
                      <td className="td tabular-nums text-xs text-blue-600 dark:text-blue-400">
                        {emp.leaveDays}
                      </td>
                      <td className="td tabular-nums text-xs text-rose-600 dark:text-rose-400">
                        {emp.absentDays}
                      </td>
                      <td className="td tabular-nums text-xs font-bold text-foreground">
                        {emp.totalWorkingDays} days
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Modals */}
      {showProcessModal && (
        <ProcessPayrollModal onClose={() => setShowProcessModal(false)} />
      )}

      {selectedPayslip && (
        <PayslipView payslip={selectedPayslip} onClose={() => setSelectedPayslip(null)} />
      )}
    </div>
  );
}
