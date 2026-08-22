"use client";

import { useActionState } from "react";
import {
  setAttendanceStatusAction,
  type ActionResult,
} from "@/actions/attendance";
import { SubmitButton } from "@/components/SubmitButton";
import { useFields } from "@/components/useFields";

const initial: ActionResult = {};

export function AttendanceOverride({
  employeeId,
  workDate,
  status,
  note,
}: {
  employeeId: string;
  workDate: string;
  status: string;
  note: string;
}) {
  const [state, action] = useActionState(setAttendanceStatusAction, initial);
  // Many of these render per page, so ids must be unique per row.
  const rowId = `${employeeId}-${workDate}`;
  const { field } = useFields({ status, note }, rowId);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="employeeId" value={employeeId} />
      <input type="hidden" name="workDate" value={workDate} />
      <label className="sr-only" htmlFor={`${rowId}-status`}>Status</label>
      <select {...field("status")} className="input w-auto py-1.5 text-xs">
        <option value="present">Present</option>
        <option value="absent">Absent</option>
        <option value="half_day">Half-day</option>
        <option value="leave">Leave</option>
      </select>
      <label className="sr-only" htmlFor={`${rowId}-note`}>Note</label>
      <input
        {...field("note")}
        placeholder="Note"
        className="input w-40 py-1.5 text-xs"
      />
      <SubmitButton pendingLabel="…" className="btn-secondary px-3 py-1.5 text-xs">
        Save
      </SubmitButton>
      {state.error ? <span className="text-xs text-rose-600">{state.error}</span> : null}
      {state.ok ? <span className="text-xs text-emerald-600">Saved</span> : null}
    </form>
  );
}
