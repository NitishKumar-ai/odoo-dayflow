// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { eq } from "drizzle-orm";
import { resetDb, seedEmployee, type SeededEmployee } from "./helpers/db";
import { actAs } from "./helpers/session";
import { db } from "@/db";
import { employees, users, salaryStructures } from "@/db/schema";
import { getCurrentSalary, listEmployees } from "@/lib/employee-queries";

vi.mock("@/lib/auth", async () => (await import("./helpers/session")).authMock());

const {
  updateOwnProfileAction,
  adminUpdateEmployeeAction,
  updateSalaryAction,
} = await import("@/actions/profile");

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

let employee: SeededEmployee;
let admin: SeededEmployee;

beforeEach(async () => {
  await resetDb();
  employee = await seedEmployee({ firstName: "Rohan" });
  admin = await seedEmployee({ firstName: "Asha", role: "admin" });
  actAs({ ...employee, role: "employee" });
});

describe("updateOwnProfileAction", () => {
  it("saves the three fields an employee is allowed to change", async () => {
    const res = await updateOwnProfileAction({}, form({
      phone: "+91 90000 11111",
      address: "Bengaluru",
      photoUrl: "https://example.com/me.jpg",
    }));

    expect(res.ok).toBeTruthy();
    const [row] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employee.employeeId));
    expect(row.phone).toBe("+91 90000 11111");
    expect(row.address).toBe("Bengaluru");
    expect(row.photoUrl).toBe("https://example.com/me.jpg");
  });

  it("rejects a photo URL that is not http(s)", async () => {
    const res = await updateOwnProfileAction({}, form({
      phone: "", address: "", photoUrl: "javascript:alert(1)",
    }));
    expect(res.error).toMatch(/photo must be an http/i);
  });

  it("accepts an empty photo URL as clearing the picture", async () => {
    await updateOwnProfileAction({}, form({
      phone: "", address: "", photoUrl: "https://example.com/a.png",
    }));
    await updateOwnProfileAction({}, form({ phone: "", address: "", photoUrl: "" }));

    const [row] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employee.employeeId));
    expect(row.photoUrl).toBeNull();
  });

  it("cannot reach job title or department", async () => {
    await db
      .update(employees)
      .set({ jobTitle: "Backend Engineer" })
      .where(eq(employees.id, employee.employeeId));

    await updateOwnProfileAction({}, form({
      phone: "1", address: "2", photoUrl: "",
      jobTitle: "CEO", department: "Board",
    }));

    const [row] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employee.employeeId));
    expect(row.jobTitle).toBe("Backend Engineer");
  });
});

describe("adminUpdateEmployeeAction", () => {
  beforeEach(() => actAs({ ...admin, role: "admin" }));

  function fullForm(over: Record<string, string> = {}) {
    return form({
      employeeId: employee.employeeId,
      firstName: "Rohan",
      lastName: "Mehta",
      phone: "",
      address: "",
      jobTitle: "Backend Engineer",
      department: "Engineering",
      employmentType: "full_time",
      dateOfJoining: "2023-01-09",
      dateOfBirth: "",
      role: "employee",
      isActive: "true",
      ...over,
    });
  }

  it("writes the fields an employee cannot change themselves", async () => {
    const res = await adminUpdateEmployeeAction({}, fullForm());
    expect(res.ok).toBeTruthy();

    const [row] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employee.employeeId));
    expect(row.jobTitle).toBe("Backend Engineer");
    expect(row.dateOfJoining).toBe("2023-01-09");
  });

  it("promotes an employee to admin", async () => {
    await adminUpdateEmployeeAction({}, fullForm({ role: "admin" }));
    const [row] = await db.select().from(users).where(eq(users.id, employee.userId));
    expect(row.role).toBe("admin");
  });

  it("deactivates an account", async () => {
    await adminUpdateEmployeeAction({}, fullForm({ isActive: "false" }));
    const [row] = await db.select().from(users).where(eq(users.id, employee.userId));
    expect(row.isActive).toBe(false);
  });

  /** Without this guard the last admin could lock everyone out of the admin area. */
  it("stops an admin removing their own admin access", async () => {
    const res = await adminUpdateEmployeeAction({}, fullForm({
      employeeId: admin.employeeId, role: "employee",
    }));

    expect(res.error).toMatch(/cannot remove your own admin access/i);
    const [row] = await db.select().from(users).where(eq(users.id, admin.userId));
    expect(row.role).toBe("admin");
  });

  it("stops an admin deactivating their own account", async () => {
    const res = await adminUpdateEmployeeAction({}, fullForm({
      employeeId: admin.employeeId, isActive: "false",
    }));

    expect(res.error).toMatch(/cannot remove your own admin access/i);
    const [row] = await db.select().from(users).where(eq(users.id, admin.userId));
    expect(row.isActive).toBe(true);
  });

  it("reports a missing employee rather than writing nothing silently", async () => {
    const res = await adminUpdateEmployeeAction({}, fullForm({
      employeeId: "00000000-0000-0000-0000-000000000000",
    }));
    expect(res.error).toMatch(/not found/i);
  });

  it("rejects an unknown employment type", async () => {
    const res = await adminUpdateEmployeeAction({}, fullForm({ employmentType: "freelance" }));
    expect(res.error).toBeTruthy();
  });

  it("refuses to run for a non-admin", async () => {
    actAs({ ...employee, role: "employee" });
    await expect(adminUpdateEmployeeAction({}, fullForm())).rejects.toThrow(/not an admin/i);
  });
});

describe("updateSalaryAction", () => {
  beforeEach(() => actAs({ ...admin, role: "admin" }));

  function salaryForm(over: Record<string, string> = {}) {
    return form({
      employeeId: employee.employeeId,
      effectiveFrom: "2026-01-01",
      currency: "inr",
      basic: "78000",
      hra: "31000",
      allowances: "9000",
      deductions: "9800",
      ...over,
    });
  }

  it("records a structure and upper-cases the currency", async () => {
    const res = await updateSalaryAction({}, salaryForm());
    expect(res.ok).toBeTruthy();

    const [row] = await db.select().from(salaryStructures);
    expect(row.currency).toBe("INR");
    expect(Number(row.basic)).toBe(78000);
    expect(row.updatedByUserId).toBe(admin.userId);
  });

  it("keeps earlier revisions instead of overwriting them", async () => {
    await updateSalaryAction({}, salaryForm({ effectiveFrom: "2025-01-01", basic: "60000" }));
    await updateSalaryAction({}, salaryForm({ effectiveFrom: "2026-01-01", basic: "78000" }));

    const rows = await db.select().from(salaryStructures);
    expect(rows).toHaveLength(2);
  });

  it("updates in place when the effective date already exists", async () => {
    await updateSalaryAction({}, salaryForm({ basic: "60000" }));
    await updateSalaryAction({}, salaryForm({ basic: "78000" }));

    const rows = await db.select().from(salaryStructures);
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].basic)).toBe(78000);
  });

  it("refuses deductions larger than gross pay", async () => {
    const res = await updateSalaryAction({}, salaryForm({ deductions: "200000" }));
    expect(res.error).toMatch(/deductions cannot exceed gross/i);
    expect(await db.select().from(salaryStructures)).toHaveLength(0);
  });

  it("refuses a negative basic", async () => {
    const res = await updateSalaryAction({}, salaryForm({ basic: "-1" }));
    expect(res.error).toMatch(/cannot be negative/i);
  });

  it("refuses a malformed effective date", async () => {
    const res = await updateSalaryAction({}, salaryForm({ effectiveFrom: "01/01/2026" }));
    expect(res.error).toMatch(/effective date/i);
  });
});

describe("employee queries", () => {
  beforeEach(() => actAs({ ...admin, role: "admin" }));

  it("returns the structure in force today, not a future one", async () => {
    await updateSalaryAction({}, form({
      employeeId: employee.employeeId, effectiveFrom: "2020-01-01",
      currency: "INR", basic: "50000", hra: "0", allowances: "0", deductions: "0",
    }));
    await updateSalaryAction({}, form({
      employeeId: employee.employeeId, effectiveFrom: "2099-01-01",
      currency: "INR", basic: "99000", hra: "0", allowances: "0", deductions: "0",
    }));

    const current = await getCurrentSalary(employee.employeeId);
    expect(Number(current?.basic)).toBe(50000);
  });

  it("falls back to an upcoming structure when none is in force yet", async () => {
    await updateSalaryAction({}, form({
      employeeId: employee.employeeId, effectiveFrom: "2099-01-01",
      currency: "INR", basic: "99000", hra: "0", allowances: "0", deductions: "0",
    }));

    const current = await getCurrentSalary(employee.employeeId);
    expect(Number(current?.basic)).toBe(99000);
  });

  it("returns null when an employee has no salary on record", async () => {
    expect(await getCurrentSalary(employee.employeeId)).toBeNull();
  });

  it("filters the employee list by name, code, and department", async () => {
    await db
      .update(employees)
      .set({ department: "Engineering" })
      .where(eq(employees.id, employee.employeeId));

    expect(await listEmployees()).toHaveLength(2);
    expect(await listEmployees("rohan")).toHaveLength(1);
    expect(await listEmployees("ENGINEERING")).toHaveLength(1);
    expect(await listEmployees(employee.employeeCode)).toHaveLength(1);
    expect(await listEmployees("nobody")).toHaveLength(0);
  });

  it("counts pending leave per employee in the list", async () => {
    const rows = await listEmployees();
    expect(rows.every((r) => r.pendingLeave === 0)).toBe(true);
  });
});
