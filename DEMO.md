# Dayflow — Demo Guide

Everything a presenter needs, in one page.

## Credentials

| Role | Email |
|---|---|
| HR / Admin | `asha@dayflow.test` |
| Employee | `rohan@dayflow.test` |

Every seeded account shares one password, held in `DEMO_SEED_PASSWORD` in
`.env.local` — which is git-ignored and stays on the presenter's machine. Read
it there:

```bash
grep DEMO_SEED_PASSWORD .env.local
```

The other seeded employees (`priya@`, `daniel@`, `mei@`, `sam@` `dayflow.test`)
use the same password, if a second employee is needed on screen.

**This repository is public.** Never write the password into a tracked file,
and never reuse the local demo password on the production deployment.

Local URL: http://localhost:3000 · Production: https://odoo-dayflow-steel.vercel.app

## Before you present

```bash
npm run dev
```

Open http://localhost:3000/signin in a fresh incognito window so no old
session is in the way.

## The 8-minute run-through

### 1. Employee (sign in as Rohan)

1. **Sign in** — enter a wrong password first; the form says
   "Incorrect email or password." Then sign in properly.
2. **Dashboard** — punch clock at the top, days present this week, leave
   balances, net pay, the weekly attendance strip, and an activity timeline.
3. **Check in / check out** — Rohan is already clocked in for today, so
   **Clock Out** is the live action to demo. Status is derived from hours
   worked: 6+ is Present, 3–6 is Half-day, under 3 is Absent. To demo a
   check-in instead, clear today's row first:

   ```bash
   psql "$DATABASE_URL" -c "delete from attendance a using employees e, users u where a.employee_id=e.id and e.user_id=u.id and u.email='rohan@dayflow.test' and a.work_date=current_date;"
   ```
4. **Attendance** (`/attendance`) — daily log, the current week with worked
   hours, and a 14-day trail. Weekends are marked Weekend Off.
5. **Leave** (`/leave`) — apply for Paid, Sick, or Unpaid leave with a date
   range and remarks. Show the quota cards and the existing pending request.
6. **Payroll** (`/payroll`) — the salary breakdown is read-only for employees,
   with a revision history table.
7. Try `/admin/leave` in the address bar — it redirects to the dashboard.
   Authorisation is checked per action, not just per route.
8. **Sign out** — the icon at the top right of the header.

### 2. HR / Admin (sign in as Asha)

1. **Dashboard** — an extra "HR & Administration Overview" band appears:
   pending approvals, active headcount, present staff today.
2. **Employees** (`/admin/employees`) — the directory, searchable, with a
   "1 leave pending" flag against anyone awaiting a decision.
3. **Open an employee** — job details, access level, leave balances, documents,
   the week's attendance with manual override, and the salary structure form.
4. **Approvals** (`/admin/leave`) — pick Rohan's pending request, type a note,
   and click Approve.
5. **Attendance** (`/admin/attendance`) — the company-wide daily matrix and a
   weekly heatmap, with per-row overrides.
6. **Payroll** (`/admin/payroll`) — total monthly liability and every
   compensation profile. Saving a change creates a dated revision rather than
   overwriting history.

### 3. Back to the employee — the moment that lands

Sign in as Rohan again and open `/leave`. The request now reads **Approved**
with the HR note underneath, and every weekday in the range has been stamped as
`leave` on the attendance record. Nothing was touched in the database by hand.

## What is deliberately not built

Say these before someone asks:

- **Verification email is not delivered.** Sign-up mints a real single-use
  24-hour token, but no mail provider is wired up — the link is written to the
  server log, and in development it is offered on the confirmation page.
- **Sign-up cannot choose HR.** Public registration always creates an employee.
  An admin promotes someone from the employee detail page. A role picker on a
  public form is a privilege-escalation hole.
- **Document upload.** Documents are modelled and listed; the files behind them
  are placeholders.
- **Payslip PDFs and reports** are listed as future work in the spec.

## If something goes wrong on the day

Reseed a clean database — this wipes and rebuilds all demo data:

```bash
npm run db:seed
```

`DEMO_SEED_PASSWORD` in `.env.local` sets the password for every seeded account.
