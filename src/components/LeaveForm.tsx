"use client";

import { useActionState, useState } from "react";
import { applyLeaveAction, type ActionResult } from "@/actions/leave";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/Alert";

const initial: ActionResult = {};

/**
 * Controlled inputs: React resets an uncontrolled form once its action settles,
 * which would wipe what the employee typed when validation rejects the request.
 */
export function LeaveForm({ minDate }: { minDate: string }) {
  const [state, action] = useActionState(applyLeaveAction, initial);
  const [values, setValues] = useState({
    leaveType: "paid",
    startDate: "",
    endDate: "",
    remarks: "",
  });

  function set<K extends keyof typeof values>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">{state.ok}</Alert> : null}

      <div>
        <label className="label" htmlFor="leaveType">Leave type</label>
        <select
          id="leaveType"
          name="leaveType"
          className="input"
          value={values.leaveType}
          onChange={(e) => set("leaveType", e.target.value)}
        >
          <option value="paid">Paid leave</option>
          <option value="sick">Sick leave</option>
          <option value="unpaid">Unpaid leave</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="startDate">From</label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            className="input"
            value={values.startDate}
            onChange={(e) => set("startDate", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="endDate">To</label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            min={values.startDate || minDate}
            className="input"
            value={values.endDate}
            onChange={(e) => set("endDate", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="remarks">Remarks</label>
        <textarea
          id="remarks"
          name="remarks"
          rows={3}
          className="input"
          placeholder="Why you need the time off"
          value={values.remarks}
          onChange={(e) => set("remarks", e.target.value)}
        />
      </div>

      <SubmitButton pendingLabel="Submitting…">Submit request</SubmitButton>
      <p className="text-xs text-muted">Weekends are not counted against your balance.</p>
    </form>
  );
}
