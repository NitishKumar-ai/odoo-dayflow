# Dayflow — Human Resource Management System

*Every workday, perfectly aligned.*

An HRMS built to the Dayflow requirements spec: authentication with email
verification, role-based access for HR/Admin and Employee, profile management,
attendance tracking, leave workflows with approvals, and payroll visibility.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, Turbopack) |
| Database | PostgreSQL 15 via Drizzle ORM |
| Auth | Email + password, bcrypt hashes, HS256 JWT in an httpOnly cookie (`jose`) |
| Styling | Tailwind CSS v4, light and dark themes |
| Validation | Zod on every server action |

## Getting started

```bash
npm install
```

Create `.env.local`:

```
DATABASE_URL=postgres://USER@localhost:5432/dayflow
SESSION_SECRET=<a long random string>
APP_URL=http://localhost:3000
```

Then:

```bash
createdb dayflow
npm run db:migrate
npm run db:seed
npm run dev
```

A database that was created with an older `db:push` can keep using `npm run db:push`
to pick up schema changes. `db:migrate` is the path for a fresh or hosted database.

### Demo accounts

Seeded with the password `Dayflow#2026`:

| Role | Email |
|---|---|
| HR / Admin | `asha@dayflow.test` |
| Employee | `rohan@dayflow.test` |

The seed also creates four more employees, 30 days of attendance history, and a
spread of leave requests including two awaiting approval.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm run db:push` | Apply `src/db/schema.ts` to a development database |
| `npm run db:generate` | Write a SQL migration from schema changes |
| `npm run db:migrate` | Apply committed migrations in `drizzle/` |
| `npm run db:seed` | Wipe and reseed demo data |
| `npm run typecheck` | `tsc --noEmit` |

## How the spec maps to the code

| Requirement | Where |
|---|---|
| 3.1 Sign up / sign in / verification | `src/actions/auth.ts`, `src/app/(auth)/`, `src/app/verify-email/` |
| 3.2 Dashboards | `src/app/(app)/dashboard/page.tsx` |
| 3.3 Profile (view + limited self-edit) | `src/app/(app)/profile/`, `src/actions/profile.ts` |
| 3.4 Attendance (check-in/out, daily + weekly) | `src/app/(app)/attendance/`, `src/app/(app)/admin/attendance/`, `src/actions/attendance.ts` |
| 3.5 Leave apply + approve | `src/app/(app)/leave/`, `src/app/(app)/admin/leave/`, `src/actions/leave.ts` |
| 3.6 Payroll (read-only / admin edit) | `src/app/(app)/payroll/`, `src/app/(app)/admin/payroll/` |

Authorisation lives in `src/lib/auth.ts`: `requireUser()` and `requireAdmin()`
run in server components and in every server action, so a URL alone never grants
access. Admin pages redirect employees to their own dashboard.

## Decisions the spec left open

The requirements document stops at section 3.6 and skips sections 4 and 5, so a
few rules had to be chosen. Each is isolated so it is easy to change:

1. **How an attendance status is earned** — `src/lib/attendance.ts`.
   At check-out: 6+ hours is Present, 3–6 is Half-day, under 3 is Absent. A
   still-open day counts as Present. Approved leave and explicit HR overrides
   win over the derived value (`is_manual` marks an override).
2. **Leave quotas** — `src/lib/leave.ts`. The spec has no balance model, so
   employees get 18 paid and 12 sick days a year; unpaid leave is uncapped but
   still needs approval. Weekends never consume leave. Balances are per
   employee per calendar year in `leave_balances`.
3. **Overlapping requests** are rejected while an existing request for the same
   dates is pending or approved.
4. **Approval writes through to attendance** — approving a request stamps every
   weekday in the range as `leave`, satisfying "changes reflect immediately in
   employee records".
5. **Salary is versioned** rather than overwritten. Each save in the admin
   payroll form creates a revision keyed by its effective date, so history
   survives. Payslip generation is listed as future work in the spec.
6. **Password rules** — at least 10 characters with upper case, lower case, a
   number, and a symbol (`passwordProblems` in `src/lib/auth.ts`).

## Not yet wired up

- **Email delivery.** Signup creates a real, single-use, 24-hour verification
  token, but no SMTP provider is configured. The link is logged to the server
  console, and in development it is also offered on the confirmation page. Point
  `signUpAction` at a mail provider to finish this.
- **Document uploads.** Documents are modelled and displayed, but files are not
  uploaded — the seed rows carry placeholder URLs.
- **Payslips and reports.** Listed in the spec as future enhancements.
