"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, employees, users, salaryStructures } from "@/db";
import { requireUser, requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export type ActionResult = { error?: string; ok?: string };

/** Spec 3.3.2: an employee may change only these three fields. */
const selfEditSchema = z.object({
  phone: z.string().trim().max(32).default(""),
  address: z.string().trim().max(300).default(""),
  photoUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^https?:\/\//.test(v), "Photo must be an http(s) URL")
    .default(""),
});

export async function updateOwnProfileAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = selfEditSchema.safeParse({
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    photoUrl: formData.get("photoUrl") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  await db
    .update(employees)
    .set({
      phone: parsed.data.phone,
      address: parsed.data.address,
      photoUrl: parsed.data.photoUrl || null,
    })
    .where(eq(employees.id, user.employeeId));

  await logActivity(user.employeeId, "profile", "Updated contact details");
  revalidatePath("/profile");
  return { ok: "Profile updated." };
}

/** Spec 3.3.2: "Admin can edit all employee details." */
const adminEditSchema = z.object({
  employeeId: z.string().uuid(),
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().max(60).default(""),
  phone: z.string().trim().max(32).default(""),
  address: z.string().trim().max(300).default(""),
  jobTitle: z.string().trim().max(80).default(""),
  department: z.string().trim().max(80).default(""),
  employmentType: z.enum(["full_time", "part_time", "contract", "intern"]),
  dateOfJoining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).default(""),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).default(""),
  role: z.enum(["employee", "admin"]),
  isActive: z.enum(["true", "false"]),
});

export async function adminUpdateEmployeeAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = adminEditSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  }
  const d = parsed.data;

  const [target] = await db
    .select({ userId: employees.userId })
    .from(employees)
    .where(eq(employees.id, d.employeeId))
    .limit(1);
  if (!target) return { error: "Employee not found." };

  // Guard against an admin locking themselves out of the admin area.
  if (target.userId === admin.userId && (d.role !== "admin" || d.isActive === "false")) {
    return { error: "You cannot remove your own admin access." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(employees)
      .set({
        firstName: d.firstName,
        lastName: d.lastName,
        phone: d.phone,
        address: d.address,
        jobTitle: d.jobTitle,
        department: d.department,
        employmentType: d.employmentType,
        dateOfJoining: d.dateOfJoining || null,
        dateOfBirth: d.dateOfBirth || null,
      })
      .where(eq(employees.id, d.employeeId));

    await tx
      .update(users)
      .set({ role: d.role, isActive: d.isActive === "true" })
      .where(eq(users.id, target.userId));
  });

  await logActivity(d.employeeId, "profile", `Profile updated by ${admin.name}`);
  revalidatePath(`/admin/employees/${d.employeeId}`);
  revalidatePath("/admin/employees");
  return { ok: "Employee details saved." };
}

/** Spec 3.6.2: admin updates the salary structure. Each save is a new version. */
const salarySchema = z.object({
  employeeId: z.string().uuid(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick an effective date"),
  currency: z.string().trim().length(3).default("INR"),
  basic: z.coerce.number().min(0, "Basic cannot be negative"),
  hra: z.coerce.number().min(0),
  allowances: z.coerce.number().min(0),
  deductions: z.coerce.number().min(0),
});

export async function updateSalaryAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = salarySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the salary figures." };
  }
  const d = parsed.data;

  if (d.deductions > d.basic + d.hra + d.allowances) {
    return { error: "Deductions cannot exceed gross pay." };
  }

  await db
    .insert(salaryStructures)
    .values({
      employeeId: d.employeeId,
      effectiveFrom: d.effectiveFrom,
      currency: d.currency.toUpperCase(),
      basic: d.basic.toFixed(2),
      hra: d.hra.toFixed(2),
      allowances: d.allowances.toFixed(2),
      deductions: d.deductions.toFixed(2),
      updatedByUserId: admin.userId,
    })
    .onConflictDoUpdate({
      target: [salaryStructures.employeeId, salaryStructures.effectiveFrom],
      set: {
        currency: d.currency.toUpperCase(),
        basic: d.basic.toFixed(2),
        hra: d.hra.toFixed(2),
        allowances: d.allowances.toFixed(2),
        deductions: d.deductions.toFixed(2),
        updatedByUserId: admin.userId,
      },
    });

  await logActivity(
    d.employeeId,
    "payroll",
    `Salary structure effective ${d.effectiveFrom} updated by ${admin.name}`,
  );
  revalidatePath("/admin/payroll");
  revalidatePath(`/admin/employees/${d.employeeId}`);
  revalidatePath("/payroll");
  return { ok: "Salary structure saved." };
}
