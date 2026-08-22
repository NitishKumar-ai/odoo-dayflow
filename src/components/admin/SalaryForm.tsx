"use client";

import { useActionState } from "react";
import { updateSalaryAction, type ActionResult } from "@/actions/profile";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/Alert";
import { useFields } from "@/components/useFields";

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
  const { field } = useFields(defaults);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="employeeId" value={employeeId} />
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">{state.ok}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="effectiveFrom">Effective from</label>
          <input {...field("effectiveFrom")} type="date" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="currency">Currency</label>
          <input {...field("currency")} maxLength={3} className="input uppercase" />
        </div>
        <div>
          <label className="label" htmlFor="basic">Basic</label>
          <input {...field("basic")} type="number" min="0" step="1" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="hra">HRA</label>
          <input {...field("hra")} type="number" min="0" step="1" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="allowances">Allowances</label>
          <input {...field("allowances")} type="number" min="0" step="1" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="deductions">Deductions</label>
          <input {...field("deductions")} type="number" min="0" step="1" className="input" />
        </div>
      </div>

      <SubmitButton pendingLabel="Saving…">Save salary structure</SubmitButton>
      <p className="text-xs text-muted">
        Saving records a new revision from the effective date. Earlier revisions are kept.
      </p>
    </form>
  );
}
