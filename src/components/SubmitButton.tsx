"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingLabel,
  className = "btn-primary",
  ...props
}: React.ComponentProps<"button"> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button {...props} type="submit" disabled={pending} className={className}>
      {pending ? (pendingLabel ?? "Working…") : children}
    </button>
  );
}
