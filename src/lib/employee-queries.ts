import "server-only";
import { and, desc, eq, lte, sql } from "drizzle-orm";
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
