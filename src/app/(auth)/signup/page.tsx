"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type FormState } from "@/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/Alert";

const initial: FormState = {};

export default function SignUpPage() {
  const [state, action] = useActionState(signUpAction, initial);

  return (
    <div className="card p-6">
      <h1 className="text-lg font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-muted">
        You will get a verification email before you can sign in.
      </p>

      <form action={action} className="mt-5 space-y-4">
        {state.error ? <Alert>{state.error}</Alert> : null}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="firstName">First name</label>
            <input id="firstName" name="firstName" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="lastName">Last name</label>
            <input id="lastName" name="lastName" className="input" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="employeeCode">Employee ID</label>
          <input
            id="employeeCode"
            name="employeeCode"
            required
            className="input"
            placeholder="EMP1042"
          />
        </div>

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
            autoComplete="new-password"
            required
            className="input"
          />
          <p className="mt-1.5 text-xs text-muted">
            At least 10 characters, with upper and lower case, a number and a symbol.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="role">Role</label>
          <select id="role" name="role" className="input" defaultValue="employee">
            <option value="employee">Employee</option>
            <option value="admin">HR / Admin</option>
          </select>
        </div>

        <SubmitButton pendingLabel="Creating account…">Create account</SubmitButton>
      </form>

      <p className="mt-5 text-sm text-muted">
        Already registered?{" "}
        <Link href="/signin" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
