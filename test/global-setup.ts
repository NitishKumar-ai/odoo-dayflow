import { execSync } from "node:child_process";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://localhost:5432/dayflow_test";

/**
 * Push the Drizzle schema into the test database once per run, so integration
 * tests always match src/db/schema.ts without a migration step to remember.
 */
export default function setup() {
  execSync("npx drizzle-kit push --force", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
