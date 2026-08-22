// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";
import { resetDb, seedEmployee, type SeededEmployee } from "./helpers/db";
import { db } from "@/db";
import { users } from "@/db/schema";

const cookieJar = { token: undefined as string | undefined };
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "dayflow_session" && cookieJar.token
        ? { name, value: cookieJar.token }
        : undefined,
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

const redirected: string[] = [];
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirected.push(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

const { getSessionUser, requireUser, requireAdmin } = await import("@/lib/auth");

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET!);

async function tokenFor(userId: string, opts: { expired?: boolean } = {}) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(opts.expired ? "-1h" : "8h")
    .sign(SECRET);
}

let employee: SeededEmployee;

beforeEach(async () => {
  await resetDb();
  redirected.length = 0;
  cookieJar.token = undefined;
  employee = await seedEmployee({ firstName: "Rohan" });
});

describe("getSessionUser", () => {
  it("resolves a valid session to the employee behind it", async () => {
    cookieJar.token = await tokenFor(employee.userId);
    const user = await getSessionUser();

    expect(user).toMatchObject({
      userId: employee.userId,
      employeeId: employee.employeeId,
      role: "employee",
      name: "Rohan Test",
    });
  });

  it("returns null when there is no cookie", async () => {
    expect(await getSessionUser()).toBeNull();
  });

  it("returns null for a token this server did not sign", async () => {
    const forged = await new SignJWT({ sub: employee.userId })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("8h")
      .sign(new TextEncoder().encode("a-different-secret-entirely-0123456789"));
    cookieJar.token = forged;

    expect(await getSessionUser()).toBeNull();
  });

  it("returns null for a garbage cookie rather than throwing", async () => {
    cookieJar.token = "not.a.jwt";
    expect(await getSessionUser()).toBeNull();
  });

  it("returns null once the token has expired", async () => {
    cookieJar.token = await tokenFor(employee.userId, { expired: true });
    expect(await getSessionUser()).toBeNull();
  });

  it("returns null when the user no longer exists", async () => {
    const token = await tokenFor(employee.userId);
    await db.delete(users).where(eq(users.id, employee.userId));
    cookieJar.token = token;

    expect(await getSessionUser()).toBeNull();
  });

  /** Deactivation must take effect immediately, not at the next sign-in. */
  it("returns null once the account is deactivated, even with a live token", async () => {
    cookieJar.token = await tokenFor(employee.userId);
    expect(await getSessionUser()).not.toBeNull();

    await db.update(users).set({ isActive: false }).where(eq(users.id, employee.userId));
    expect(await getSessionUser()).toBeNull();
  });

  it("returns null while the email is still unverified", async () => {
    const unverified = await seedEmployee({ firstName: "Nadia", verified: false });
    cookieJar.token = await tokenFor(unverified.userId);
    expect(await getSessionUser()).toBeNull();
  });
});

describe("requireUser / requireAdmin", () => {
  it("requireUser sends an anonymous visitor to sign-in", async () => {
    await expect(requireUser()).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirected.at(-1)).toBe("/signin");
  });

  it("requireAdmin sends an employee back to their own dashboard", async () => {
    cookieJar.token = await tokenFor(employee.userId);
    await expect(requireAdmin()).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirected.at(-1)).toBe("/dashboard");
  });

  it("requireAdmin lets an admin through", async () => {
    const admin = await seedEmployee({ firstName: "Asha", role: "admin" });
    cookieJar.token = await tokenFor(admin.userId);

    const user = await requireAdmin();
    expect(user.role).toBe("admin");
    expect(redirected).toHaveLength(0);
  });
});
