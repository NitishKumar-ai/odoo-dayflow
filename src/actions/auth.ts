"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { eq, and, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  users,
  employees,
  emailVerificationTokens,
  leaveBalances,
} from "@/db";
import {
  hashPassword,
  verifyPassword,
  passwordProblems,
  createSession,
  destroySession,
} from "@/lib/auth";
import { DEFAULT_ENTITLEMENT } from "@/lib/leave";

export type FormState = { error?: string; ok?: string };

const signUpSchema = z.object({
  employeeCode: z.string().trim().min(2, "Employee ID is required").max(32),
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().max(60).default(""),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string(),
  role: z.enum(["employee", "admin"]),
});

const TOKEN_TTL_HOURS = 24;

export async function signUpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    employeeCode: formData.get("employeeCode"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName") ?? "",
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details" };
  }
  const data = parsed.data;

  const pwProblems = passwordProblems(data.password);
  if (pwProblems.length) {
    return { error: `Password must ${pwProblems.join(", ")}.` };
  }

  const existing = await db
    .select({ id: users.id, email: users.email, code: users.employeeCode })
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);
  if (existing.length) return { error: "An account with that email already exists." };

  const codeTaken = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.employeeCode, data.employeeCode))
    .limit(1);
  if (codeTaken.length) return { error: "That Employee ID is already registered." };

  const token = randomBytes(32).toString("hex");
  const year = new Date().getFullYear();

  await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        employeeCode: data.employeeCode,
        email: data.email,
        passwordHash: await hashPassword(data.password),
        role: data.role,
      })
      .returning({ id: users.id });

    const [employee] = await tx
      .insert(employees)
      .values({
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
      })
      .returning({ id: employees.id });

    await tx.insert(leaveBalances).values([
      { employeeId: employee.id, year, leaveType: "paid", entitledDays: DEFAULT_ENTITLEMENT.paid },
      { employeeId: employee.id, year, leaveType: "sick", entitledDays: DEFAULT_ENTITLEMENT.sick },
    ]);

    await tx.insert(emailVerificationTokens).values({
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + TOKEN_TTL_HOURS * 3600_000),
    });
  });

  const link = `${process.env.APP_URL ?? ""}/verify-email?token=${token}`;
  // No mail service is wired up yet; the link is emitted here so signup is testable.
  console.log(`[dayflow] verification link for ${data.email}: ${link}`);

  const params = new URLSearchParams({ sent: data.email });
  if (process.env.NODE_ENV !== "production") params.set("devToken", token);
  redirect(`/verify-email?${params.toString()}`);
}

export async function verifyEmailAction(token: string): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const [row] = await db
    .select({ userId: emailVerificationTokens.userId })
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.token, token),
        isNull(emailVerificationTokens.usedAt),
        gt(emailVerificationTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row) return { ok: false, error: "That verification link is invalid or has expired." };

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(users.id, row.userId));
    await tx
      .update(emailVerificationTokens)
      .set({ usedAt: new Date() })
      .where(eq(emailVerificationTokens.token, token));
  });

  return { ok: true };
}

export async function signInAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };

  const [user] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
      emailVerifiedAt: users.emailVerifiedAt,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Same message either way, so the form does not confirm which emails exist.
  const invalid = { error: "Incorrect email or password." };
  if (!user) return invalid;
  if (!(await verifyPassword(password, user.passwordHash))) return invalid;
  if (!user.isActive) return { error: "This account has been deactivated. Contact HR." };
  if (!user.emailVerifiedAt) {
    return { error: "Verify your email address before signing in." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function signOutAction() {
  await destroySession();
  redirect("/signin");
}
