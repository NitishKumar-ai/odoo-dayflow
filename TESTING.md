# Testing

100% test coverage is the key to great vibe coding. Tests let you move fast,
trust your instincts, and ship with confidence — without them, vibe coding is
just yolo coding. With tests, it's a superpower.

## Framework

Vitest 4 with jsdom, `@testing-library/react`, and `@testing-library/jest-dom`.
Path aliases (`@/...`) resolve through `vite-tsconfig-paths`, so tests import
exactly what the app imports.

## Running

```bash
npm test          # run once
npm run test:watch # re-run on change
npm test -- test/leave.test.ts   # a single file
```

## Layers

**Unit tests** — `test/*.test.ts`. Pure functions in `src/lib/`: date maths,
leave-day counting, attendance status derivation, salary arithmetic, password
rules. These carry the business rules the requirements document left open, so
they are the most valuable tests in the project. No database, no server.

**Component tests** — `test/*.test.tsx`. Client components rendered with
Testing Library. Assert what a user sees and can do, never implementation
detail.

**Integration tests** — `test/*-actions.test.ts` and `test/session.test.ts`,
each marked `// @vitest-environment node`. These run the real server actions
against a real Postgres database, so the guards that fail silently are covered:
leave balance and overlap checks, the self-lockout guard, deductions exceeding
gross, approval writing through to attendance, and every rejection branch of
`getSessionUser`.

The database is `dayflow_test`, set by `TEST_DATABASE_URL` (default
`postgres://localhost:5432/dayflow_test`). `test/global-setup.ts` pushes the
Drizzle schema into it once per run, so it always matches `src/db/schema.ts`
with no migration step to remember. `resetDb()` truncates every table between
tests, and `seedEmployee()` builds a user, profile, and leave balances in one
call. Because they share one database, `fileParallelism` is off.

Create it once locally:

```bash
createdb dayflow_test
```

Two gotchas worth knowing. `vi.useFakeTimers()` must be scoped with
`{ toFake: ["Date"] }` — faking `setTimeout` deadlocks the Postgres driver.
And `vi.mock` is hoisted above imports, so its factory has to be written
inline rather than referencing an imported helper.

**End-to-end tests** — not yet present. The server actions behind each flow are
covered at the integration layer; what is still unproven is the wiring from a
rendered page to those actions. The flows worth covering first: sign-up through
verification, check-in/check-out over a full day, and HR approval seen from the
employee's own attendance view.

## Conventions

- One test file per module, named after it: `src/lib/leave.ts` → `test/leave.test.ts`.
- `describe` names the unit; `it` states the behaviour in plain language
  ("does not charge the employee for weekends inside the range"), not the
  function name.
- Assert real behaviour with real values. Never `expect(x).toBeDefined()`.
- Test both sides of every branch, and the exact boundary — the half-day and
  full-day thresholds are tested at the threshold, not just around it.
- When a test encodes an assumption about a platform API, verify the assumption
  first and comment it. `formatMoney` taught us that `Intl` accepts any
  well-formed currency code and separates it with a non-breaking space.
- Never import secrets, API keys, or credentials into a test.

## Fixtures and dates

Dates are handled as local `YYYY-MM-DD` strings to match Postgres `date`
columns. Tests use fixed 2026 dates with the weekday named in a comment, so a
failure tells you which day was wrong.
