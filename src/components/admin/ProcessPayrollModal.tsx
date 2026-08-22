"use client";

import { useState } from "react";
import { processPayrollRunAction } from "@/actions/payroll";
import { IconPayroll, IconX, IconAlertCircle, IconCheck } from "@/components/Icons";

export type ProcessPayrollModalProps = {
  onClose: () => void;
};

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export function ProcessPayrollModal({ onClose }: ProcessPayrollModalProps) {
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isPending, setIsPending] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData();
    formData.append("year", year.toString());
    formData.append("month", month.toString());

    try {
      const res = await processPayrollRunAction(formData);
      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch {
      setError("An error occurred while processing payroll.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="card max-w-md w-full bg-surface border border-line shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2 text-brand font-bold">
            <IconPayroll size={20} />
            <span>Process Monthly Payroll Run</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary btn-sm p-1.5"
            title="Close"
          >
            <IconX size={16} />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
              <IconCheck size={28} />
            </div>
            <h3 className="font-extrabold text-foreground text-lg">Payroll Executed!</h3>
            <p className="text-xs text-muted">
              Monthly payslips have been generated for all active employees.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <IconAlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Select Year</label>
              <input
                type="number"
                min={2000}
                max={2100}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="input w-full"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Select Pay Period Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="input w-full"
                required
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label} ({m.value})
                  </option>
                ))}
              </select>
            </div>

            <p className="text-[11px] text-muted leading-relaxed">
              Executing a payroll run takes a snapshot of all active employee salary structures and generates permanent, immutable payslip records for the period.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary btn-sm text-xs font-bold"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary btn-sm text-xs font-bold gap-1.5"
                disabled={isPending}
              >
                {isPending ? "Processing..." : "Run Payroll Now"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
