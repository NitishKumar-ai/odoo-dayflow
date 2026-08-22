import { describe, it, expect } from "vitest";
import { gross, net, formatMoney, type SalaryParts } from "@/lib/money";

// Drizzle returns numeric columns as strings, so the maths must survive that.
const salary: SalaryParts = {
  currency: "INR",
  basic: "78000.00",
  hra: "31000.00",
  allowances: "9000.00",
  deductions: "9800.00",
};

describe("gross / net", () => {
  it("sums the string-typed earning components", () => {
    expect(gross(salary)).toBe(118000);
  });

  it("subtracts deductions from gross", () => {
    expect(net(salary)).toBe(108200);
  });

  it("does not concatenate the numeric strings", () => {
    // "78000" + "31000" would be "7800031000" if the coercion were missing.
    expect(gross(salary)).toBeLessThan(1_000_000);
  });

  it("handles an all-zero structure", () => {
    const zero: SalaryParts = {
      currency: "INR",
      basic: "0",
      hra: "0",
      allowances: "0",
      deductions: "0",
    };
    expect(gross(zero)).toBe(0);
    expect(net(zero)).toBe(0);
  });
});

/** Intl inserts non-breaking spaces; compare on ordinary spaces instead. */
function normalise(s: string) {
  return s.replace(/\u00a0/g, " ");
}

describe("formatMoney", () => {
  it("renders a currency amount without decimals", () => {
    expect(formatMoney(108200, "INR")).toMatch(/108,200/);
  });

  it("renders an unknown but well-formed currency code as-is", () => {
    // Intl accepts any three-letter code, so this does NOT hit the fallback.
    // Intl separates code and amount with a non-breaking space, so normalise it.
    expect(normalise(formatMoney(1000, "ZZZ"))).toBe("ZZZ 1,000");
  });

  it("falls back to a plain string when Intl rejects the currency code", () => {
    // A malformed code makes Intl throw; the fallback must still print a number.
    expect(normalise(formatMoney(1000, "Z"))).toBe("Z 1000");
  });
});
