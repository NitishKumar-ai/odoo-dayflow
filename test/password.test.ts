import { describe, it, expect } from "vitest";
import { passwordProblems } from "@/lib/password";

describe("passwordProblems", () => {
  it("accepts a password meeting every rule", () => {
    expect(passwordProblems("Dayflow#2026")).toEqual([]);
  });

  it("rejects a short password even when it has every character class", () => {
    expect(passwordProblems("Ab1#defg")).toContain("be at least 10 characters");
  });

  it("names each missing character class", () => {
    expect(passwordProblems("aaaaaaaaaaaa")).toEqual([
      "include an uppercase letter",
      "include a number",
      "include a symbol",
    ]);
  });

  it("rejects a long password with no symbol", () => {
    expect(passwordProblems("Abcdefgh1234")).toEqual(["include a symbol"]);
  });

  it("reports every problem for an empty password", () => {
    expect(passwordProblems("")).toHaveLength(5);
  });
});
