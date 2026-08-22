import { sql } from "drizzle-orm";
import { db } from "@/db";
import { users, employees, leaveBalances } from "@/db/schema";
import { DEFAULT_ENTITLEMENT } from "@/lib/leave";

/** Wipe every table between tests. */
export async function resetDb() {
  await db.execute(sql`
    truncate table
      activity_log, attendance, leave_requests, leave_balances,
      salary_structures, documents, email_verification_tokens,
      employees, users
    restart identity cascade
  `);
}

export type SeededEmployee = {
  userId: string;
  employeeId: string;
  email: string;
  employeeCode: string;
  name: string;
};

let seq = 0;

export async function seedEmployee(
  opts: {
    role?: "admin" | "employee";
    firstName?: string;
    verified?: boolean;
    isActive?: boolean;
    passwordHash?: string;
    year?: number;
    paidDays?: number;
    sickDays?: number;
  } = {},
): Promise<SeededEmployee> {
  seq += 1;
  const firstName = opts.firstName ?? `Person${seq}`;
  const employeeCode = `E${String(seq).padStart(4, "0")}`;
  const email = `person${seq}@test.local`;
  const year = opts.year ?? new Date().getFullYear();

  const [user] = await db
    .insert(users)
    .values({
      employeeCode,
      email,
      passwordHash: opts.passwordHash ?? "not-a-real-hash",
      role: opts.role ?? "employee",
      emailVerifiedAt: (opts.verified ?? true) ? new Date() : null,
      isActive: opts.isActive ?? true,
    })
    .returning({ id: users.id });

  const [employee] = await db
    .insert(employees)
    .values({ userId: user.id, firstName, lastName: "Test" })
    .returning({ id: employees.id });

  await db.insert(leaveBalances).values([
    {
      employeeId: employee.id,
      year,
      leaveType: "paid",
      entitledDays: opts.paidDays ?? DEFAULT_ENTITLEMENT.paid,
    },
    {
      employeeId: employee.id,
      year,
      leaveType: "sick",
      entitledDays: opts.sickDays ?? DEFAULT_ENTITLEMENT.sick,
    },
  ]);

  return {
    userId: user.id,
    employeeId: employee.id,
    email,
    employeeCode,
    name: `${firstName} Test`,
  };
}
