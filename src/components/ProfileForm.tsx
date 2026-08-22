"use client";

import { useActionState } from "react";
import { updateOwnProfileAction, type ActionResult } from "@/actions/profile";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/Alert";
import { useFields } from "@/components/useFields";

const initial: ActionResult = {};

export function ProfileForm({
  phone,
  address,
  photoUrl,
}: {
  phone: string;
  address: string;
  photoUrl: string;
}) {
  const [state, action] = useActionState(updateOwnProfileAction, initial);
  const { field } = useFields({ phone, address, photoUrl });

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">{state.ok}</Alert> : null}

      <div>
        <label className="label" htmlFor="phone">Phone</label>
        <input {...field("phone")} className="input" />
      </div>

      <div>
        <label className="label" htmlFor="address">Address</label>
        <textarea {...field("address")} rows={3} className="input" />
      </div>

      <div>
        <label className="label" htmlFor="photoUrl">Profile picture URL</label>
        <input {...field("photoUrl")} className="input" placeholder="https://…" />
      </div>

      <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
      <p className="text-xs text-muted">
        Job details and salary are maintained by HR. Ask them for changes to those.
      </p>
    </form>
  );
}
