import "server-only";
import { and, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { db, employees, users, salaryStructures, documents } from "@/db";
import { today } from "./dates";

export type EmployeeDetail = NonNullable<Awaited<ReturnType<typeof getEmployeeDetail>>>;

export async function getEmployeeDetail(employeeId: string) {
  const [row] = await db
    .select({
      id: employees.id,
      userId: employees.userId,
      firstName: employees.firstName,
      lastName: employees.lastName,
      phone: employees.phone,
      address: employees.address,
      photoUrl: employees.photoUrl,
      dateOfBirth: employees.dateOfBirth,
      jobTitle: employees.jobTitle,
      department: employees.department,
      employmentType: employees.employmentType,
      dateOfJoining: employees.dateOfJoining,
      email: users.email,
      employeeCode: users.employeeCode,
      role: users.role,
      isActive: users.isActive,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(employees)
    .innerJoin(users, eq(users.id, employees.userId))
    .where(eq(employees.id, employeeId))
    .limit(1);

  return row ?? null;
}

type SalaryRow = typeof salaryStructures.$inferSelect;

/**
 * Which revision applies right now: the latest one already in force, or failing
 * that the soonest upcoming one. Shared by the single- and batch-lookup paths so
 * the two can never disagree.
 */
export function pickCurrentSalary(
  rows: SalaryRow[],
  onDate: string = today(),
): SalaryRow | null {
  const inForce = rows
    .filter((r) => r.effectiveFrom <= onDate)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  if (inForce.length) return inForce[0];

  const upcoming = [...rows].sort((a, b) =>
    a.effectiveFrom.localeCompare(b.effectiveFrom),
  );
  return upcoming[0] ?? null;
}

/** The structure in force today; falls back to the earliest future one. */
export async function getCurrentSalary(employeeId: string) {
  const [current] = await db
    .select()
    .from(salaryStructures)
    .where(
      and(
        eq(salaryStructures.employeeId, employeeId),
        lte(salaryStructures.effectiveFrom, today()),
      ),
    )
    .orderBy(desc(salaryStructures.effectiveFrom))
    .limit(1);

  if (current) return current;

  const [upcoming] = await db
    .select()
    .from(salaryStructures)
    .where(eq(salaryStructures.employeeId, employeeId))
    .orderBy(salaryStructures.effectiveFrom)
    .limit(1);

  return upcoming ?? null;
}

/** Postgres caps a statement at 65535 bind parameters; stay far below it. */
const ID_CHUNK = 1000;

/**
 * Batch version of getCurrentSalary. The payroll table needs one row per
 * employee; calling the single lookup in a loop was one to two queries per
 * person. DISTINCT ON makes Postgres pick the applicable revision, so the full
 * salary history never reaches Node.
 *
 * The ordering encodes the same rule as pickCurrentSalary: revisions already in
 * force come first, and within each group the one closest to the date wins —
 * the latest below it, or the soonest above it.
 */
export async function getCurrentSalaries(
  employeeIds: string[],
  onDate: string = today(),
): Promise<Map<string, SalaryRow>> {
  const out = new Map<string, SalaryRow>();

  for (let i = 0; i < employeeIds.length; i += ID_CHUNK) {
    const chunk = employeeIds.slice(i, i + ID_CHUNK);
    const rows = await db
      .selectDistinctOn([salaryStructures.employeeId])
      .from(salaryStructures)
      .where(inArray(salaryStructures.employeeId, chunk))
      .orderBy(
        salaryStructures.employeeId,
        sql`(${salaryStructures.effectiveFrom} <= ${onDate}::date) desc`,
        sql`abs(${salaryStructures.effectiveFrom} - ${onDate}::date) asc`,
      );

    for (const row of rows) out.set(row.employeeId, row);
  }

  return out;
}

export async function getSalaryHistory(employeeId: string) {
  return db
    .select()
    .from(salaryStructures)
    .where(eq(salaryStructures.employeeId, employeeId))
    .orderBy(desc(salaryStructures.effectiveFrom));
}

export async function getDocuments(employeeId: string) {
  return db
    .select()
    .from(documents)
    .where(eq(documents.employeeId, employeeId))
    .orderBy(desc(documents.uploadedAt));
}

export type EmployeeListRow = {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  email: string;
  jobTitle: string;
  department: string;
  role: "admin" | "employee";
  isActive: boolean;
  photoUrl: string | null;
  pendingLeave: number;
};

export async function listEmployees(search?: string): Promise<EmployeeListRow[]> {
  const term = search?.trim().toLowerCase();
  const rows = await db
    .select({
      id: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      employeeCode: users.employeeCode,
      email: users.email,
      jobTitle: employees.jobTitle,
      department: employees.department,
      role: users.role,
      isActive: users.isActive,
      photoUrl: employees.photoUrl,
      pendingLeave: sql<number>`(
        select count(*)::int from leave_requests lr
        where lr.employee_id = ${employees.id} and lr.status = 'pending'
      )`,
    })
    .from(employees)
    .innerJoin(users, eq(users.id, employees.userId))
    .orderBy(employees.firstName);

  if (!term) return rows;
  return rows.filter((r) =>
    [r.firstName, r.lastName, r.employeeCode, r.email, r.department, r.jobTitle]
      .join(" ")
      .toLowerCase()
      .includes(term),
  );
}
