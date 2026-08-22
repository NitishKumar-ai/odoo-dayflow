// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { and, eq } from "drizzle-orm";
import { resetDb, seedEmployee, type SeededEmployee } from "./helpers/db";
import { actAs } from "./helpers/session";
import { db } from "@/db";
import { attendance, leaveRequests } from "@/db/schema";

// The factory must be inline: vi.mock is hoisted above the import statements.
vi.mock("@/lib/auth", async () => (await import("./helpers/session")).authMock());

const {
  applyLeaveAction,
  cancelLeaveAction,
  decideLeaveAction,
} = await import("@/actions/leave");

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

/** Mon 2026-09-07 .. Fri 2026-09-11 is a clean 5-weekday window. */
const MON = "2026-09-07";
const FRI = "2026-09-11";

let employee: SeededEmployee;
let admin: SeededEmployee;

beforeEach(async () => {
  await resetDb();
  employee = await seedEmployee({ firstName: "Rohan", year: 2026 });
  admin = await seedEmployee({ firstName: "Asha", role: "admin", year: 2026 });
  actAs({ ...employee, role: "employee" });
});

describe("applyLeaveAction", () => {
  it("records a request and counts only the weekdays", async () => {
    const res = await applyLeaveAction({}, form({
      leaveType: "paid",
      startDate: MON,
      endDate: "2026-09-14", // the following Monday
      remarks: "Family wedding.",
    }));

    expect(res.ok).toBeTruthy();
    const [row] = await db.select().from(leaveRequests);
    expect(row.days).toBe(6); // 5 weekdays + the next Monday, weekend excluded
    expect(row.status).toBe("pending");
    expect(row.remarks).toBe("Family wedding.");
  });

  it("rejects a range that ends before it starts", async () => {
    const res = await applyLeaveAction({}, form({
      leaveType: "paid", startDate: FRI, endDate: MON, remarks: "",
    }));
    expect(res.error).toMatch(/end date cannot be before/i);
    expect(await db.select().from(leaveRequests)).toHaveLength(0);
  });

  it("rejects a weekend-only range instead of booking zero days", async () => {
    const res = await applyLeaveAction({}, form({
      leaveType: "paid", startDate: "2026-09-05", endDate: "2026-09-06", remarks: "",
    }));
    expect(res.error).toMatch(/only covers weekends/i);
    expect(await db.select().from(leaveRequests)).toHaveLength(0);
  });

  it("refuses a second request overlapping a pending one", async () => {
    await applyLeaveAction({}, form({
      leaveType: "paid", startDate: MON, endDate: FRI, remarks: "",
    }));
    const res = await applyLeaveAction({}, form({
      leaveType: "sick", startDate: "2026-09-09", endDate: "2026-09-15", remarks: "",
    }));

    expect(res.error).toMatch(/already have a request covering/i);
    expect(await db.select().from(leaveRequests)).toHaveLength(1);
  });

  it("allows a request that starts the day after another one ends", async () => {
    await applyLeaveAction({}, form({
      leaveType: "paid", startDate: MON, endDate: "2026-09-09", remarks: "",
    }));
    const res = await applyLeaveAction({}, form({
      leaveType: "paid", startDate: "2026-09-10", endDate: FRI, remarks: "",
    }));

    expect(res.ok).toBeTruthy();
    expect(await db.select().from(leaveRequests)).toHaveLength(2);
  });

  it("stops an employee exceeding their paid balance", async () => {
    const tight = await seedEmployee({ firstName: "Mei", year: 2026, paidDays: 3 });
    actAs({ ...tight, role: "employee" });

    const res = await applyLeaveAction({}, form({
      leaveType: "paid", startDate: MON, endDate: FRI, remarks: "",
    }));

    expect(res.error).toMatch(/exceeds your paid leave balance/i);
    expect(res.error).toMatch(/3 of 3 days left/i);
    expect(await db.select().from(leaveRequests)).toHaveLength(0);
  });

  it("counts a still-pending request against the balance", async () => {
    const tight = await seedEmployee({ firstName: "Sam", year: 2026, paidDays: 6 });
    actAs({ ...tight, role: "employee" });

    await applyLeaveAction({}, form({
      leaveType: "paid", startDate: MON, endDate: FRI, remarks: "",
    })); // 5 days, still pending

    const res = await applyLeaveAction({}, form({
      leaveType: "paid", startDate: "2026-09-14", endDate: "2026-09-16", remarks: "",
    })); // wants 3 more, only 1 left

    expect(res.error).toMatch(/1 of 6 days left/i);
  });

  it("does not cap unpaid leave against a balance", async () => {
    const res = await applyLeaveAction({}, form({
      leaveType: "unpaid", startDate: MON, endDate: "2026-10-30", remarks: "",
    }));
    expect(res.ok).toBeTruthy();
  });
});

describe("cancelLeaveAction", () => {
  it("withdraws the employee's own pending request", async () => {
    await applyLeaveAction({}, form({
      leaveType: "paid", startDate: MON, endDate: FRI, remarks: "",
    }));
    const [row] = await db.select().from(leaveRequests);

    const res = await cancelLeaveAction({}, form({ requestId: row.id }));
    expect(res.ok).toBeTruthy();
    expect(await db.select().from(leaveRequests)).toHaveLength(0);
  });

  it("refuses to withdraw someone else's request", async () => {
    await applyLeaveAction({}, form({
      leaveType: "paid", startDate: MON, endDate: FRI, remarks: "",
    }));
    const [row] = await db.select().from(leaveRequests);

    const other = await seedEmployee({ firstName: "Daniel", year: 2026 });
    actAs({ ...other, role: "employee" });

    const res = await cancelLeaveAction({}, form({ requestId: row.id }));
    expect(res.error).toMatch(/not found/i);
    expect(await db.select().from(leaveRequests)).toHaveLength(1);
  });

  it("refuses to withdraw a request that was already decided", async () => {
    await applyLeaveAction({}, form({
      leaveType: "paid", startDate: MON, endDate: FRI, remarks: "",
    }));
    const [row] = await db.select().from(leaveRequests);

    actAs({ ...admin, role: "admin" });
    await decideLeaveAction({}, form({ requestId: row.id, decision: "approved", comment: "" }));

    actAs({ ...employee, role: "employee" });
    const res = await cancelLeaveAction({}, form({ requestId: row.id }));
    expect(res.error).toMatch(/only pending requests/i);
  });
});

describe("decideLeaveAction", () => {
  async function pendingRequest() {
    actAs({ ...employee, role: "employee" });
    await applyLeaveAction({}, form({
      leaveType: "paid", startDate: MON, endDate: FRI, remarks: "",
    }));
    const [row] = await db.select().from(leaveRequests);
    actAs({ ...admin, role: "admin" });
    return row;
  }

  it("approving stamps every weekday of the range onto attendance", async () => {
    const req = await pendingRequest();

    const res = await decideLeaveAction({}, form({
      requestId: req.id, decision: "approved", comment: "Enjoy.",
    }));
    expect(res.ok).toMatch(/approved/i);

    const rows = await db
      .select()
      .from(attendance)
      .where(eq(attendance.employeeId, employee.employeeId));

    expect(rows).toHaveLength(5);
    expect(rows.every((r) => r.status === "leave")).toBe(true);
    expect(rows.map((r) => r.workDate).sort()).toEqual([
      "2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11",
    ]);
  });

  it("approving does not stamp the weekend", async () => {
    actAs({ ...employee, role: "employee" });
    await applyLeaveAction({}, form({
      leaveType: "paid", startDate: MON, endDate: "2026-09-14", remarks: "",
    }));
    const [req] = await db.select().from(leaveRequests);
    actAs({ ...admin, role: "admin" });

    await decideLeaveAction({}, form({ requestId: req.id, decision: "approved", comment: "" }));

    const weekend = await db
      .select()
      .from(attendance)
      .where(and(
        eq(attendance.employeeId, employee.employeeId),
        eq(attendance.workDate, "2026-09-12"),
      ));
    expect(weekend).toHaveLength(0);
  });

  it("overwrites an existing attendance row rather than failing on conflict", async () => {
    await db.insert(attendance).values({
      employeeId: employee.employeeId,
      workDate: MON,
      status: "absent",
    });
    const req = await pendingRequest();

    await decideLeaveAction({}, form({ requestId: req.id, decision: "approved", comment: "" }));

    const [row] = await db
      .select()
      .from(attendance)
      .where(and(
        eq(attendance.employeeId, employee.employeeId),
        eq(attendance.workDate, MON),
      ));
    expect(row.status).toBe("leave");
  });

  it("rejecting records the decision and touches no attendance", async () => {
    const req = await pendingRequest();

    const res = await decideLeaveAction({}, form({
      requestId: req.id, decision: "rejected", comment: "Short-staffed.",
    }));

    expect(res.ok).toMatch(/rejected/i);
    const [row] = await db.select().from(leaveRequests);
    expect(row.status).toBe("rejected");
    expect(row.decisionComment).toBe("Short-staffed.");
    expect(row.decidedByUserId).toBe(admin.userId);
    expect(await db.select().from(attendance)).toHaveLength(0);
  });

  it("refuses to decide the same request twice", async () => {
    const req = await pendingRequest();
    await decideLeaveAction({}, form({ requestId: req.id, decision: "approved", comment: "" }));

    const res = await decideLeaveAction({}, form({
      requestId: req.id, decision: "rejected", comment: "changed my mind",
    }));
    expect(res.error).toMatch(/already decided/i);

    const [row] = await db.select().from(leaveRequests);
    expect(row.status).toBe("approved");
  });

  it("rejects an unknown decision value", async () => {
    const req = await pendingRequest();
    const res = await decideLeaveAction({}, form({
      requestId: req.id, decision: "maybe", comment: "",
    }));
    expect(res.error).toMatch(/approve or reject/i);
  });

  it("frees the balance back up once a request is rejected", async () => {
    const tight = await seedEmployee({ firstName: "Priya", year: 2026, paidDays: 5 });
    actAs({ ...tight, role: "employee" });
    await applyLeaveAction({}, form({
      leaveType: "paid", startDate: MON, endDate: FRI, remarks: "",
    }));
    const [req] = await db.select().from(leaveRequests);

    actAs({ ...admin, role: "admin" });
    await decideLeaveAction({}, form({ requestId: req.id, decision: "rejected", comment: "" }));

    actAs({ ...tight, role: "employee" });
    const res = await applyLeaveAction({}, form({
      leaveType: "paid", startDate: "2026-09-14", endDate: "2026-09-18", remarks: "",
    }));
    expect(res.ok).toBeTruthy();
  });
});

describe("concurrent submits", () => {
  /**
   * Regression: the overlap and balance checks were read-then-write, so two
   * requests landing together could both pass and both insert, taking the
   * employee past their entitlement. The employee row is locked now.
   */
  it("lets only one of two simultaneous identical requests through", async () => {
    const submit = () =>
      applyLeaveAction({}, form({
        leaveType: "paid", startDate: MON, endDate: FRI, remarks: "",
      }));

    const results = await Promise.all([submit(), submit()]);

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => r.error)).toHaveLength(1);
    expect(await db.select().from(leaveRequests)).toHaveLength(1);
  });

  it("does not let simultaneous requests exceed the balance between them", async () => {
    const tight = await seedEmployee({ firstName: "Tight", year: 2026, paidDays: 5 });
    actAs({ ...tight, role: "employee" });

    // Two non-overlapping 5-day requests; only one can fit in a 5-day balance.
    const results = await Promise.all([
      applyLeaveAction({}, form({
        leaveType: "paid", startDate: MON, endDate: FRI, remarks: "",
      })),
      applyLeaveAction({}, form({
        leaveType: "paid", startDate: "2026-09-14", endDate: "2026-09-18", remarks: "",
      })),
    ]);

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    const rows = await db.select().from(leaveRequests);
    expect(rows.reduce((n, r) => n + r.days, 0)).toBeLessThanOrEqual(5);
  });
});

describe("concurrent leave decisions", () => {
  /**
   * Regression: the withdraw path used to re-check `status === "pending"` with
   * a select and then delete by id alone. An admin approving in that window
   * left the `leave` attendance rows behind with no request to explain them,
   * so the employee stayed blocked from checking in.
   */
  it("refuses to withdraw a request an admin has already approved", async () => {
    actAs({ ...employee, role: "employee" });
    await applyLeaveAction({}, form({
      leaveType: "paid", startDate: MON, endDate: FRI, remarks: "",
    }));
    const [req] = await db.select().from(leaveRequests);

    actAs({ ...admin, role: "admin" });
    await decideLeaveAction({}, form({
      requestId: req.id, decision: "approved", comment: "",
    }));

    actAs({ ...employee, role: "employee" });
    const res = await cancelLeaveAction({}, form({ requestId: req.id }));

    expect(res.error).toMatch(/no longer be withdrawn|Only pending/i);
    const rows = await db.select().from(leaveRequests);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("approved");
  });

  it("keeps approved leave attendance and its request consistent", async () => {
    actAs({ ...employee, role: "employee" });
    await applyLeaveAction({}, form({
      leaveType: "paid", startDate: MON, endDate: FRI, remarks: "",
    }));
    const [req] = await db.select().from(leaveRequests);

    actAs({ ...admin, role: "admin" });
    await decideLeaveAction({}, form({
      requestId: req.id, decision: "approved", comment: "",
    }));

    const marked = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.employeeId, employee.employeeId), eq(attendance.status, "leave")));
    expect(marked).toHaveLength(5);

    // Every attendance row marked `leave` still has its request behind it.
    const [still] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, req.id));
    expect(still.status).toBe("approved");
  });

  /**
   * Regression: two admins deciding at once both passed the pending check and
   * both wrote. An approve followed by a reject left `leave` attendance rows
   * written by the approve branch behind a rejected request.
   */
  it("lets only one of two simultaneous decisions win", async () => {
    actAs({ ...employee, role: "employee" });
    await applyLeaveAction({}, form({
      leaveType: "paid", startDate: MON, endDate: FRI, remarks: "",
    }));
    const [req] = await db.select().from(leaveRequests);

    actAs({ ...admin, role: "admin" });
    // Fired together so both pass the pending pre-check and race on the write.
    // Without the status predicate in the UPDATE, both commit and the loser
    // overwrites the winner — leaving `leave` attendance rows behind a
    // rejected request.
    const [a, b] = await Promise.all([
      decideLeaveAction({}, form({ requestId: req.id, decision: "approved", comment: "first" })),
      decideLeaveAction({}, form({ requestId: req.id, decision: "rejected", comment: "second" })),
    ]);

    const wins = [a, b].filter((r) => r.ok);
    const losses = [a, b].filter((r) => r.error);
    expect(wins).toHaveLength(1);
    expect(losses).toHaveLength(1);
    expect(losses[0].error).toMatch(/already decided/i);

    const [row] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, req.id));
    const marked = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.employeeId, employee.employeeId), eq(attendance.status, "leave")));

    // The surviving status and the attendance rows must agree: `leave` rows
    // exist if and only if the request ended up approved.
    expect(marked.length > 0).toBe(row.status === "approved");
  });

  it("does not withdraw a request while a decision is landing", async () => {
    actAs({ ...employee, role: "employee" });
    await applyLeaveAction({}, form({
      leaveType: "paid", startDate: MON, endDate: FRI, remarks: "",
    }));
    const [req] = await db.select().from(leaveRequests);

    const decide = (async () => {
      actAs({ ...admin, role: "admin" });
      return decideLeaveAction({}, form({ requestId: req.id, decision: "approved", comment: "" }));
    })();
    const cancel = cancelLeaveAction({}, form({ requestId: req.id }));
    const [decided, cancelled] = await Promise.all([decide, cancel]);

    const rows = await db.select().from(leaveRequests).where(eq(leaveRequests.id, req.id));
    const marked = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.employeeId, employee.employeeId), eq(attendance.status, "leave")));

    if (decided.ok && rows.length === 1) {
      // Approval won: the withdraw must have been refused, and the attendance
      // rows it wrote must still have their request behind them.
      expect(cancelled.error).toBeTruthy();
      expect(rows[0].status).toBe("approved");
    } else {
      // Withdraw won: nothing may be left marked as leave.
      expect(rows).toHaveLength(0);
      expect(marked).toHaveLength(0);
    }
  });
});
