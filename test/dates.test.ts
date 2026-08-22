import { describe, it, expect } from "vitest";
import {
  toDateKey,
  parseDateKey,
  weekRange,
  addDays,
  isWeekend,
  eachDate,
} from "@/lib/dates";

describe("toDateKey / parseDateKey", () => {
  it("pads month and day to two digits", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("round-trips a date key without shifting the day", () => {
    // Naive UTC parsing shifts the day for timezones behind UTC — this guards that.
    expect(toDateKey(parseDateKey("2026-03-01"))).toBe("2026-03-01");
  });
});

describe("weekRange", () => {
  it("starts the week on Monday when given a midweek date", () => {
    // 2026-08-19 is a Wednesday.
    const week = weekRange("2026-08-19");
    expect(week.start).toBe("2026-08-17");
    expect(week.end).toBe("2026-08-23");
    expect(week.days).toHaveLength(7);
  });

  it("keeps Sunday in the week that began the Monday before it", () => {
    // 2026-08-23 is a Sunday; it must not roll forward to its own week.
    expect(weekRange("2026-08-23").start).toBe("2026-08-17");
  });

  it("treats Monday as the first day of its own week", () => {
    expect(weekRange("2026-08-17").start).toBe("2026-08-17");
  });
});

describe("addDays", () => {
  it("crosses a month boundary", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
  });

  it("crosses a year boundary backwards", () => {
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("handles a leap day", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("isWeekend", () => {
  it("flags Saturday and Sunday only", () => {
    expect(isWeekend("2026-08-22")).toBe(true); // Sat
    expect(isWeekend("2026-08-23")).toBe(true); // Sun
    expect(isWeekend("2026-08-21")).toBe(false); // Fri
    expect(isWeekend("2026-08-24")).toBe(false); // Mon
  });
});

describe("eachDate", () => {
  it("is inclusive of both ends", () => {
    expect(eachDate("2026-08-17", "2026-08-19")).toEqual([
      "2026-08-17",
      "2026-08-18",
      "2026-08-19",
    ]);
  });

  it("returns a single day when start equals end", () => {
    expect(eachDate("2026-08-17", "2026-08-17")).toEqual(["2026-08-17"]);
  });

  it("returns nothing when the range is inverted", () => {
    expect(eachDate("2026-08-19", "2026-08-17")).toEqual([]);
  });
});
