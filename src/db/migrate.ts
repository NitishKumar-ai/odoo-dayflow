/**
 * Applies the generated SQL migrations in ./drizzle to DATABASE_URL.
 *
 * `db:push` (drizzle-kit push) diffs the schema straight onto the database,
 * which is fine on a laptop but will happily drop a column against a real one.
 * Production goes through the versioned files instead, so every change is
 * reviewable and replayable.
 */
import "./load-env";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required to run migrations.");
    process.exit(1);
  }

  // A single connection, and no prepared statements: poolers used by hosted
  // Postgres reject them, and a migration run has nothing to gain from either.
  // Notices are silenced because a repeat run emits "already exists, skipping"
  // for the drizzle bookkeeping schema, which reads like a failure in a deploy
  // log and is not one.
  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });

  try {
    await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
    console.log("Migrations applied.");
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
