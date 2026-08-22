import { describe, it, expect } from "vitest";
import { countLeaveDays, DEFAULT_ENTITLEMENT, LEAVE_TYPE_LABEL } from "@/lib/leave";

describe("countLeaveDays", () => {
  it("counts a plain Monday-to-Friday range as five days", () => {
    expect(countLeaveDays("2026-08-17", "2026-08-21")).toBe(5);
  });

  it("does not charge the employee for weekends inside the range", () => {
    // Mon 17th through Mon 24th spans 8 calendar days but only 6 working ones.
    expect(countLeaveDays("2026-08-17", "2026-08-24")).toBe(6);
  });

  it("returns zero for a weekend-only range", () => {
    expect(countLeaveDays("2026-08-22", "2026-08-23")).toBe(0);
  });

  it("counts a single weekday as one day", () => {
    expect(countLeaveDays("2026-08-19", "2026-08-19")).toBe(1);
  });

  it("counts a full month without drifting", () => {
    // September 2026 has 22 weekdays.
    expect(countLeaveDays("2026-09-01", "2026-09-30")).toBe(22);
  });
});

describe("leave configuration", () => {
  it("gives more paid days than sick days", () => {
    expect(DEFAULT_ENTITLEMENT.paid).toBeGreaterThan(DEFAULT_ENTITLEMENT.sick);
  });

  it("labels every leave type the spec names", () => {
    expect(Object.keys(LEAVE_TYPE_LABEL).sort()).toEqual(["paid", "sick", "unpaid"]);
  });
});
