"use client";

import { useActionState } from "react";
import { cancelLeaveAction, type ActionResult } from "@/actions/leave";
import { SubmitButton } from "@/components/SubmitButton";

const initial: ActionResult = {};

export function WithdrawLeave({ requestId }: { requestId: string }) {
  const [state, action] = useActionState(cancelLeaveAction, initial);
  return (
    <form action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      <SubmitButton pendingLabel="Withdrawing…" className="btn-danger">
        Withdraw
      </SubmitButton>
      {state.error ? <span className="text-xs text-rose-600">{state.error}</span> : null}
    </form>
  );
}
