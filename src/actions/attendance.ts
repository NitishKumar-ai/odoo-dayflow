"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, attendance } from "@/db";
import { requireUser, requireAdmin } from "@/lib/auth";
import { deriveStatus, type AttendanceStatus } from "@/lib/attendance";
import { logActivity } from "@/lib/activity";
import { today, formatDate } from "@/lib/dates";

export type ActionResult = { error?: string; ok?: string };

async function dayRow(employeeId: string, workDate: string) {
  const [row] = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.employeeId, employeeId), eq(attendance.workDate, workDate)))
    .limit(1);
  return row ?? null;
}

export async function checkInAction(
  _prev: ActionResult,
  _formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const workDate = today();
  const existing = await dayRow(user.employeeId, workDate);

  if (existing?.status === "leave") {
    return { error: "You are on approved leave today." };
  }
  if (existing?.checkInAt) {
    return { error: "You have already checked in today." };
  }

  const now = new Date();
  if (existing) {
    await db
      .update(attendance)
      .set({ checkInAt: now, status: existing.isManual ? existing.status : "present" })
      .where(eq(attendance.id, existing.id));
  } else {
    // A double-click fires two check-ins at once; both see no row and both
    // insert. The unique index catches the loser, so treat that as "already
    // checked in" rather than letting a raw query error reach the employee.
    const inserted = await db
      .insert(attendance)
      .values({
        employeeId: user.employeeId,
        workDate,
        checkInAt: now,
        status: "present",
      })
      .onConflictDoNothing({ target: [attendance.employeeId, attendance.workDate] })
      .returning({ id: attendance.id });

    if (inserted.length === 0) {
      return { error: "You have already checked in today." };
    }
  }

  await logActivity(user.employeeId, "attendance", `Checked in for ${formatDate(workDate)}`);
  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return { ok: "Checked in." };
}

export async function checkOutAction(
  _prev: ActionResult,
  _formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const workDate = today();
  const existing = await dayRow(user.employeeId, workDate);

  if (!existing?.checkInAt) return { error: "You have not checked in today." };
  if (existing.checkOutAt) return { error: "You have already checked out today." };

  const now = new Date();
  await db
    .update(attendance)
    .set({
      checkOutAt: now,
      status: existing.isManual
        ? existing.status
        : deriveStatus(existing.checkInAt, now),
    })
    .where(eq(attendance.id, existing.id));

  await logActivity(user.employeeId, "attendance", `Checked out for ${formatDate(workDate)}`);
  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return { ok: "Checked out." };
}

/** Admin override — spec 3.4.2 gives HR full control of attendance records. */
export async function setAttendanceStatusAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const employeeId = String(formData.get("employeeId") ?? "");
  const workDate = String(formData.get("workDate") ?? "");
  const status = String(formData.get("status") ?? "") as AttendanceStatus;
  const note = String(formData.get("note") ?? "").slice(0, 500);

  if (!employeeId || !workDate) return { error: "Missing employee or date." };
  if (!["present", "absent", "half_day", "leave"].includes(status)) {
    return { error: "Unknown attendance status." };
  }

  const existing = await dayRow(employeeId, workDate);
  if (existing) {
    await db
      .update(attendance)
      .set({ status, note, isManual: true })
      .where(eq(attendance.id, existing.id));
  } else {
    // Two admins can save the same cell at once; last write wins rather than
    // failing on the unique index.
    await db
      .insert(attendance)
      .values({ employeeId, workDate, status, note, isManual: true })
      .onConflictDoUpdate({
        target: [attendance.employeeId, attendance.workDate],
        set: { status, note, isManual: true },
      });
  }

  await logActivity(
    employeeId,
    "attendance",
    `${formatDate(workDate)} marked ${status.replace("_", "-")} by ${admin.name}`,
  );
  revalidatePath("/admin/attendance");
  revalidatePath("/attendance");
  return { ok: "Attendance updated." };
}
