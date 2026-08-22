/**
 * Integration tests push a schema with `--force` and truncate every table.
 * Pointing that at a real database would destroy it, so the URL has to prove
 * it is a test database before anything destructive runs.
 */
export const DEFAULT_TEST_DATABASE_URL = "postgres://localhost:5432/dayflow_test";

export function assertTestDatabaseUrl(url: string | undefined): string {
  if (!url) {
    throw new Error(
      "No test database URL. Set TEST_DATABASE_URL, or create the default: createdb dayflow_test",
    );
  }

  let name: string;
  try {
    name = decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
  } catch {
    throw new Error(`TEST_DATABASE_URL is not a valid URL: ${url}`);
  }

  if (!name) {
    throw new Error(`TEST_DATABASE_URL names no database: ${url}`);
  }

  // The tests drop and truncate. Only ever let them near a database whose own
  // name says it is disposable.
  if (!/(^|[_-])test([_-]|$)/i.test(name)) {
    throw new Error(
      `Refusing to run destructive tests against database "${name}". ` +
        `Its name must contain "test" (for example dayflow_test). ` +
        `TEST_DATABASE_URL=${url}`,
    );
  }

  return url;
}

export function testDatabaseUrl(): string {
  return assertTestDatabaseUrl(
    process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL,
  );
}
