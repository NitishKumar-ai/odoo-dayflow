// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { and, eq } from "drizzle-orm";
import { resetDb, seedEmployee } from "./helpers/db";
import { db } from "@/db";
import { leaveBalances } from "@/db/schema";
import { ensureLeaveBalances, leaveSummary } from "@/lib/leave-queries";
import { DEFAULT_ENTITLEMENT } from "@/lib/leave";

beforeEach(async () => {
  await resetDb();
});

describe("leaveSummary", () => {
  it("materialises default entitlements when the year has no rows", async () => {
    const emp = await seedEmployee({ firstName: "Rohan", year: 2025 });

    const rows = await leaveSummary(emp.employeeId, 2026);

    expect(rows).toHaveLength(2);
    expect(rows).toEqual(
      expect.arrayContaining([
        {
          leaveType: "paid",
          entitled: DEFAULT_ENTITLEMENT.paid,
          used: 0,
          left: DEFAULT_ENTITLEMENT.paid,
        },
        {
          leaveType: "sick",
          entitled: DEFAULT_ENTITLEMENT.sick,
          used: 0,
          left: DEFAULT_ENTITLEMENT.sick,
        },
      ]),
    );
  });

  it("does not overwrite a custom entitlement that already exists", async () => {
    const emp = await seedEmployee({
      firstName: "Mei",
      year: 2026,
      paidDays: 25,
      sickDays: 8,
    });

    const rows = await leaveSummary(emp.employeeId, 2026);
    const paid = rows.find((r) => r.leaveType === "paid");
    const sick = rows.find((r) => r.leaveType === "sick");

    expect(paid?.entitled).toBe(25);
    expect(paid?.left).toBe(25);
    expect(sick?.entitled).toBe(8);
  });
});

describe("ensureLeaveBalances", () => {
  it("fills in a missing type without touching the other", async () => {
    const emp = await seedEmployee({ firstName: "Sam", year: 2026, paidDays: 25 });

    await db
      .delete(leaveBalances)
      .where(
        and(
          eq(leaveBalances.employeeId, emp.employeeId),
          eq(leaveBalances.leaveType, "sick"),
        ),
      );

    await ensureLeaveBalances(emp.employeeId, 2026);

    const rows = await db
      .select()
      .from(leaveBalances)
      .where(eq(leaveBalances.employeeId, emp.employeeId));
    const paid = rows.find((r) => r.leaveType === "paid");
    const sick = rows.find((r) => r.leaveType === "sick");

    expect(paid?.entitledDays).toBe(25);
    expect(sick?.entitledDays).toBe(DEFAULT_ENTITLEMENT.sick);
  });
});
