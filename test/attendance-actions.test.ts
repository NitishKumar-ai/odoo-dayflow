// @vitest-environment node
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { and, eq } from "drizzle-orm";
import { resetDb, seedEmployee, type SeededEmployee } from "./helpers/db";
import { actAs } from "./helpers/session";
import { db } from "@/db";
import { attendance } from "@/db/schema";
import { today } from "@/lib/dates";

vi.mock("@/lib/auth", async () => (await import("./helpers/session")).authMock());

const {
  checkInAction,
  checkOutAction,
  setAttendanceStatusAction,
} = await import("@/actions/attendance");

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

afterEach(() => vi.useRealTimers());

describe("checkInAction", () => {
  it("opens today's record and marks it present", async () => {
    const res = await checkInAction({}, new FormData());
    expect(res.ok).toBeTruthy();

    const [row] = await db.select().from(attendance);
    expect(row.workDate).toBe(today());
    expect(row.checkInAt).toBeInstanceOf(Date);
    expect(row.checkOutAt).toBeNull();
    expect(row.status).toBe("present");
  });

  it("refuses a second check-in on the same day", async () => {
    await checkInAction({}, new FormData());
    const res = await checkInAction({}, new FormData());

    expect(res.error).toMatch(/already checked in/i);
    expect(await db.select().from(attendance)).toHaveLength(1);
  });

  it("refuses to check in on a day already approved as leave", async () => {
    await db.insert(attendance).values({
      employeeId: employee.employeeId,
      workDate: today(),
      status: "leave",
    });

    const res = await checkInAction({}, new FormData());
    expect(res.error).toMatch(/approved leave/i);

    const [row] = await db.select().from(attendance);
    expect(row.checkInAt).toBeNull();
    expect(row.status).toBe("leave");
  });

  it("fills in a day an admin had marked absent without discarding the override", async () => {
    await db.insert(attendance).values({
      employeeId: employee.employeeId,
      workDate: today(),
      status: "absent",
      isManual: true,
    });

    await checkInAction({}, new FormData());

    const [row] = await db.select().from(attendance);
    expect(row.checkInAt).toBeInstanceOf(Date);
    expect(row.status).toBe("absent"); // the manual call still wins
  });
});

describe("checkOutAction", () => {
  it("refuses to check out before checking in", async () => {
    const res = await checkOutAction({}, new FormData());
    expect(res.error).toMatch(/not checked in/i);
  });

  it("derives present from a full day", async () => {
    // Fake Date only: the Postgres driver needs real timers to resolve queries.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 7, 9, 0, 0));
    await checkInAction({}, new FormData());
    vi.setSystemTime(new Date(2026, 8, 7, 18, 0, 0));
    await checkOutAction({}, new FormData());

    const [row] = await db.select().from(attendance);
    expect(row.status).toBe("present");
    expect(row.checkOutAt).toBeInstanceOf(Date);
  });

  it("derives half-day from a short day", async () => {
    // Fake Date only: the Postgres driver needs real timers to resolve queries.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 7, 9, 0, 0));
    await checkInAction({}, new FormData());
    vi.setSystemTime(new Date(2026, 8, 7, 13, 0, 0));
    await checkOutAction({}, new FormData());

    const [row] = await db.select().from(attendance);
    expect(row.status).toBe("half_day");
  });

  it("derives absent from a token appearance", async () => {
    // Fake Date only: the Postgres driver needs real timers to resolve queries.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 7, 9, 0, 0));
    await checkInAction({}, new FormData());
    vi.setSystemTime(new Date(2026, 8, 7, 10, 0, 0));
    await checkOutAction({}, new FormData());

    const [row] = await db.select().from(attendance);
    expect(row.status).toBe("absent");
  });

  it("refuses a second check-out", async () => {
    await checkInAction({}, new FormData());
    await checkOutAction({}, new FormData());
    const res = await checkOutAction({}, new FormData());
    expect(res.error).toMatch(/already checked out/i);
  });

  it("leaves an admin override intact on check-out", async () => {
    // Fake Date only: the Postgres driver needs real timers to resolve queries.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 7, 9, 0, 0));
    await checkInAction({}, new FormData());
    await db
      .update(attendance)
      .set({ status: "half_day", isManual: true })
      .where(eq(attendance.employeeId, employee.employeeId));

    vi.setSystemTime(new Date(2026, 8, 7, 19, 0, 0));
    await checkOutAction({}, new FormData());

    const [row] = await db.select().from(attendance);
    expect(row.status).toBe("half_day"); // not re-derived to present
  });
});

describe("setAttendanceStatusAction", () => {
  beforeEach(() => actAs({ ...admin, role: "admin" }));

  it("creates a record for a day that had none", async () => {
    const res = await setAttendanceStatusAction({}, form({
      employeeId: employee.employeeId,
      workDate: "2026-09-07",
      status: "absent",
      note: "No show",
    }));

    expect(res.ok).toBeTruthy();
    const [row] = await db.select().from(attendance);
    expect(row.status).toBe("absent");
    expect(row.note).toBe("No show");
    expect(row.isManual).toBe(true);
  });

  it("overwrites an existing record and marks it manual", async () => {
    await db.insert(attendance).values({
      employeeId: employee.employeeId,
      workDate: "2026-09-07",
      status: "present",
    });

    await setAttendanceStatusAction({}, form({
      employeeId: employee.employeeId,
      workDate: "2026-09-07",
      status: "half_day",
      note: "Client visit",
    }));

    const [row] = await db
      .select()
      .from(attendance)
      .where(and(
        eq(attendance.employeeId, employee.employeeId),
        eq(attendance.workDate, "2026-09-07"),
      ));
    expect(row.status).toBe("half_day");
    expect(row.isManual).toBe(true);
  });

  it("rejects a status outside the four the spec allows", async () => {
    const res = await setAttendanceStatusAction({}, form({
      employeeId: employee.employeeId,
      workDate: "2026-09-07",
      status: "on_holiday",
      note: "",
    }));
    expect(res.error).toMatch(/unknown attendance status/i);
    expect(await db.select().from(attendance)).toHaveLength(0);
  });

  it("rejects a call with no employee or date", async () => {
    const res = await setAttendanceStatusAction({}, form({
      employeeId: "", workDate: "", status: "present", note: "",
    }));
    expect(res.error).toMatch(/missing employee or date/i);
  });

  it("refuses to run for a non-admin", async () => {
    actAs({ ...employee, role: "employee" });
    await expect(
      setAttendanceStatusAction({}, form({
        employeeId: employee.employeeId,
        workDate: "2026-09-07",
        status: "present",
        note: "",
      })),
    ).rejects.toThrow(/not an admin/i);
  });
});
