"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, type FormState } from "@/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/Alert";

const initial: FormState = {};

export default function SignInPage() {
  const [state, action] = useActionState(signInAction, initial);

  return (
    <div className="card p-6">
      <h1 className="text-lg font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-muted">Use your work email address.</p>

      <form action={action} className="mt-5 space-y-4">
        {state.error ? <Alert>{state.error}</Alert> : null}

        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input"
            placeholder="••••••••••"
          />
        </div>

        <SubmitButton pendingLabel="Signing in…">
          <span className="w-full">Sign in</span>
        </SubmitButton>
      </form>

      <p className="mt-5 text-sm text-muted">
        No account yet?{" "}
        <Link href="/signup" className="font-medium text-brand hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
