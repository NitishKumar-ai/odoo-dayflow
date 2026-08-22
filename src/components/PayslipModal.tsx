"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { IconFileText, IconPrinter, IconX } from "@/components/Icons";

export type PayslipModalProps = {
  payslip: {
    id: string;
    year: number;
    month: number;
    basic: string;
    hra: string;
    allowances: string;
    deductions: string;
    gross: string;
    net: string;
    currency: string;
    createdAt: Date;
    firstName: string;
    lastName: string;
    employeeCode: string;
    department: string;
    jobTitle: string;
    dateOfJoining?: string | null;
    runStart?: string;
    runEnd?: string;
  };
  onClose?: () => void;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function PayslipView({ payslip, onClose }: PayslipModalProps) {
  const monthName = MONTH_NAMES[payslip.month - 1] || `Month ${payslip.month}`;
  const fullName = `${payslip.firstName} ${payslip.lastName}`.trim();
  const basicNum = Number(payslip.basic);
  const hraNum = Number(payslip.hra);
  const allowancesNum = Number(payslip.allowances);
  const deductionsNum = Number(payslip.deductions);
  const grossNum = Number(payslip.gross);
  const netNum = Number(payslip.net);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="card max-w-2xl w-full bg-surface border border-line shadow-2xl p-6 sm:p-8 space-y-6 print:shadow-none print:border-none print:w-full">
        {/* Modal Actions Bar (Hidden on Print) */}
        <div className="flex items-center justify-between border-b border-line pb-4 print:hidden">
          <div className="flex items-center gap-2 text-brand font-bold text-sm">
            <IconFileText size={18} />
            <span>Official Payslip — {monthName} {payslip.year}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary btn-sm text-xs font-bold gap-1.5"
            >
              <IconPrinter size={14} />
              <span>Print / Download PDF</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary btn-sm p-1.5"
                title="Close"
              >
                <IconX size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Payslip Card Content */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-line pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                DAYFLOW HRMS
              </h2>
              <p className="text-xs text-muted font-medium">Monthly Salary Statement & Earnings Advice</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="pill bg-brand-soft text-brand font-extrabold text-xs">
                {monthName.toUpperCase()} {payslip.year}
              </span>
              <p className="text-[11px] text-muted mt-1">
                Generated on {formatDate(payslip.createdAt.toISOString().slice(0, 10))}
              </p>
            </div>
          </div>

          {/* Employee & Pay Period Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-muted/40 text-xs">
            <div>
              <p className="text-muted font-medium">Employee Name</p>
              <p className="font-bold text-foreground text-sm">{fullName}</p>
            </div>
            <div>
              <p className="text-muted font-medium">Employee Code</p>
              <p className="font-bold text-foreground">{payslip.employeeCode}</p>
            </div>
            <div>
              <p className="text-muted font-medium">Department</p>
              <p className="font-bold text-foreground">{payslip.department || "General"}</p>
            </div>
            <div>
              <p className="text-muted font-medium">Job Title</p>
              <p className="font-bold text-foreground">{payslip.jobTitle || "—"}</p>
            </div>
          </div>

          {/* Itemized Breakdown Table */}
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Earnings */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Earnings Breakdown
              </h3>
              <div className="border border-line rounded-lg overflow-hidden text-xs">
                <div className="flex justify-between p-2.5 bg-surface-muted/30">
                  <span className="text-muted">Basic Salary</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatMoney(basicNum, payslip.currency)}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 border-t border-line">
                  <span className="text-muted">House Rent Allowance (HRA)</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatMoney(hraNum, payslip.currency)}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 border-t border-line">
                  <span className="text-muted">Special Allowances</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatMoney(allowancesNum, payslip.currency)}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 border-t border-line font-bold bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
                  <span>Gross Monthly Earnings</span>
                  <span className="tabular-nums">{formatMoney(grossNum, payslip.currency)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Deductions Breakdown
              </h3>
              <div className="border border-line rounded-lg overflow-hidden text-xs">
                <div className="flex justify-between p-2.5 bg-surface-muted/30">
                  <span className="text-muted">Statutory Tax & Deductions</span>
                  <span className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                    {formatMoney(deductionsNum, payslip.currency)}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 border-t border-line text-muted">
                  <span>Other Adjustments</span>
                  <span>—</span>
                </div>
                <div className="flex justify-between p-2.5 border-t border-line text-muted">
                  <span>Unpaid Leave Deductions</span>
                  <span>—</span>
                </div>
                <div className="flex justify-between p-2.5 border-t border-line font-bold bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400">
                  <span>Total Deductions</span>
                  <span className="tabular-nums">−{formatMoney(deductionsNum, payslip.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Take Home Banner */}
          <div className="p-4 rounded-xl bg-linear-to-r from-brand/10 via-emerald-500/10 to-brand/10 border border-brand/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider">Net Take-Home Pay</p>
              <p className="text-xs text-muted">Direct bank disbursement for {monthName} {payslip.year}</p>
            </div>
            <span className="text-2xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatMoney(netNum, payslip.currency)}
            </span>
          </div>

          {/* Footer note */}
          <p className="text-[10px] text-muted text-center italic pt-2 border-t border-line">
            This is a computer-generated salary statement from Dayflow HRMS and requires no physical signature.
          </p>
        </div>
      </div>
    </div>
  );
}
