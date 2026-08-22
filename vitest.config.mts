import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import {
  assertTestDatabaseUrl,
  DEFAULT_TEST_DATABASE_URL,
} from "./test/helpers/test-db-url";

// Tests truncate and force-push schema, so the URL must name a test database.
// The same guard runs again at setup and before each truncate.
const TEST_DATABASE_URL = assertTestDatabaseUrl(
  process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL,
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(
        new URL("./test/helpers/server-only-stub.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    globalSetup: ["./test/global-setup.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
    globals: true,
    // Integration tests share one database, so they must not run concurrently.
    fileParallelism: false,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      SESSION_SECRET: "test-only-secret-not-used-for-anything-real-0123456789",
      APP_URL: "http://localhost:3000",
    },
  },
});
