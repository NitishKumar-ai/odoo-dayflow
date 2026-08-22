"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db, leaveRequests, leaveBalances, attendance, employees } from "@/db";
import { requireUser, requireAdmin } from "@/lib/auth";
import { countLeaveDays, LEAVE_TYPE_LABEL } from "@/lib/leave";
import { daysUsed, ensureLeaveBalances } from "@/lib/leave-queries";
import { logActivity } from "@/lib/activity";
import { eachDate, isWeekend, formatDate } from "@/lib/dates";

export type ActionResult = { error?: string; ok?: string };

const applySchema = z.object({
  leaveType: z.enum(["paid", "sick", "unpaid"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a start date"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose an end date"),
  remarks: z.string().max(500).default(""),
});

export async function applyLeaveAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = applySchema.safeParse({
    leaveType: formData.get("leaveType"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    remarks: formData.get("remarks") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the dates you picked." };
  }
  const { leaveType, startDate, endDate, remarks } = parsed.data;

  if (endDate < startDate) return { error: "The end date cannot be before the start date." };

  const days = countLeaveDays(startDate, endDate);
  if (days === 0) return { error: "That range only covers weekends." };

  const year = Number(startDate.slice(0, 4));

  // The overlap and balance checks are read-then-write, so two submits landing
  // together could both pass and both insert. Lock the employee row for the
  // duration so the second one sees the first one's request.
  const result = await db.transaction(async (tx): Promise<ActionResult> => {
    await tx
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.id, user.employeeId))
      .for("update");

    const overlapping = await tx
      .select({ id: leaveRequests.id, start: leaveRequests.startDate, end: leaveRequests.endDate })
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.employeeId, user.employeeId),
          ne(leaveRequests.status, "rejected"),
          sql`${leaveRequests.startDate} <= ${endDate} and ${leaveRequests.endDate} >= ${startDate}`,
        ),
      )
      .limit(1);
    if (overlapping.length) {
      return {
        error: `You already have a request covering ${formatDate(overlapping[0].start)} \u2013 ${formatDate(overlapping[0].end)}.`,
      };
    }

    if (leaveType !== "unpaid") {
      await ensureLeaveBalances(user.employeeId, year, tx);
      const [balance] = await tx
        .select({ entitled: leaveBalances.entitledDays })
        .from(leaveBalances)
        .where(
          and(
            eq(leaveBalances.employeeId, user.employeeId),
            eq(leaveBalances.year, year),
            eq(leaveBalances.leaveType, leaveType),
          ),
        )
        .limit(1);

      const entitled = balance?.entitled ?? 0;
      const used = await daysUsed(user.employeeId, leaveType, year, tx);
      if (used + days > entitled) {
        return {
          error: `That exceeds your ${LEAVE_TYPE_LABEL[leaveType].toLowerCase()} balance \u2014 ${entitled - used} of ${entitled} days left in ${year}.`,
        };
      }
    }

    await tx.insert(leaveRequests).values({
      employeeId: user.employeeId,
      leaveType,
      startDate,
      endDate,
      days,
      remarks,
    });

    return {};
  });

  if (result.error) return result;

  await logActivity(
    user.employeeId,
    "leave",
    `Applied for ${days} day${days === 1 ? "" : "s"} of ${LEAVE_TYPE_LABEL[leaveType].toLowerCase()}`,
  );
  revalidatePath("/leave");
  revalidatePath("/dashboard");
  revalidatePath("/admin/leave");
  return { ok: "Leave request submitted." };
}

export async function cancelLeaveAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const id = String(formData.get("requestId") ?? "");

  const [req] = await db
    .select()
    .from(leaveRequests)
    .where(and(eq(leaveRequests.id, id), eq(leaveRequests.employeeId, user.employeeId)))
    .limit(1);

  if (!req) return { error: "Request not found." };
  if (req.status !== "pending") return { error: "Only pending requests can be withdrawn." };

  // The status check above can go stale: an admin may approve this request
  // between the select and the delete. Approving writes `leave` attendance
  // rows, so deleting the request afterwards would strand them — the employee
  // stays blocked from checking in with no request left to explain it. Repeat
  // the predicate in the delete and treat "no rows" as the admin winning.
  const withdrawn = await db
    .delete(leaveRequests)
    .where(
      and(
        eq(leaveRequests.id, id),
        eq(leaveRequests.employeeId, user.employeeId),
        eq(leaveRequests.status, "pending"),
      ),
    )
    .returning({ id: leaveRequests.id });

  if (withdrawn.length === 0) {
    return { error: "That request was just decided and can no longer be withdrawn." };
  }

  await logActivity(user.employeeId, "leave", "Withdrew a pending leave request");
  revalidatePath("/leave");
  revalidatePath("/admin/leave");
  return { ok: "Request withdrawn." };
}

/**
 * Spec 3.5.2: approving must reflect immediately in employee records, so an
 * approval also stamps the attendance calendar for every weekday in the range.
 */
export async function decideLeaveAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = String(formData.get("requestId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const comment = String(formData.get("comment") ?? "").slice(0, 500);

  if (decision !== "approved" && decision !== "rejected") {
    return { error: "Choose approve or reject." };
  }

  const [req] = await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.id, id))
    .limit(1);
  if (!req) return { error: "Request not found." };
  if (req.status !== "pending") return { error: "That request was already decided." };

  const [emp] = await db
    .select({ firstName: employees.firstName, lastName: employees.lastName })
    .from(employees)
    .where(eq(employees.id, req.employeeId))
    .limit(1);

  let alreadyDecided = false;

  await db.transaction(async (tx) => {
    // Two admins deciding at once both pass the pending check above. Carry the
    // predicate into the update so exactly one transition wins; otherwise an
    // approve and a reject can interleave and leave `leave` attendance rows
    // behind a request that ended up rejected.
    const decided = await tx
      .update(leaveRequests)
      .set({
        status: decision,
        decisionComment: comment,
        decidedByUserId: admin.userId,
        decidedAt: new Date(),
      })
      .where(and(eq(leaveRequests.id, id), eq(leaveRequests.status, "pending")))
      .returning({ id: leaveRequests.id });

    if (decided.length === 0) {
      alreadyDecided = true;
      return;
    }

    if (decision === "approved") {
      const workDays = eachDate(req.startDate, req.endDate).filter((d) => !isWeekend(d));
      for (const workDate of workDays) {
        await tx
          .insert(attendance)
          .values({
            employeeId: req.employeeId,
            workDate,
            status: "leave",
            note: `${LEAVE_TYPE_LABEL[req.leaveType]} approved by ${admin.name}`,
          })
          .onConflictDoUpdate({
            target: [attendance.employeeId, attendance.workDate],
            set: { status: "leave", note: `${LEAVE_TYPE_LABEL[req.leaveType]} approved` },
          });
      }
    }
  });

  if (alreadyDecided) return { error: "That request was already decided." };

  await logActivity(
    req.employeeId,
    "leave",
    `${LEAVE_TYPE_LABEL[req.leaveType]} ${formatDate(req.startDate)} – ${formatDate(req.endDate)} ${decision} by ${admin.name}`,
  );

  revalidatePath("/admin/leave");
  revalidatePath("/leave");
  revalidatePath("/attendance");
  revalidatePath("/admin/attendance");
  const who = emp ? `${emp.firstName} ${emp.lastName}`.trim() : "Employee";
  return { ok: `${who}'s request was ${decision}.` };
}
