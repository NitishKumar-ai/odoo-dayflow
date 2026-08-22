"use client";

import { useActionState } from "react";
import {
  setAttendanceStatusAction,
  type ActionResult,
} from "@/actions/attendance";
import { SubmitButton } from "@/components/SubmitButton";
import { IconCheck } from "@/components/Icons";

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

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="employeeId" value={employeeId} />
      <input type="hidden" name="workDate" value={workDate} />

      <select
        name="status"
        defaultValue={status}
        className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-brand"
      >
        <option value="present">Present</option>
        <option value="absent">Absent</option>
        <option value="half_day">Half-day</option>
        <option value="leave">Leave</option>
      </select>

      <input
        name="note"
        defaultValue={note}
        placeholder="Override reason..."
        className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted/60 outline-none w-36 focus:border-brand"
      />

      <SubmitButton
        pendingLabel="Saving…"
        className="btn-secondary btn-sm text-xs font-bold"
      >
        <span>Set</span>
      </SubmitButton>

      {state.error ? (
        <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
          {state.error}
        </span>
      ) : null}

      {state.ok ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
          <IconCheck size={12} />
          <span>Saved</span>
        </span>
      ) : null}
    </form>
  );
}
