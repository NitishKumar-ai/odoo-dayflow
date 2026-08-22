"use client";

import Link from "next/link";
import { useActionState, useState, useCallback, Suspense } from "react";
import { signInAction, type FormState } from "@/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/Alert";
import { DemoLoginHelper } from "@/components/DemoLoginHelper";
import { IconLock, IconMail, IconArrowRight } from "@/components/Icons";

const initial: FormState = {};

function SignInForm() {
  const [state, action] = useActionState(signInAction, initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleDemoSelect = useCallback((e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  }, []);

  return (
    <div className="card p-6 sm:p-8 shadow-md">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">
          Sign in with your enterprise credentials to access Dayflow.
        </p>
      </div>

      <div className="my-5 border-t border-line" />

      {/* Demo Credentials Quick Fill */}
      <div className="mb-5">
        <DemoLoginHelper onSelect={handleDemoSelect} />
      </div>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface px-2 text-muted font-semibold tracking-wider">
            Or enter credentials
          </span>
        </div>
      </div>

      <form action={action} className="mt-4 space-y-4">
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
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              className="text-[11px] font-semibold text-brand hover:underline"
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <IconLock size={16} />
            </div>
            <input
              id="password"
              name="password"
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="card p-8 text-center text-muted">Loading sign in…</div>}>
      <SignInForm />
    </Suspense>
  );
}
