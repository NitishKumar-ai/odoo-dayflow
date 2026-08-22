import type { SessionUser } from "@/lib/auth";

/**
 * Server actions resolve the caller through requireUser()/requireAdmin(), which
 * read a request cookie. Integration tests set a fixed identity here instead
 * and mock those two functions (see `authMock` below).
 */
export const currentUser = { value: null as SessionUser | null };

export function actAs(user: {
  userId: string;
  employeeId: string;
  role?: "admin" | "employee";
  name?: string;
  email?: string;
  employeeCode?: string;
}) {
  currentUser.value = {
    userId: user.userId,
    employeeId: user.employeeId,
    employeeCode: user.employeeCode ?? "E0000",
    email: user.email ?? "actor@test.local",
    role: user.role ?? "employee",
    name: user.name ?? "Actor Test",
  };
}

/**
 * Factory for `vi.mock("@/lib/auth", authMock)`. Call it at the top level of a
 * test file — vi.mock is hoisted, so it cannot be wrapped in a helper call.
 */
export async function authMock() {
  const actual = await import("@/lib/auth");
  const { currentUser: session } = await import("./session");
  return {
    ...actual,
    requireUser: async () => {
      if (!session.value) throw new Error("no session in test");
      return session.value;
    },
    requireAdmin: async () => {
      if (!session.value) throw new Error("no session in test");
      if (session.value.role !== "admin") throw new Error("not an admin in test");
      return session.value;
    },
  };
}
