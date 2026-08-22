import React from "react";
import { formatMoney, gross, net } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { IconPayroll, IconCheckCircle } from "@/components/Icons";
import type { SalaryStructure } from "@/db";

export function SalaryCard({
  salary,
  showHistoryNotice = true,
}: {
  salary: SalaryStructure;
  showHistoryNotice?: boolean;
}) {
  const grossAmount = gross(salary);
  const netAmount = net(salary);
  const basicNum = Number(salary.basic);
  const hraNum = Number(salary.hra);
  const allowancesNum = Number(salary.allowances);
  const deductionsNum = Number(salary.deductions);

  const basicPct = grossAmount > 0 ? Math.round((basicNum / grossAmount) * 100) : 0;
  const hraPct = grossAmount > 0 ? Math.round((hraNum / grossAmount) * 100) : 0;
  const allowancesPct = grossAmount > 0 ? Math.round((allowancesNum / grossAmount) * 100) : 0;

  return (
    <div className="card p-6 shadow-xs space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Net Monthly Compensation
          </span>
          <p className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatMoney(netAmount, salary.currency)}
            <span className="text-sm font-semibold text-muted"> / month</span>
          </p>
        </div>

        <div className="rounded-xl bg-surface-muted px-3 py-1.5 border border-line text-xs">
          <span className="text-muted">Effective from: </span>
          <strong className="text-foreground">{formatDate(salary.effectiveFrom)}</strong>
        </div>
      </div>

      {/* Visual Composition Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Gross Pay Composition</span>
          <span className="font-bold text-foreground">
            {formatMoney(grossAmount, salary.currency)} total gross
          </span>
        </div>

        <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            title={`Basic: ${basicPct}%`}
            style={{ width: `${basicPct}%` }}
            className="bg-brand transition-all"
          />
          <div
            title={`HRA: ${hraPct}%`}
            style={{ width: `${hraPct}%` }}
            className="bg-indigo-500 transition-all"
          />
          <div
            title={`Allowances: ${allowancesPct}%`}
            style={{ width: `${allowancesPct}%` }}
            className="bg-purple-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-4 text-[11px] text-muted pt-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand" />
            <span>Basic ({basicPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <span>HRA ({hraPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            <span>Allowances ({allowancesPct}%)</span>
          </div>
        </div>
      </div>

      {/* Itemized Breakdown Table */}
      <div className="rounded-xl border border-line bg-surface-muted/30 p-4 space-y-3 text-sm">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted font-medium">Basic Salary</span>
          <span className="tabular-nums font-bold text-foreground">
            {formatMoney(basicNum, salary.currency)}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted font-medium">House Rent Allowance (HRA)</span>
          <span className="tabular-nums font-bold text-foreground">
            {formatMoney(hraNum, salary.currency)}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted font-medium">Special & Other Allowances</span>
          <span className="tabular-nums font-bold text-foreground">
            {formatMoney(allowancesNum, salary.currency)}
          </span>
        </div>

        <div className="border-t border-line pt-2 flex justify-between items-center text-xs font-bold text-foreground">
          <span>Gross Earnings</span>
          <span className="tabular-nums text-brand">{formatMoney(grossAmount, salary.currency)}</span>
        </div>

        <div className="flex justify-between items-center text-xs text-rose-600 dark:text-rose-400 font-medium">
          <span>Standard Deductions (TDS / Tax)</span>
          <span className="tabular-nums">−{formatMoney(deductionsNum, salary.currency)}</span>
        </div>

        <div className="border-t border-line pt-2 flex justify-between items-center text-sm font-extrabold text-foreground">
          <span>Net Take-Home Pay</span>
          <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatMoney(netAmount, salary.currency)}
          </span>
        </div>
      </div>

      {showHistoryNotice && (
        <p className="text-[11px] text-muted flex items-center gap-1.5">
          <IconCheckCircle size={13} className="text-brand shrink-0" />
          <span>This structure is maintained by HR. Changes create a versioned revision trail.</span>
        </p>
      )}
    </div>
  );
}
