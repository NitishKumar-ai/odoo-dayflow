"use client";

import { useActionState } from "react";
import { decideLeaveAction, type ActionResult } from "@/actions/leave";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/Alert";

const initial: ActionResult = {};

export function DecideLeave({ requestId }: { requestId: string }) {
  const [state, action] = useActionState(decideLeaveAction, initial);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="requestId" value={requestId} />

      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">{state.ok}</Alert> : null}

      <input
        name="comment"
        className="input"
        placeholder="Comment for the employee (optional)"
      />

      {/* The clicked button supplies `decision` in the form data. */}
      <div className="flex gap-2">
        <SubmitButton name="decision" value="approved" pendingLabel="Saving…">
          Approve
        </SubmitButton>
        <SubmitButton
          name="decision"
          value="rejected"
          pendingLabel="Saving…"
          className="btn-danger"
        >
          Reject
        </SubmitButton>
      </div>
    </form>
  );
}
