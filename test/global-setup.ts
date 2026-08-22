import { execSync } from "node:child_process";
import { testDatabaseUrl } from "./helpers/test-db-url";

/**
 * Push the Drizzle schema into the test database once per run, so integration
 * tests always match src/db/schema.ts without a migration step to remember.
 * `--force` rewrites schema, so the URL is checked before it runs.
 */
export default function setup() {
  const url = testDatabaseUrl();
  execSync("npx drizzle-kit push --force", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: url },
  });
}
