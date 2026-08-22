"use client";

import { useActionState, useState } from "react";
import { updateSalaryAction, type ActionResult } from "@/actions/profile";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/Alert";
import { IconSparkles } from "@/components/Icons";

const initial: ActionResult = {};

export function SalaryForm({
  employeeId,
  defaults,
}: {
  employeeId: string;
  defaults: {
    effectiveFrom: string;
    currency: string;
    basic: string;
    hra: string;
    allowances: string;
    deductions: string;
  };
}) {
  const [state, action] = useActionState(updateSalaryAction, initial);
  const [form, setForm] = useState(defaults);

  function set<K extends keyof typeof defaults>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const basicNum = Number(form.basic) || 0;
  const hraNum = Number(form.hra) || 0;
  const allowancesNum = Number(form.allowances) || 0;
  const deductionsNum = Number(form.deductions) || 0;

  const liveGross = basicNum + hraNum + allowancesNum;
  const liveNet = Math.max(0, liveGross - deductionsNum);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="employeeId" value={employeeId} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">{state.ok}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="effectiveFrom">
            Effective From
          </label>
          <input
            id="effectiveFrom"
            name="effectiveFrom"
            type="date"
            className="input"
            required
            value={form.effectiveFrom}
            onChange={(e) => set("effectiveFrom", e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="currency">
            Currency (ISO Code)
          </label>
          <input
            id="currency"
            name="currency"
            maxLength={3}
            className="input uppercase font-mono font-bold"
            value={form.currency}
            onChange={(e) => set("currency", e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="basic">
            Basic Monthly Salary
          </label>
          <input
            id="basic"
            name="basic"
            type="number"
            min="0"
            step="1"
            className="input tabular-nums font-semibold"
            value={form.basic}
            onChange={(e) => set("basic", e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="hra">
            House Rent Allowance (HRA)
          </label>
          <input
            id="hra"
            name="hra"
            type="number"
            min="0"
            step="1"
            className="input tabular-nums font-semibold"
            value={form.hra}
            onChange={(e) => set("hra", e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="allowances">
            Other / Special Allowances
          </label>
          <input
            id="allowances"
            name="allowances"
            type="number"
            min="0"
            step="1"
            className="input tabular-nums font-semibold"
            value={form.allowances}
            onChange={(e) => set("allowances", e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="deductions">
            Standard Deductions (TDS / Tax)
          </label>
          <input
            id="deductions"
            name="deductions"
            type="number"
            min="0"
            step="1"
            className="input tabular-nums font-semibold text-rose-600 dark:text-rose-400"
            value={form.deductions}
            onChange={(e) => set("deductions", e.target.value)}
          />
        </div>
      </div>

      {/* Real-time Computed Compensation Summary Preview */}
      <div className="rounded-xl border border-line bg-surface-muted/50 p-4 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted font-medium">Computed Gross Earnings:</span>
          <span className="font-bold tabular-nums text-foreground">
            {form.currency} {liveGross.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted font-medium">Estimated Deductions:</span>
          <span className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">
            −{form.currency} {deductionsNum.toLocaleString()}
          </span>
        </div>
        <div className="border-t border-line pt-2 flex justify-between items-center text-sm font-extrabold text-foreground">
          <span>Net Take-Home Pay:</span>
          <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
            {form.currency} {liveNet.toLocaleString()} / mo
          </span>
        </div>
      </div>

      <SubmitButton pendingLabel="Recording Structure…" className="btn-primary w-full">
        <IconSparkles size={16} />
        <span>Save Salary Structure Revision</span>
      </SubmitButton>

      <p className="text-[11px] text-muted text-center">
        Saving records a new timestamped revision. Previous compensation history is preserved.
      </p>
    </form>
  );
}
