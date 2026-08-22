# TODOS

## Authentication

### Send the verification email

**What:** Wire `signUpAction` to a mail provider so the verification link is
actually delivered.

**Why:** Sign-up is half-finished. The token is real, single-use, and expires
after 24 hours, but nothing sends it — the link is written to the server log,
and in development it is also shown on the confirmation page. In production a
new employee would register and then have no way to activate the account.

**Context:** `src/actions/auth.ts` builds the link and logs it. Point that at a
provider (Resend and Postmark both suit this), move the copy into a template,
and drop the `devToken` branch from `src/app/verify-email/page.tsx`. Section 6
of the requirements document also lists notification alerts, which would reuse
the same sender. Worth adding a resend-verification path at the same time,
since the current token expires with no way to request another.

**Effort:** M
**Priority:** P0
**Depends on:** A mail provider account and an API key.

## Employee profile

### Upload and store documents

**What:** Let HR upload employee documents and let employees download their own.

**Why:** Section 3.3.1 lists documents as part of the profile. The table, the
listing, and the profile panel all exist, but there is no upload — the seeded
rows carry placeholder URLs, so the feature looks present and does nothing.

**Context:** `documents` in `src/db/schema.ts` already has name, category, url,
and timestamp. Needs a storage target (Vercel Blob or S3), an upload action with
type and size limits, and access control so an employee can only fetch their own
files. Access control is the part to get right: a plain public URL would leak
identity documents to anyone with the link.

**Effort:** M
**Priority:** P1
**Depends on:** A storage provider.

## Testing

### End-to-end tests for the main flows

**What:** Browser tests covering sign-up through verification, check-in and
check-out across a day, apply-for-leave, and HR approval as the employee sees it.

**Why:** The server actions behind each flow are covered at the integration
layer, but nothing proves a rendered page is wired to the right action. A form
posting to the wrong action, or a redirect that silently drops a session, would
pass the whole current suite.

**Context:** Playwright is the natural fit. Needs a seeded database per run and a
running dev server; `npm run db:seed` and the existing `dayflow_test` guard in
`test/helpers/test-db-url.ts` give most of the scaffolding. Reuse the account
fixtures from `src/db/seed.ts` rather than inventing new ones.

**Effort:** L
**Priority:** P2
**Depends on:** None.

## Payroll

### Payslips and reports

**What:** Generate a downloadable payslip per employee per month, and the
attendance and salary reports named in section 6.

**Why:** Listed as a future enhancement in the requirements document. Employees
can see the salary structure but have nothing to keep for a landlord or a bank.

**Context:** Needs a pay-period concept, which the data model does not have yet:
`salary_structures` is versioned by effective date, but nothing records that a
given month was paid. Add a payroll-run table before the PDF work, otherwise
payslips get regenerated from current data and silently change after a raise.

**Effort:** L
**Priority:** P3
**Depends on:** A pay-period model.

## Infrastructure

### Deploy the app somewhere

**What:** Stand up a hosted environment with a managed Postgres.

**Why:** The app runs only on a developer machine against a local database.
There is no way for anyone else to try it.

**Context:** CI builds it already. Needs a managed Postgres, real values for
`DATABASE_URL` and `SESSION_SECRET` (the development secret in `.env.local` must
not travel), and a migration step — `drizzle-kit push` is fine for development
but generated migrations are the right thing against a real database.

**Effort:** M
**Priority:** P2
**Depends on:** None.

## Completed

_Nothing yet — v0.1.0.0 is the first release._
