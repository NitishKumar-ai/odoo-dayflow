"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signUpAction, type FormState } from "@/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/Alert";
import {
  IconCheck,
  IconX,
  IconLock,
  IconMail,
  IconUser,
  IconBriefcase,
  IconArrowRight,
} from "@/components/Icons";

const initial: FormState = {};

export default function SignUpPage() {
  const [state, action] = useActionState(signUpAction, initial);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");

  // Password rules evaluation
  const rules = [
    { label: "At least 10 characters", pass: password.length >= 10 },
    { label: "Uppercase letter (A-Z)", pass: /[A-Z]/.test(password) },
    { label: "Lowercase letter (a-z)", pass: /[a-z]/.test(password) },
    { label: "At least one number (0-9)", pass: /[0-9]/.test(password) },
    { label: "Special symbol (!@#$%^&*)", pass: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="card p-6 sm:p-8 shadow-md">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Create account</h1>
        <p className="mt-1 text-sm text-muted">
          Join your organization on Dayflow to track attendance & leaves.
        </p>
      </div>

      <form action={action} className="mt-6 space-y-4">
        {state.error ? <Alert tone="error">{state.error}</Alert> : null}

        {/* First & Last Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="firstName">
              First name
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
                <IconUser size={15} />
              </div>
              <input
                id="firstName"
                name="firstName"
                required
                className="input pl-9"
                placeholder="Rohan"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="lastName">
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              className="input"
              placeholder="Mehta"
            />
          </div>
        </div>

        {/* Employee ID */}
        <div>
          <label className="label" htmlFor="employeeCode">
            Employee Code / Staff ID
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <IconBriefcase size={15} />
            </div>
            <input
              id="employeeCode"
              name="employeeCode"
              required
              className="input pl-9 uppercase font-mono text-xs tracking-wider"
              placeholder="EMP1088"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="label" htmlFor="email">
            Company Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <IconMail size={15} />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input pl-9"
              placeholder="you@company.com"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <IconLock size={15} />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-9"
              placeholder="••••••••••••"
            />
          </div>

          {/* Real-time Password Requirements */}
          <div className="mt-3 rounded-xl border border-line bg-surface-muted/50 p-3 text-xs">
            <p className="font-semibold text-muted mb-2">Password Requirements:</p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {rules.map((r) => (
                <div
                  key={r.label}
                  className={`flex items-center gap-1.5 ${
                    r.pass
                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                      : "text-muted"
                  }`}
                >
                  {r.pass ? (
                    <IconCheck size={13} className="shrink-0 text-emerald-600" />
                  ) : (
                    <IconX size={13} className="shrink-0 text-muted/60" />
                  )}
                  <span>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Role Selector */}
        <div>
          <label className="label" htmlFor="role">
            Organization Role
          </label>
          <select
            id="role"
            name="role"
            className="input font-medium"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="employee">Staff / Team Member (Standard Access)</option>
            <option value="admin">HR Manager / Administrator (Full Access)</option>
          </select>
          <p className="mt-1 text-[11px] text-muted">
            {role === "admin"
              ? "Admins can manage staff records, approvals, payroll structures, and company attendance."
              : "Standard employees can clock hours, apply for leaves, and view their payroll slips."}
          </p>
        </div>

        <SubmitButton
          pendingLabel="Creating Account…"
          className="btn-primary w-full shadow-md shadow-brand/20 mt-2"
        >
          <span>Complete Registration</span>
          <IconArrowRight size={16} />
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        Already have an account?{" "}
        <Link href="/signin" className="font-bold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
