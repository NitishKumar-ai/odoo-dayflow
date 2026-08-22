# Dayflow HRMS — Testing & Quality Assurance Guide

This document outlines the testing architecture, Vitest framework setup, test layer breakdown, test database configuration (`dayflow_test`), CI/CD integration, and manual Quality Assurance (QA) verification protocols in **Dayflow HRMS**.

---

## 1. Testing Framework Architecture

Dayflow uses **Vitest 4** configured with `jsdom`, `@testing-library/react`, and `@testing-library/jest-dom`. TypeScript path aliases (`@/*`) resolve directly through `vite-tsconfig-paths` (`vitest.config.mts`).

### Execution Commands:

```bash
# Run complete test suite once
npm test

# Run tests in continuous watch mode
npm run test:watch

# Execute a specific test file
npm test -- test/leave.test.ts
```

---

## 2. Test Architecture Layers

```
                               ┌──────────────────────────┐
                               │   End-to-End Tests       │  (Roadmap)
                               └────────────┬─────────────┘
                                            │
                               ┌────────────▼─────────────┐
                               │   Integration Tests      │  test/*-actions.test.ts
                               │   (Node + dayflow_test)  │  test/session.test.ts
                               └────────────┬─────────────┘
                                            │
                               ┌────────────▼─────────────┐
                               │      Unit Tests          │  test/leave.test.ts
                               │   (Pure JS/TS rules)     │  test/attendance.test.ts
                               └──────────────────────────┘
```

### 2.1 Unit Tests (`test/*.test.ts`)
* **Scope**: Pure business logic functions in `src/lib/`: date calculations (`dates.ts`), leave-day counting (`leave.ts`), attendance status derivation (`attendance.ts`), salary calculations (`money.ts`), and password validation (`auth.ts`).
* **Environment**: Fast, in-memory execution with no database or server connections required.

### 2.2 Component Tests (`test/*.test.tsx`)
* **Scope**: Interactive Client Components rendered with Testing Library (`jsdom` environment).
* **Focus**: Asserts UI rendering, user interaction, input handling, and form states.

### 2.3 Integration Tests (`test/*-actions.test.ts`, `test/session.test.ts`)
* **Scope**: Server Actions (`src/actions/`) executing against a real PostgreSQL database (`dayflow_test`). Marked with `// @vitest-environment node`.
* **Covered Scenarios**:
  * Authorization guards (`requireUser`, `requireAdmin`).
  * Overlapping leave request rejection and balance quota checks.
  * Admin self-lockout prevention.
  * Approved leave writing through to daily attendance records.
  * Salary deduction calculations and effective date versioning.

---

## 3. Test Database Configuration (`dayflow_test`)

Integration tests run against a dedicated PostgreSQL database named `dayflow_test`.

### 3.1 Setup Test Database
Create the test database locally:

```bash
createdb dayflow_test
```

The database connection string defaults to `postgres://localhost:5432/dayflow_test` (configurable via `TEST_DATABASE_URL`).

### 3.2 Global Setup & Database Reset
* **Automatic Schema Push**: `test/global-setup.ts` pushes the Drizzle schema into `dayflow_test` automatically at the start of every test run.
* **Table Truncation**: `resetDb()` truncates all tables between individual test cases to ensure isolation.
* **Test Fixture Seeding**: `seedEmployee()` creates a complete user account, profile, and initial leave balance in a single call.
* **Parallelism**: `fileParallelism` is set to `false` in `vitest.config.mts` to prevent database state collision between test files.

---

## 4. CI/CD Pipeline Integration

Dayflow includes a production-ready GitHub Actions workflow configuration in `ci/github-actions-test.yml`:

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: dayflow_test
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
        env:
          TEST_DATABASE_URL: postgres://postgres:postgres@localhost:5432/dayflow_test
```

---

## 5. Manual QA Verification Matrix

| QA Test ID | Scenario | Expected Outcome | Verification Steps |
|---|---|---|---|
| **QA-01** | Employee Sign In | Successful JWT cookie setting & dashboard redirect | Enter `rohan@dayflow.test` / `Dayflow#2026`, verify redirect to `/dashboard`. |
| **QA-02** | Attendance Check-In | Button updates to Check-Out, record created | Click "Check In", verify timestamp and dashboard attendance pill update. |
| **QA-03** | Leave Overlap Rejection | Form rejects overlapping date ranges | Submit leave for range overlapping an existing pending request, confirm error alert. |
| **QA-04** | Admin Leave Approval | Status updates and attendance stamped | As admin (`asha@dayflow.test`), approve leave in `/admin/leave`. Verify status `approved` and attendance entry on `/admin/attendance`. |
| **QA-05** | Salary Structure Update | New effective-dated version saved | Update basic pay in `/admin/employees/[id]`. Confirm new row appears in salary history table. |
| **QA-06** | Self-Lockout Prevention | Admin cannot deactivate self | As admin, attempt to change own role to employee or deactivate account in edit form. Verify error alert. |
