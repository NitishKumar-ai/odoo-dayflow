# Dayflow Code Wiki

Dayflow is a single Next.js HR portal for one company. Employees clock in,
apply for leave, and read their salary. HR manages people, attendance
overrides, leave approvals, and pay structures.

There is no separate API. Pages are server components that query Postgres
through Drizzle. Mutations are React server actions in `src/actions/`.

Repository: [NitishKumar-ai/odoo-dayflow](https://github.com/NitishKumar-ai/odoo-dayflow)

---

## Pages

| Page | What it covers |
|---|---|
| [Architecture](Architecture.md) | Process shape, auth model, request path |
| [Getting started](Getting-Started.md) | Env, database, demo accounts, scripts |
| [Data model](Data-Model.md) | Tables, enums, relationships |
| [Authentication](Authentication.md) | Sessions, verification, `requireUser` / `requireAdmin` |
| [Routes and pages](Routes-and-Pages.md) | Every URL, who can open it, which action it calls |
| [Attendance](Attendance.md) | Check-in, status derivation, HR override |
| [Leave](Leave.md) | Quotas, overlap, approval writing through to attendance |
| [Payroll](Payroll.md) | Versioned salary, money helpers, payslip gap |
| [Code layout](Code-Layout.md) | Folders, conventions, forms, dates, money |
| [Testing](Testing.md) | Vitest layers, test database guard |
| [Deploying](Deploying.md) | Hosted Postgres, env, first admin |
| [System and trade-offs](System_and_trade_of-Day-FLow.md) | Why each technical choice was made |

Long-form route catalogue, when present on the branch: `docs/ROUTING_PAGES.md`.

---

## Spec map

| Requirement | Code |
|---|---|
| 3.1 Sign up / sign in / verification | `src/actions/auth.ts`, `src/app/(auth)/`, `src/app/verify-email/` |
| 3.2 Dashboards | `src/app/(app)/dashboard/page.tsx` |
| 3.3 Profile | `src/app/(app)/profile/`, `src/actions/profile.ts` |
| 3.4 Attendance | `src/app/(app)/attendance/`, `src/app/(app)/admin/attendance/` |
| 3.5 Leave | `src/app/(app)/leave/`, `src/app/(app)/admin/leave/` |
| 3.6 Payroll | `src/app/(app)/payroll/`, `src/app/(app)/admin/payroll/` |
| Delivery status (beyond spec) | `src/app/(app)/admin/project/` |

---

## Still open

- Verification email is built and logged; nothing sends it.
- Documents are listed; files are not uploaded.
- Payslips and reports are not generated yet.
- CI workflow lives in `ci/` until a token with `workflow` scope can move it.
