"use client";

import { useActionState } from "react";
import { checkInAction, checkOutAction, type ActionResult } from "@/actions/attendance";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/Alert";
import { LiveClock } from "@/components/LiveClock";
import { IconClock, IconCheckCircle, IconBriefcase } from "@/components/Icons";

const initial: ActionResult = {};

export function CheckInOut({
  checkedInAt,
  checkedOutAt,
  onLeave,
}: {
  checkedInAt: string | null;
  checkedOutAt: string | null;
  onLeave: boolean;
}) {
  const [inState, checkIn] = useActionState(checkInAction, initial);
  const [outState, checkOut] = useActionState(checkOutAction, initial);
  const message = inState.error ?? outState.error ?? inState.ok ?? outState.ok;
  const isError = Boolean(inState.error ?? outState.error);

  const isCheckedIn = Boolean(checkedInAt);
  const isCheckedOut = Boolean(checkedOutAt);
  const isWorking = isCheckedIn && !isCheckedOut && !onLeave;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface-muted/60 p-4">
        {/* Status & Live Clock */}
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
            <IconClock size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Punch Clock
              </span>
              <LiveClock />
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              {onLeave ? (
                <span className="pill bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-950/40 dark:text-purple-300">
                  On Approved Leave
                </span>
              ) : isWorking ? (
                <span className="pill bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Currently Clocked In
                </span>
              ) : isCheckedOut ? (
                <span className="pill bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-300">
                  <IconCheckCircle size={12} />
                  Day Completed
                </span>
              ) : (
                <span className="pill bg-slate-100 text-slate-700 ring-slate-400/20 dark:bg-slate-800 dark:text-slate-300">
                  Not Clocked In Yet
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="flex items-center gap-6">
          <div className="text-right sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Check In</p>
            <p className="text-base font-bold tabular-nums text-foreground">
              {checkedInAt ? (
                <span className="text-emerald-600 dark:text-emerald-400">{checkedInAt}</span>
              ) : (
                <span className="text-muted/60">—</span>
              )}
            </p>
          </div>

          <div className="h-8 w-px bg-line" />

          <div className="text-right sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Check Out</p>
            <p className="text-base font-bold tabular-nums text-foreground">
              {checkedOutAt ? (
                <span className="text-blue-600 dark:text-blue-400">{checkedOutAt}</span>
              ) : (
                <span className="text-muted/60">—</span>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {onLeave ? (
              <span className="text-xs font-medium text-muted">Enjoy your time off</span>
            ) : !checkedInAt ? (
              <form action={checkIn}>
                <SubmitButton
                  pendingLabel="Clocking In…"
                  className="btn-primary shadow-md shadow-brand/20"
                >
                  <IconBriefcase size={16} />
                  <span>Clock In</span>
                </SubmitButton>
              </form>
            ) : !checkedOutAt ? (
              <form action={checkOut}>
                <SubmitButton
                  pendingLabel="Clocking Out…"
                  className="btn-secondary hover:border-brand/40"
                >
                  <IconClock size={16} />
                  <span>Clock Out</span>
                </SubmitButton>
              </form>
            ) : (
              <span className="text-xs font-semibold text-muted">Checked out for today</span>
            )}
          </div>
        </div>
      </div>

      {message ? <Alert tone={isError ? "error" : "success"}>{message}</Alert> : null}
    </div>
  );
}
