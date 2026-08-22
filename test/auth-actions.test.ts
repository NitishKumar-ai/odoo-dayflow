// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { eq } from "drizzle-orm";
import { resetDb, seedEmployee } from "./helpers/db";
import { db } from "@/db";
import { users, employees, emailVerificationTokens, leaveBalances } from "@/db/schema";
import { hashPassword } from "@/lib/auth";

/**
 * signUpAction and signInAction end in redirect(), which throws a Next control
 * flow error. Capture the destination instead of letting it escape.
 */
const redirected: string[] = [];
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirected.push(url);
    const err = new Error(`NEXT_REDIRECT:${url}`);
    (err as { digest?: string }).digest = `NEXT_REDIRECT;${url}`;
    throw err;
  },
}));

const setCookie = vi.fn();
const deleteCookie = vi.fn();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    set: setCookie,
    delete: deleteCookie,
  }),
}));

const { signUpAction, signInAction, verifyEmailAction, signOutAction } =
  await import("@/actions/auth");

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const GOOD_PASSWORD = "Dayflow#2026";

function signUpForm(over: Record<string, string> = {}) {
  return form({
    employeeCode: "EMP900",
    firstName: "Nadia",
    lastName: "Rahman",
    email: "Nadia@Dayflow.test",
    password: GOOD_PASSWORD,
    role: "employee",
    ...over,
  });
}

/** Runs an action that is expected to redirect, and returns where it went. */
async function expectRedirect(fn: () => Promise<unknown>) {
  redirected.length = 0;
  await expect(fn()).rejects.toThrow(/NEXT_REDIRECT/);
  return redirected.at(-1)!;
}

beforeEach(async () => {
  await resetDb();
  redirected.length = 0;
  setCookie.mockReset();
  deleteCookie.mockReset();
});

describe("signUpAction", () => {
  it("creates an unverified user with a profile, balances, and a token", async () => {
    const url = await expectRedirect(() => signUpAction({}, signUpForm()));
    expect(url).toMatch(/^\/verify-email\?/);

    const [user] = await db.select().from(users);
    expect(user.email).toBe("nadia@dayflow.test"); // normalised to lower case
    expect(user.emailVerifiedAt).toBeNull();
    expect(user.passwordHash).not.toBe(GOOD_PASSWORD); // never stored in the clear

    expect(await db.select().from(employees)).toHaveLength(1);
    expect(await db.select().from(leaveBalances)).toHaveLength(2);
    expect(await db.select().from(emailVerificationTokens)).toHaveLength(1);
  });

  it("always creates an employee when a crafted request submits an admin role", async () => {
    await expectRedirect(() => signUpAction({}, signUpForm({ role: "admin" })));

    const [user] = await db.select().from(users);
    expect(user.role).toBe("employee");
  });

  it("rejects a weak password and writes nothing", async () => {
    const res = await signUpAction({}, signUpForm({ password: "weakpass" }));
    expect(res.error).toMatch(/password must/i);
    expect(await db.select().from(users)).toHaveLength(0);
  });

  it("rejects a malformed email", async () => {
    const res = await signUpAction({}, signUpForm({ email: "not-an-email" }));
    expect(res.error).toMatch(/valid email/i);
    expect(await db.select().from(users)).toHaveLength(0);
  });

  it("refuses a duplicate email regardless of case", async () => {
    await expectRedirect(() => signUpAction({}, signUpForm()));
    const res = await signUpAction({}, signUpForm({ employeeCode: "EMP901", email: "NADIA@dayflow.test" }));
    expect(res.error).toMatch(/already exists/i);
    expect(await db.select().from(users)).toHaveLength(1);
  });

  it("refuses a duplicate employee ID", async () => {
    await expectRedirect(() => signUpAction({}, signUpForm()));
    const res = await signUpAction({}, signUpForm({ email: "other@dayflow.test" }));
    expect(res.error).toMatch(/employee id is already registered/i);
    expect(await db.select().from(users)).toHaveLength(1);
  });
});

describe("verifyEmailAction", () => {
  async function tokenFor() {
    await expectRedirect(() => signUpAction({}, signUpForm()));
    const [t] = await db.select().from(emailVerificationTokens);
    return t;
  }

  it("marks the account verified", async () => {
    const token = await tokenFor();
    const res = await verifyEmailAction(token.token);
    expect(res.ok).toBe(true);

    const [user] = await db.select().from(users);
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
  });

  it("burns the token so the link only works once", async () => {
    const token = await tokenFor();
    await verifyEmailAction(token.token);

    const second = await verifyEmailAction(token.token);
    expect(second.ok).toBe(false);
  });

  it("rejects an unknown token", async () => {
    const res = await verifyEmailAction("not-a-real-token");
    expect(res).toEqual({ ok: false, error: expect.stringMatching(/invalid or has expired/i) });
  });

  it("rejects an expired token", async () => {
    const token = await tokenFor();
    await db
      .update(emailVerificationTokens)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(emailVerificationTokens.token, token.token));

    const res = await verifyEmailAction(token.token);
    expect(res.ok).toBe(false);

    const [user] = await db.select().from(users);
    expect(user.emailVerifiedAt).toBeNull();
  });
});

describe("signInAction", () => {
  async function seedSignInUser(over: { verified?: boolean; isActive?: boolean } = {}) {
    return seedEmployee({
      firstName: "Rohan",
      passwordHash: await hashPassword(GOOD_PASSWORD),
      verified: over.verified ?? true,
      isActive: over.isActive ?? true,
    });
  }

  it("signs in a verified, active user and sets a cookie", async () => {
    const user = await seedSignInUser();
    const url = await expectRedirect(() =>
      signInAction({}, form({ email: user.email, password: GOOD_PASSWORD })),
    );

    expect(url).toBe("/dashboard");
    expect(setCookie).toHaveBeenCalledOnce();
    const [, , opts] = setCookie.mock.calls[0];
    expect(opts).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
  });

  it("gives the same message for a wrong password and an unknown email", async () => {
    const user = await seedSignInUser();
    const wrongPassword = await signInAction({}, form({ email: user.email, password: "Nope#12345" }));
    const unknownEmail = await signInAction({}, form({ email: "ghost@dayflow.test", password: GOOD_PASSWORD }));

    expect(wrongPassword.error).toBe(unknownEmail.error);
    expect(wrongPassword.error).toMatch(/incorrect email or password/i);
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("blocks an unverified account with a distinct message", async () => {
    const user = await seedSignInUser({ verified: false });
    const res = await signInAction({}, form({ email: user.email, password: GOOD_PASSWORD }));

    expect(res.error).toMatch(/verify your email/i);
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("blocks a deactivated account", async () => {
    const user = await seedSignInUser({ isActive: false });
    const res = await signInAction({}, form({ email: user.email, password: GOOD_PASSWORD }));

    expect(res.error).toMatch(/deactivated/i);
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("checks the password before the account status, so status never leaks", async () => {
    const user = await seedSignInUser({ isActive: false });
    const res = await signInAction({}, form({ email: user.email, password: "WrongPass#1" }));
    expect(res.error).toMatch(/incorrect email or password/i);
  });

  it("requires both fields", async () => {
    const res = await signInAction({}, form({ email: "", password: "" }));
    expect(res.error).toMatch(/enter your email and password/i);
  });

  it("matches the email case-insensitively", async () => {
    const user = await seedSignInUser();
    const url = await expectRedirect(() =>
      signInAction({}, form({ email: user.email.toUpperCase(), password: GOOD_PASSWORD })),
    );
    expect(url).toBe("/dashboard");
  });
});

describe("signOutAction", () => {
  it("clears the cookie and returns to sign-in", async () => {
    const url = await expectRedirect(() => signOutAction());
    expect(url).toBe("/signin");
    expect(deleteCookie).toHaveBeenCalled();
  });
});
