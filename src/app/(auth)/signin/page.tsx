"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signInAction, type FormState } from "@/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/Alert";
import { IconLock, IconMail, IconArrowRight } from "@/components/Icons";
import { useFields } from "@/components/useFields";

const initial: FormState = {};

export default function SignInPage() {
  const [state, action] = useActionState(signInAction, initial);
  const { field } = useFields({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="card p-6 sm:p-8 shadow-md">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">
          Sign in with your enterprise credentials to access Dayflow.
        </p>
      </div>

      <form action={action} className="mt-6 space-y-4">
        {state.error ? <Alert tone="error">{state.error}</Alert> : null}

        <div>
          <label className="label" htmlFor="email">
            Work Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <IconMail size={16} />
            </div>
            <input
              {...field("email")}
              type="email"
              autoComplete="email"
              required
              className="input pl-10"
              placeholder="you@company.com"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="-my-1 flex min-h-9 items-center rounded-lg px-2 py-1 text-xs font-semibold text-brand hover:bg-brand-soft hover:underline"
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <IconLock size={16} />
            </div>
            <input
              {...field("password")}
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              required
              className="input pl-10"
              placeholder="••••••••••••"
            />
          </div>
        </div>

        <SubmitButton
          pendingLabel="Authenticating…"
          className="btn-primary w-full shadow-md shadow-brand/20"
        >
          <span>Sign In to Dayflow</span>
          <IconArrowRight size={16} />
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        Don&apos;t have an account yet?{" "}
        <Link href="/signup" className="font-bold text-brand hover:underline">
          Create company account
        </Link>
      </p>
    </div>
  );
}
