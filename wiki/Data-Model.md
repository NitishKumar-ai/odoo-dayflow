# Data model

Source of truth: [`src/db/schema.ts`](../src/db/schema.ts).

Every user has exactly one employee row. Everything else hangs off
`employees` and cascades on delete.

```
users ─1:1─ employees ─┬─< attendance          unique (employee, work_date)
  │                    ├─< leave_requests
  │                    ├─< leave_balances      unique (employee, year, type)
  │                    ├─< salary_structures   unique (employee, effective_from)
  │                    ├─< documents
  │                    ├─< activity_log
  │                    └─< payslips            unique (run, employee)
  │
  ├─< email_verification_tokens
  └─< payroll_runs ─< payslips                 unique (period_start, period_end)
```

## Tables

| Table | Role |
|---|---|
| `users` | Login: employee code, email, password hash, role, `is_active`, `email_verified_at` |
| `email_verification_tokens` | Single-use token, 24-hour expiry, `used_at` |
| `employees` | Profile and job fields. Employee may edit phone, address, photo only |
| `attendance` | One row per person per day. `is_manual` freezes HR overrides |
| `leave_requests` | Type, range, weekday count, status, decision comment |
| `leave_balances` | Annual entitlement for paid and sick. Unpaid is not stored |
| `salary_structures` | Versioned pay. A save adds a row keyed by `effective_from` |
| `documents` | Name, category, URL. Seed uses placeholder `#` links |
| `activity_log` | Dashboard feed |
| `payroll_runs` | One company pay period (`draft` / `finalized`) |
| `payslips` | Frozen amounts for that run; a raise cannot rewrite them |

`employees.manager_id` exists and has no foreign key. No feature reads it, so
every admin can decide every leave request.

## Enums

| Name | Values |
|---|---|
| `role` | `admin`, `employee` |
| `attendance_status` | `present`, `absent`, `half_day`, `leave` |
| `leave_type` | `paid`, `sick`, `unpaid` |
| `leave_status` | `pending`, `approved`, `rejected` |

## Types Drizzle infers

`User`, `Employee`, `Attendance`, `LeaveRequest`, `SalaryStructure` are
exported from the schema file.

## Migrations

Committed SQL lives in [`drizzle/`](../drizzle/). `npm run db:generate` writes
the next file after you change `schema.ts`. `npm run db:migrate` applies them.

Integration tests do **not** use those files. `test/global-setup.ts` runs
`drizzle-kit push --force` against `dayflow_test` so the suite always matches
the schema file.

## Related

- [Leave](Leave.md) — how balances are used
- [Payroll](Payroll.md) — how salary versions are chosen
- [Getting started](Getting-Started.md)
