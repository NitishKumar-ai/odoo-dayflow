"use client";

import { useActionState } from "react";
import { decideLeaveAction, type ActionResult } from "@/actions/leave";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/Alert";
import { IconCheck, IconX } from "@/components/Icons";

const initial: ActionResult = {};

export function DecideLeave({ requestId }: { requestId: string }) {
  const [state, action] = useActionState(decideLeaveAction, initial);

  return (
    <form action={action} className="space-y-2.5">
      <input type="hidden" name="requestId" value={requestId} />

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">{state.ok}</Alert> : null}

      <div>
        <input
          name="comment"
          className="input text-xs py-2"
          placeholder="Optional note for employee (e.g. Approved, enjoy!)..."
        />
      </div>

      <div className="flex items-center gap-2">
        <SubmitButton
          name="decision"
          value="approved"
          pendingLabel="Approving…"
          className="btn-primary btn-sm flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 font-bold"
        >
          <IconCheck size={14} />
          <span>Approve</span>
        </SubmitButton>

        <SubmitButton
          name="decision"
          value="rejected"
          pendingLabel="Rejecting…"
          className="btn-danger btn-sm flex-1 text-xs font-bold"
        >
          <IconX size={14} />
          <span>Reject</span>
        </SubmitButton>
      </div>
    </form>
  );
}
