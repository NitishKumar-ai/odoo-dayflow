import { describe, expect, it } from "vitest";
import { validateSeedEnvironment } from "../src/db/seed-environment";

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
        DEMO_SEED_PASSWORD: "secret",
      }),
    ).toThrow("Refusing to wipe and seed a production database without ALLOW_DEMO_SEED=true.");
  });

  it("allows production seeding when explicitly permitted", () => {
    expect(
      validateSeedEnvironment({
        NODE_ENV: "production",
        DEMO_SEED_PASSWORD: "secret",
        ALLOW_DEMO_SEED: "true",
      }),
    ).toBe("secret");
  });
});
