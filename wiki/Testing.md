# Testing

Guide: [`TESTING.md`](../TESTING.md) in the repo root.

```bash
npm test                          # once
npm run test:watch
npm test -- test/leave.test.ts    # one file
```

Vitest 4, jsdom for components, `node` environment for actions. Path aliases
match the app. `fileParallelism` is off because integration tests share one
database.

## Layers

**Unit** — `test/*.test.ts`. Pure functions in `src/lib/`: leave-day counts,
attendance derivation, salary arithmetic, password rules. Highest value.
No database.

**Component** — `test/*.test.tsx`. Testing Library. Assert what the user sees,
not implementation.

**Integration** — `test/*-actions.test.ts` and `test/session.test.ts`, marked
`// @vitest-environment node`. Real server actions against real Postgres.

There are no browser end-to-end tests yet. That is a P2 in `TODOS.md`.

## Test database

Default URL: `postgres://localhost:5432/dayflow_test`
(`TEST_DATABASE_URL` overrides it).

`test/helpers/test-db-url.ts` refuses any database whose name does not contain
`test`. The suite force-pushes schema and truncates every table.

```bash
createdb dayflow_test
```

`test/global-setup.ts` runs `drizzle-kit push --force` once per run.
`resetDb()` truncates between tests. `seedEmployee()` builds a user, profile,
and leave balances.

## Conventions

- One test file per module: `src/lib/leave.ts` → `test/leave.test.ts`.
- `describe` names the unit; `it` states behaviour in plain language.
- Test both sides of a branch and the exact boundary (6h / 3h thresholds).
- Do not `expect(x).toBeDefined()`.
- `vi.useFakeTimers()` must use `{ toFake: ["Date"] }` — faking `setTimeout`
  deadlocks the Postgres driver.
- `vi.mock` factories must be inline; the mock is hoisted above imports.

## CI

[`ci/github-actions-test.yml`](../ci/github-actions-test.yml) runs typecheck,
tests (with a Postgres 15 service), and build. It is not under
`.github/workflows/` yet — committing it needs a token with `workflow` scope.
See [`ci/README.md`](../ci/README.md).

## Related

- [Getting started](Getting-Started.md)
- [Code layout](Code-Layout.md)
