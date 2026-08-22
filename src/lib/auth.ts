import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users, employees } from "@/db";

export { passwordProblems } from "./password";

const COOKIE = "dayflow_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(s);
}

export type SessionUser = {
  userId: string;
  employeeId: string;
  employeeCode: string;
  email: string;
  role: "admin" | "employee";
  name: string;
};

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}


export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Returns the signed-in user, or null. Never throws on a bad cookie. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    userId = payload.sub;
  } catch {
    return null;
  }

  const [row] = await db
    .select({
      userId: users.id,
      employeeId: employees.id,
      employeeCode: users.employeeCode,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      emailVerifiedAt: users.emailVerifiedAt,
      firstName: employees.firstName,
      lastName: employees.lastName,
    })
    .from(users)
    .innerJoin(employees, eq(employees.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (!row || !row.isActive || !row.emailVerifiedAt) return null;

  return {
    userId: row.userId,
    employeeId: row.employeeId,
    employeeCode: row.employeeCode,
    email: row.email,
    role: row.role,
    name: `${row.firstName} ${row.lastName}`.trim(),
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/signin");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}
