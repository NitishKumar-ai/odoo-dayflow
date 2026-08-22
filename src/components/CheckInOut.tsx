"use client";

import { useActionState } from "react";
import { checkInAction, checkOutAction, type ActionResult } from "@/actions/attendance";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/Alert";

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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Check-in</p>
          <p className="text-lg font-semibold tabular-nums">{checkedInAt ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Check-out</p>
          <p className="text-lg font-semibold tabular-nums">{checkedOutAt ?? "—"}</p>
        </div>

        <div className="ml-auto flex gap-2">
          {onLeave ? (
            <span className="text-sm text-muted">On approved leave today</span>
          ) : !checkedInAt ? (
            <form action={checkIn}>
              <SubmitButton pendingLabel="Checking in…">Check in</SubmitButton>
            </form>
          ) : !checkedOutAt ? (
            <form action={checkOut}>
              <SubmitButton pendingLabel="Checking out…" className="btn-secondary">
                Check out
              </SubmitButton>
            </form>
          ) : (
            <span className="text-sm text-muted">Day complete</span>
          )}
        </div>
      </div>

      {message ? <Alert tone={isError ? "error" : "success"}>{message}</Alert> : null}
    </div>
  );
}
