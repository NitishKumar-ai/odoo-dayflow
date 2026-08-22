import { describe, it, expect } from "vitest";
import {
  deriveStatus,
  workedHours,
  FULL_DAY_HOURS,
  HALF_DAY_HOURS,
  STATUS_LABEL,
} from "@/lib/attendance";

function at(hour: number, minute = 0) {
  return new Date(2026, 7, 19, hour, minute, 0, 0);
}

describe("deriveStatus", () => {
  it("marks a day with no check-in as absent", () => {
    expect(deriveStatus(null, null)).toBe("absent");
  });

  it("treats an open day as present while the employee is still on the clock", () => {
    expect(deriveStatus(at(9), null)).toBe("present");
  });

  it("marks a full working day as present", () => {
    expect(deriveStatus(at(9), at(18))).toBe("present");
  });

  it("marks exactly the full-day threshold as present, not half-day", () => {
    expect(deriveStatus(at(9), at(9 + FULL_DAY_HOURS))).toBe("present");
  });

  it("marks a short day as half-day", () => {
    expect(deriveStatus(at(9), at(13))).toBe("half_day");
  });

  it("marks exactly the half-day threshold as half-day, not absent", () => {
    expect(deriveStatus(at(9), at(9 + HALF_DAY_HOURS))).toBe("half_day");
  });

  it("marks a token appearance as absent", () => {
    expect(deriveStatus(at(9), at(10))).toBe("absent");
  });

  it("does not credit a check-out recorded before the check-in", () => {
    expect(deriveStatus(at(18), at(9))).toBe("absent");
  });
});

describe("workedHours", () => {
  it("formats hours and minutes", () => {
    expect(workedHours(at(9, 15), at(17, 45))).toBe("8h 30m");
  });

  it("shows a dash when the day is incomplete", () => {
    expect(workedHours(at(9), null)).toBe("—");
    expect(workedHours(null, null)).toBe("—");
  });
});

describe("status labels", () => {
  it("covers every status the spec lists", () => {
    expect(Object.keys(STATUS_LABEL).sort()).toEqual([
      "absent",
      "half_day",
      "leave",
      "present",
    ]);
  });
});
