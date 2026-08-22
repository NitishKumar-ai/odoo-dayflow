export type SeedEnvironment = {
  NODE_ENV?: string;
  DEMO_SEED_PASSWORD?: string;
  ALLOW_DEMO_SEED?: string;
};

export function validateSeedEnvironment(environment: SeedEnvironment): string {
  const password = environment.DEMO_SEED_PASSWORD;
  if (!password) {
    throw new Error("DEMO_SEED_PASSWORD is required to seed demo accounts.");
  }

  if (environment.NODE_ENV === "production" && environment.ALLOW_DEMO_SEED !== "true") {
    throw new Error("Refusing to wipe and seed a production database without ALLOW_DEMO_SEED=true.");
  }

  return password;
}
