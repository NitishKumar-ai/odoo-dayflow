import { describe, expect, it } from "vitest";
import { seedCompletionMessages, validateSeedEnvironment } from "../src/db/seed-environment";

const STRONG_PASSWORD = "LocalDemo#2026";

describe("validateSeedEnvironment", () => {
  it("requires a demo seed password", () => {
    expect(() => validateSeedEnvironment({ NODE_ENV: "development" })).toThrow(
      "DEMO_SEED_PASSWORD is required to seed demo accounts.",
    );
  });

  it("refuses production seeding without explicit permission", () => {
    expect(() =>
      validateSeedEnvironment({
        NODE_ENV: "production",
        DEMO_SEED_PASSWORD: STRONG_PASSWORD,
      }),
    ).toThrow("Refusing to wipe and seed a production database without ALLOW_DEMO_SEED=true.");
  });

  it("allows production seeding when explicitly permitted", () => {
    expect(
      validateSeedEnvironment({
        NODE_ENV: "production",
        DEMO_SEED_PASSWORD: STRONG_PASSWORD,
        ALLOW_DEMO_SEED: "true",
      }),
    ).toBe(STRONG_PASSWORD);
  });

  it("rejects weak passwords for seeded administrator accounts", () => {
    expect(() =>
      validateSeedEnvironment({
        NODE_ENV: "development",
        DEMO_SEED_PASSWORD: "secret",
      }),
    ).toThrow(/DEMO_SEED_PASSWORD must/);
  });

  it("never includes the seed password in completion output", () => {
    const output = seedCompletionMessages(2, "admin@example.test", "employee@example.test").join("\n");
    expect(output).not.toContain(STRONG_PASSWORD);
    expect(output).toContain("Seeded 2 users");
  });
});
