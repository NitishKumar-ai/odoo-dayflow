"use client";

import { useActionState } from "react";
import { cancelLeaveAction, type ActionResult } from "@/actions/leave";
import { SubmitButton } from "@/components/SubmitButton";
import { IconX } from "@/components/Icons";

const initial: ActionResult = {};

export function WithdrawLeave({ requestId }: { requestId: string }) {
  const [state, action] = useActionState(cancelLeaveAction, initial);

  return (
    <form action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      <SubmitButton
        pendingLabel="Withdrawing…"
        className="btn-danger btn-sm text-xs font-semibold"
      >
        <IconX size={14} />
        <span>Withdraw</span>
      </SubmitButton>
      {state.error ? (
        <span className="text-xs font-medium text-rose-600 dark:text-rose-400">{state.error}</span>
      ) : null}
    </form>
  );
}
