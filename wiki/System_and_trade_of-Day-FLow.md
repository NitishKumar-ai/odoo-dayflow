# System and trade-offs — Dayflow

Dayflow is an HR portal: employees clock in and out, apply for leave, and read
their salary; HR approves leave, overrides attendance, and maintains pay.

This page explains **how the system is put together and what each choice costs**.
Every decision below buys something and gives something up — the point is to
record the price, so the next person changing this code knows whether the
original bargain still holds.

---

## Contents

- [The system in one picture](#the-system-in-one-picture)
- [Request lifecycle](#request-lifecycle)
- [Architecture decisions](#architecture-decisions)
- [Data model trade-offs](#data-model-trade-offs)
- [Rules that are conventions, not constraints](#rules-that-are-conventions-not-constraints)
- [Scaling profile — where it breaks first](#scaling-profile--where-it-breaks-first)
- [Known risks](#known-risks)
- [What I would change first](#what-i-would-change-first)
- [Deliberately out of scope](#deliberately-out-of-scope)

---

## The system in one picture

```
┌─────────────────────────────────────────────────────────────┐
│ Browser                                                     │
│   server-rendered HTML + a thin layer of client components   │
│   (forms driven by useActionState)                           │
└───────────────┬──────────────────────────┬──────────────────┘
                │ navigation               │ form POST
                ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Next.js 16 App Router — one process, no separate backend     │
│                                                             │
│  (auth) shell            (app) shell → requireUser()         │
│  signin / signup         dashboard, profile, attendance,     │
│  verify-email            leave, payroll, admin/* →           │
│                          requireAdmin()                      │
│                                                             │
│  page.tsx = server component ──── reads ────┐               │
│  actions/*.ts = "use server" ─── writes ────┤               │
│      zod validate → re-authorise → mutate   │               │
│      → logActivity() → revalidatePath()     │               │
└─────────────────────────────────────────────┼───────────────┘
                                              ▼
                                   ┌────────────────────────┐
                                   │ Postgres (Drizzle ORM) │
                                   │ postgres.js, max 5     │
                                   └────────────────────────┘
```

There is no API tier, no cache, no queue, no background worker. Everything the
product does happens inside one request against one database.

## Request lifecycle

**Read.** A route's server component calls `requireUser()` / `requireAdmin()`,
queries Drizzle directly, and renders. There is no loader, no client-side
fetching, no serialised API payload — the query result *is* the render input.

**Write.** A form posts to a `"use server"` action. The action re-derives the
session (it never trusts a hidden field for identity), validates with Zod,
mutates, appends to `activity_log`, then calls `revalidatePath()` for every view
the change touches — including the other role's view. Approving leave, for
example, revalidates `/admin/leave`, `/leave`, `/attendance`, and
`/admin/attendance`.

Every action returns the same shape, `{ error?: string; ok?: string }`, so the
forms can share one rendering pattern.

---

## Architecture decisions

### 1. Server actions instead of an API layer

**Chosen:** mutations are React server actions in `src/actions/`. There is no
REST or GraphQL surface.

**Buys:** no duplicated types between client and server, no hand-written fetch
wrappers, no API versioning, and forms that work before JavaScript loads.
Authorisation sits next to the mutation, which is why every action starts with
`requireUser()` or `requireAdmin()` rather than trusting the caller.

**Costs:** nothing outside this app can talk to Dayflow. A mobile client, a
payroll export, or a Slack bot would need an API built from nothing. Actions are
also awkward to test in isolation — they read cookies and call `redirect()`, so
they only really run inside a request.

**Revisit when:** a second consumer appears. Extract the domain logic in
`src/lib/` into functions that take an actor argument, and let both the action
and a route handler call them.

### 2. Server components query the database directly

**Chosen:** pages import `db` and write their own queries. There is no
repository or service layer; only queries used by more than one page are
promoted into `src/lib/*-queries.ts`.

**Buys:** the shortest possible path from question to markup, and no abstraction
that has to be understood before a page can be read.

**Costs:** query knowledge is spread across the route tree. The dashboard, the
attendance page, and the admin attendance page each build their own notion of
"this week's attendance". Changing the shape of an attendance query means
grepping the routes rather than editing one module.

**Revisit when:** the same query appears a third time — that is the promotion
signal already implied by `leave-queries.ts` and `employee-queries.ts`.

### 3. Custom cookie session instead of an auth library

**Chosen:** bcrypt (cost 12) for hashing, a `jose` HS256 JWT in the httpOnly
`dayflow_session` cookie, 8-hour lifetime, `sameSite=lax`, `secure` in
production.

**Buys:** one file (`src/lib/auth.ts`), no adapter, no provider config, and full
control over the shape of `SessionUser`.

**Costs:** everything an auth library ships is now our problem — no refresh
tokens, no "remember me", no session listing or remote logout, no rate limiting
on sign-in, no MFA, no password reset. Rotating `SESSION_SECRET` logs everyone
out at once (which is the only revocation mechanism there is).

**Notable detail:** the JWT carries only `sub`. `getSessionUser()` re-reads the
user *and* their employee row on every request, so deactivating an account or
un-verifying an email takes effect immediately instead of waiting out the
cookie. That is a deliberate trade of one join per request for instant
revocation — the right way round at this size, and the first thing to cache if
request volume ever justifies it.

### 4. Guards in layouts and in every action — no middleware

**Chosen:** `(app)/layout.tsx` calls `requireUser()`; admin pages call
`requireAdmin()`; every action re-checks independently. There is no
`middleware.ts`.

**Buys:** authorisation runs where the data is, with the full database available
— middleware runs before that and would only be able to check the cookie's
signature, not whether the account is still active. Nothing is protected by
routing alone.

**Costs:** the guard is a convention, and conventions get forgotten. A new admin
page that omits `requireAdmin()` is simply unprotected, and nothing in the build
will say so. The redirect-based failure mode (`requireAdmin()` sends non-admins
to `/dashboard`) is friendly but silent — it looks identical to a stale link.

**Mitigation worth adding:** a route-group-level `admin/layout.tsx` that calls
`requireAdmin()` once, so a forgotten call in a page is backstopped.

### 5. Postgres as the only piece of infrastructure

**Chosen:** one Postgres database via `postgres.js` with `max: 5`, cached on
`globalThis` in development so hot reload does not leak connections.

**Buys:** transactions where they matter (sign-up creates user + employee +
balances + token atomically; approving leave decides the request and stamps
attendance in one transaction), no eventual consistency to reason about, and a
deployment that is one service plus one database.

**Costs:** `max: 5` is sized for a long-lived Node process. On a serverless
platform where each instance opens its own pool, that number multiplies by
instance count and will exhaust Postgres' connection limit — a pooler
(PgBouncer, Neon/Supabase pooling) becomes mandatory before that kind of deploy.

### 6. Drizzle ORM, schema-first, migrations not committed

**Chosen:** `src/db/schema.ts` is the source of truth; `drizzle.config.ts` points
at it. No migration files are tracked, so the documented setup path is
`drizzle-kit push`.

**Buys:** SQL-shaped queries with real types, no generated client step, and
raw `sql` template escape hatches where the query wants to be SQL (the correlated
`pendingLeave` subquery in `listEmployees`, the `sum(days)::int` rollup in
`daysUsed`).

**Costs:** `push` diffs a live database against the schema file. That is fine for
a development database and unsafe for production data, where a column rename can
present as a drop and recreate. There is no migration history to review, roll
back, or replay onto a fresh environment.

**Revisit:** before the first real deployment. Switch to
`drizzle-kit generate` + `migrate` and commit `drizzle/`.

### 7. Tailwind v4, configured in CSS

**Chosen:** design tokens live in `src/app/globals.css` under `@theme inline`;
there is no `tailwind.config.js`.

**Buys:** one place for tokens, and semantic class names (`card`, `btn-secondary`,
`text-muted`) that keep the route files readable.

**Costs:** status colours are string blobs in TypeScript (`STATUS_TONE`,
`LEAVE_STATUS_TONE` in `src/lib/`), which puts presentation in the domain
modules and means Tailwind must see those literals to emit the classes. It works
because the strings are complete class names, and it will silently stop working
if anyone builds them by interpolation.

---

## Data model trade-offs

### Attendance: one row per employee per day, and absence is the absence of a row

`attendance` is unique on `(employee_id, work_date)` and indexed on `work_date`.
A day only gets a row when someone acts: the employee checks in, an admin
overrides, or a leave approval stamps it.

**Consequence:** *no row* means absent. Every reader has to know that. The
dashboard counts present days rather than absent ones; the admin grid builds a
`Map` keyed `employeeId|workDate` and treats misses as blank. A future report
that counts absences by querying `status = 'absent'` would silently undercount.

**The alternative** — a nightly job that materialises an `absent` row per
employee per weekday — buys honest queries at the cost of a scheduler, a holiday
calendar, and a backfill story. Not worth it yet, but the moment a report needs
absence totals, this is the decision to revisit.

### `is_manual` as an override sentinel

An admin override sets `status`, `note`, and `is_manual = true`. Check-in and
check-out then refuse to recompute the status for that day.

**Buys:** one boolean instead of an override table, and a rule that fits in one
line of each action.

**Costs:** only the latest override survives. Who overrode, when, and what the
value was before are not recorded on the row — that history exists only as prose
in `activity_log`, which is a display feed and not something to query for audit.

### Approved leave is written into the attendance calendar

`decideLeaveAction` upserts a `leave` row for every weekday in an approved range,
in the same transaction that decides the request.

**Buys:** the attendance views need no knowledge of leave at all. One query per
view instead of a join plus range overlap logic on every read.

**Costs:** two sources of truth that can drift. There is no unwind path — a
request cannot be re-decided (`if (req.status !== "pending") return …`), and only
pending requests can be withdrawn — so today the drift is prevented by refusing
the operation rather than by supporting it. "HR approved the wrong range" is
currently a manual fix: override each day back by hand. Adding reversal means
adding compensation logic, and that is exactly the debt this denormalisation
took on.

### Salary is versioned, uniquely per effective date

`salary_structures` is unique on `(employee_id, effective_from)`, and
`updateSalaryAction` upserts. `getCurrentSalary()` picks the latest row on or
before today, falling back to the earliest future row so a new hire whose pay
starts next month still sees something.

**Buys:** an audit trail for free, scheduled raises for free, and history that
the employee's own salary page can show.

**Costs:** correcting a typo in *today's* structure overwrites that version — the
`onConflictDoUpdate` is by design, but it means the trail records intended
states, not every edit. There is no "delete a version" path, and no payslip: the
model describes what someone is paid, not what they were actually paid in a
given month.

### Entitlement rows per employee per year

`leave_balances` stores an integer per `(employee, year, type)`, seeded at
sign-up from `DEFAULT_ENTITLEMENT` (18 paid, 12 sick).

**Buys:** per-person adjustment is a row update, and the number is a fact rather
than a computation over policy history.

**Costs:** **nothing creates next year's rows.** On 1 January, `entitled` reads
as 0 for every employee and paid/sick applications start failing with "0 of 0
days left". This needs either a rollover job or a lazy "materialise on first
read" in `leaveSummary`. It is the sharpest dated bug in the system.

Unpaid leave is deliberately unmodelled here — it has no quota, so it skips the
balance check entirely.

### Pending leave counts as used

`daysUsed()` sums approved **and** pending requests.

**Buys:** an employee cannot queue five overlapping requests and drain the
balance if they all get approved. Reservation happens at request time.

**Costs:** the balance shown is "committed", not "consumed". A long-pending
request the employee expects to be rejected still blocks new applications, and
the leave page's "days left" will read low until HR acts.

---

## Rules that are conventions, not constraints

None of these are enforced by the database. They live in `src/lib/` and are
therefore easy to change — and easy to break.

| Rule | Where | Trade-off |
| --- | --- | --- |
| ≥ 6 h → present, ≥ 3 h → half-day, else absent | `lib/attendance.ts` | Simple and explainable; ignores shifts, breaks, and overtime |
| Still checked in → reads as present | `lib/attendance.ts` | Optimistic; someone who never checks out stays "present" forever |
| Weekends never consume leave | `lib/leave.ts` | No holiday calendar, no per-region week — a Sunday-working office is wrong out of the box |
| Overlapping non-rejected requests are refused | `actions/leave.ts` | Cheap conflict prevention; also blocks legitimate split requests in one range |
| Password ≥ 10 chars, mixed case, digit, symbol | `lib/auth.ts` | Stricter than most defaults; composition rules are not modern practice — length plus a breach list would be better |
| Sign-in error text is identical for unknown email and wrong password | `actions/auth.ts` | Does not confirm which emails exist; costs a little clarity for the honest user |
| Dates are local `YYYY-MM-DD` strings | `lib/dates.ts` | Matches the Postgres `date` columns and avoids UTC off-by-one; assumes one timezone (see below) |

---

## Scaling profile — where it breaks first

This is sized for one office, tens to low hundreds of people. In rough order of
what fails as that grows:

1. **`listEmployees()` reads every employee and filters in JavaScript.** The
   search term never reaches SQL, and there is no pagination or limit. It also
   runs a correlated pending-leave subquery per row. Fine at 50 people; a full
   table scan plus N subqueries at 5,000.
2. **The admin attendance grid is O(staff × days) in memory.** It loads all
   active staff and every attendance row in the range, then does `.filter()`
   passes over the array per status tile. A week view for a large org is a lot
   of rows to hold and re-scan per render.
3. **`leaveSummary()` issues one `daysUsed` query per balance row.** N is 2
   today, so it is invisible — but it is a loop of awaits, and it will scale with
   however many leave types get added.
4. **bcrypt cost 12 runs on the request thread.** Roughly 200–300 ms of CPU per
   sign-in or sign-up, blocking that worker. A burst of Monday-morning logins
   contends with page rendering.
5. **`max: 5` connections** — see decision 5. The ceiling is per process, and
   the failure mode under load is requests queueing on the pool rather than an
   obvious error.

None of these are wrong for the current target. They are listed so nobody has to
rediscover them under load.

---

## Known risks

**Public sign-up always creates a standard employee.** The server ignores any
crafted `role` field and writes `employee`; the public form exposes no role
selector. Administrator access is granted only by an existing administrator
through employee management.

**Timezone is the server's.** `today()` builds a date key from the server's local
clock. Everyone is assumed to be in one timezone. A remote employee checking in
at 9 pm their time can land on the server's next or previous day, and the day
boundary shifts if the deployment region changes.

**Cache invalidation is manual.** `revalidatePath()` is called by hand in each
action, and a forgotten path shows stale data with no error. The list of paths
per action is already non-obvious (leave approval touches four).

**Email verification is a `console.log`.** No mail service is wired up; the link
is printed, and outside production the token is also handed back on the redirect
so the flow can be exercised. Nobody can complete sign-up in production until a
mailer exists.

**No tests, no linter, no CI.** `npx tsc --noEmit` is the only automated check,
and it needs `.next/types/` to have been generated by a prior `dev` or `build`
run. Every rule in the table above is currently defended by reading the diff.

**Uploads are unimplemented.** `documents` exists in the schema, and `photoUrl`
takes an arbitrary `http(s)` URL because there is no storage backend. That URL
is rendered — it is an SSRF-adjacent, mixed-content, and hotlinking surface that
a real upload pipeline would close.

---

## What I would change first

In order, weighing risk against effort:

1. Replace console-only email verification with a real mailer.
2. Create or lazily materialise `leave_balances` for the current year, so the
   product does not break on 1 January.
3. Switch to generated, committed migrations before any production deploy.
4. Add `admin/layout.tsx` with `requireAdmin()` as a backstop guard.
5. Add sign-in rate limiting.
6. Push the employee search into SQL with a limit, before the directory grows.
7. Add tests for the pure rules — `deriveStatus`, `countLeaveDays`, `daysUsed`,
   `gross`/`net`. They are already pure functions in `src/lib/`; they are the
   cheapest correctness win available.

---

## Deliberately out of scope

Not missing by accident — decided against for this stage:

- Payroll runs, payslips, and tax — only the salary *structure* is modelled.
- Shifts, rosters, overtime, and holiday calendars.
- The reporting manager relationship: `employees.manager_id` exists but no
  feature reads it, so there is no approval chain — every admin can decide every
  request.
- Notifications of any kind.
- Multi-tenancy. One deployment is one company; there is no `organisation_id`
  anywhere, and adding one later touches every table and every query.
