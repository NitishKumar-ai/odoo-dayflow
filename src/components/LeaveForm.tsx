"use client";

import { useActionState, useMemo } from "react";
import { applyLeaveAction, type ActionResult } from "@/actions/leave";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/Alert";
import { IconLeave, IconSparkles } from "@/components/Icons";
import { useFields } from "@/components/useFields";
import { countLeaveDays } from "@/lib/leave";

const initial: ActionResult = {};

export function LeaveForm({
  minDate,
  balances = [],
}: {
  minDate: string;
  balances?: { leaveType: string; left: number; entitled: number }[];
}) {
  const [state, action] = useActionState(applyLeaveAction, initial);
  const { values, field, setValues } = useFields({
    leaveType: "paid",
    startDate: "",
    endDate: "",
    remarks: "",
  });

  const startDateField = field("startDate");
  const calculatedDays = useMemo(() => {
    if (!values.startDate || !values.endDate) return 0;
    if (values.endDate < values.startDate) return 0;
    return countLeaveDays(values.startDate, values.endDate);
  }, [values.startDate, values.endDate]);

  const selectedBalance = balances.find((balance) => balance.leaveType === values.leaveType);
  const isOverBalance =
    values.leaveType !== "unpaid" &&
    selectedBalance !== undefined &&
    calculatedDays > selectedBalance.left;

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">{state.ok}</Alert> : null}

      <div>
        <label className="label" htmlFor="leaveType">Leave type</label>
        <select {...field("leaveType")} className="input font-medium">
          <option value="paid">Paid Annual Leave</option>
          <option value="sick">Sick / Medical Leave</option>
          <option value="unpaid">Unpaid Leave of Absence</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="startDate">From</label>
          <input
            {...startDateField}
            type="date"
            required
            min={minDate}
            className="input"
            onChange={(event) => {
              startDateField.onChange(event);
              const startDate = event.target.value;
              if (values.endDate && values.endDate < startDate) {
                setValues((current) => ({ ...current, endDate: startDate }));
              }
            }}
          />
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

      {calculatedDays > 0 ? (
        <div
          className={`flex items-center justify-between rounded-xl border p-3 text-xs ${
            isOverBalance
              ? "border-rose-200 bg-rose-50/80 text-rose-800 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-200"
              : "border-blue-200 bg-blue-50/80 text-blue-900 dark:border-blue-800/40 dark:bg-blue-950/40 dark:text-blue-200"
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold">
            <IconLeave size={14} />
            <span>Requesting {calculatedDays} working day{calculatedDays === 1 ? "" : "s"}</span>
          </div>
          <span className="font-semibold">
            {isOverBalance ? "Exceeds quota" : "Excludes weekends"}
          </span>
        </div>
      ) : null}

      <div>
        <label className="label" htmlFor="remarks">Reason / Remarks (Optional)</label>
        <textarea
          {...field("remarks")}
          rows={3}
          className="input"
          placeholder="Please explain the reason for your time off request..."
        />
      </div>

      <SubmitButton
        pendingLabel="Submitting Request…"
        className="btn-primary w-full shadow-md shadow-brand/20"
      >
        <IconSparkles size={16} />
        <span>Submit request</span>
      </SubmitButton>
    </form>
  );
}
