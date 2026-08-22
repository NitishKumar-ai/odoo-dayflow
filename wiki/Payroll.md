# Payroll

Salary is a versioned structure, not a monthly payslip. Employees read.
HR writes a new revision.

## Versioned structure

`salary_structures` is unique on `(employee_id, effective_from)`. Saving the
admin form inserts a row (or updates that same effective date). History is
kept; there is no "delete a version" path.

[`pickCurrentSalary`](../src/lib/employee-queries.ts) / `getCurrentSalary`
pick the latest revision already in force on a date, or the soonest upcoming
one if nothing has started yet.

`getCurrentSalaries` is the batch path for `/admin/payroll`. It uses
`DISTINCT ON` so the page does not run one query per employee.

Numeric columns are strings. Use `gross`, `net`, and `formatMoney` in
[`src/lib/money.ts`](../src/lib/money.ts). Deductions larger than gross are
rejected in `updateSalaryAction`.

## Views

| Path | Who | What |
|---|---|---|
| `/payroll` | Any signed-in user | Own current structure + history |
| `/admin/payroll` | Admin | Company totals, missing-structure count, edit links |
| `/admin/employees/[id]` | Admin | `SalaryForm` (`updateSalaryAction`) |

Currency defaults to INR.

## Payslips

The spec lists payslips as future work. A raise must not rewrite a month
that was already paid, so a pay-period table has to exist before PDF
generation. Until then, the product describes **what someone is paid**, not
**what was paid in August**.

If this branch has `payroll_runs` / `payslips` in `schema.ts`, those rows
are the snapshot. `src/lib/payroll.ts` (when present) opens a run, copies
the salary in force at `period_end`, and `finalizePayrollRun` locks it.

## Related

- [Data model](Data-Model.md)
- [Routes and pages](Routes-and-Pages.md)
