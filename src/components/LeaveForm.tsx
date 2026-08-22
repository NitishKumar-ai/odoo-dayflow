"use client";

import { useActionState, useState, useMemo } from "react";
import { applyLeaveAction, type ActionResult } from "@/actions/leave";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/Alert";
import { IconLeave, IconBriefcase, IconSparkles } from "@/components/Icons";
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
  const [values, setValues] = useState({
    leaveType: "paid",
    startDate: "",
    endDate: "",
    remarks: "",
  });

  function set<K extends keyof typeof values>(key: K, value: string) {
    setValues((v) => {
      const next = { ...v, [key]: value };
      // If start date is moved past end date, align end date
      if (key === "startDate" && next.endDate && next.endDate < value) {
        next.endDate = value;
      }
      return next;
    });
  }

  // Calculate working days excluding weekends
  const calculatedDays = useMemo(() => {
    if (!values.startDate || !values.endDate) return 0;
    if (values.endDate < values.startDate) return 0;
    return countLeaveDays(values.startDate, values.endDate);
  }, [values.startDate, values.endDate]);

  const selectedBalance = balances.find((b) => b.leaveType === values.leaveType);
  const isOverBalance =
    values.leaveType !== "unpaid" &&
    selectedBalance &&
    calculatedDays > selectedBalance.left;

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">{state.ok}</Alert> : null}

      {/* Leave Type Select */}
      <div>
        <label className="label" htmlFor="leaveType">
          Leave Category
        </label>
        <div className="relative">
          <select
            id="leaveType"
            name="leaveType"
            className="input font-medium"
            value={values.leaveType}
            onChange={(e) => set("leaveType", e.target.value)}
          >
            <option value="paid">Paid Annual Leave</option>
            <option value="sick">Sick / Medical Leave</option>
            <option value="unpaid">Unpaid Leave of Absence</option>
          </select>
        </div>
      </div>

      {/* Date Range Selection */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="startDate">
            From (Start Date)
          </label>
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
          <label className="label" htmlFor="endDate">
            To (End Date)
          </label>
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

      {/* Live Calculated Days Badge */}
      {calculatedDays > 0 && (
        <div
          className={`flex items-center justify-between rounded-xl border p-3 text-xs ${
            isOverBalance
              ? "border-rose-200 bg-rose-50/80 text-rose-800 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-200"
              : "border-blue-200 bg-blue-50/80 text-blue-900 dark:border-blue-800/40 dark:bg-blue-950/40 dark:text-blue-200"
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold">
            <IconLeave size={14} />
            <span>
              Requesting {calculatedDays} working day{calculatedDays === 1 ? "" : "s"}
            </span>
          </div>
          <span className="font-semibold">
            {isOverBalance ? "⚠️ Exceeds quota!" : "Excludes weekends"}
          </span>
        </div>
      )}

      {/* Remarks */}
      <div>
        <label className="label" htmlFor="remarks">
          Reason / Remarks (Optional)
        </label>
        <textarea
          id="remarks"
          name="remarks"
          rows={3}
          className="input"
          placeholder="Please explain the reason for your time off request..."
          value={values.remarks}
          onChange={(e) => set("remarks", e.target.value)}
        />
      </div>

      <SubmitButton
        pendingLabel="Submitting Request…"
        className="btn-primary w-full shadow-md shadow-brand/20"
      >
        <IconSparkles size={16} />
        <span>Submit Leave Application</span>
      </SubmitButton>
    </form>
  );
}
