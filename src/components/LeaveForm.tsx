"use client";

import { useActionState } from "react";
import { applyLeaveAction, type ActionResult } from "@/actions/leave";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/Alert";
import { useFields } from "@/components/useFields";

const initial: ActionResult = {};

export function LeaveForm({ minDate }: { minDate: string }) {
  const [state, action] = useActionState(applyLeaveAction, initial);
  const { values, field } = useFields({
    leaveType: "paid",
    startDate: "",
    endDate: "",
    remarks: "",
  });

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">{state.ok}</Alert> : null}

      <div>
        <label className="label" htmlFor="leaveType">Leave type</label>
        <select {...field("leaveType")} className="input">
          <option value="paid">Paid leave</option>
          <option value="sick">Sick leave</option>
          <option value="unpaid">Unpaid leave</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="startDate">From</label>
          <input {...field("startDate")} type="date" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="endDate">To</label>
          <input
            {...field("endDate")}
            type="date"
            required
            min={values.startDate || minDate}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="remarks">Remarks</label>
        <textarea
          {...field("remarks")}
          rows={3}
          className="input"
          placeholder="Why you need the time off"
        />
      </div>

      <SubmitButton pendingLabel="Submitting…">Submit request</SubmitButton>
      <p className="text-xs text-muted">Weekends are not counted against your balance.</p>
    </form>
  );
}
