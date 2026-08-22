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

### Turn on CI

**What:** Move `ci/github-actions-test.yml` into `.github/workflows/test.yml` so
typecheck, tests, and build run on every push and pull request.

**Why:** The workflow is written and the suite is green, but nothing runs it
automatically. Every check is currently a thing someone has to remember.

**Context:** Blocked only on credentials: pushing a workflow file needs a GitHub
token with `workflow` scope, and this repository's token has `repo` but not
`workflow`. `gh auth refresh -h github.com -s workflow` grants it, then the file
moves into place. Full steps in `ci/README.md`. The workflow already runs a
Postgres 15 service for the integration tests and declares read-only
repository permissions.

**Effort:** S
**Priority:** P1
**Depends on:** A token with `workflow` scope.

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

## Design

### Replace the dashboard card mosaic with a real layout

**What:** Stop rendering every dashboard region as an identical rounded card.
Keep the punch clock as the primary surface and give secondary information open
layout, dividers and tables.

**Why:** An outside design review classified the app as "UI made of stacked
cards instead of layout". With seven near-identical containers on the dashboard,
nothing reads as more important than anything else, so the eye has no entry
point.

**Context:** `src/app/(app)/dashboard/page.tsx` lines 141, 160, 190, 228, 301,
355 and 407 all reach for `.card` in `src/app/globals.css`. Deferred from the
v0.2.0.0 review because it is a design-direction change, not a defect.

**Effort:** M
**Priority:** P2
**Depends on:** A decision on the intended visual hierarchy.

### Scope motion to state changes

**What:** Replace the blanket `transition: all` on cards, inputs and buttons with
transitions on the specific properties that change, and drop the infinite pulse
on the status dot in favour of a state-driven cue.

**Why:** Animating everything makes nothing feel intentional, and `transition:
all` forces the browser to watch every property. The reduced-motion escape hatch
shipped in v0.2.0.0, but the default path is still ornamental.

**Context:** `src/app/globals.css` lines 76, 80, 124 and 151;
`src/components/CheckInOut.tsx` line 52.

**Effort:** S
**Priority:** P2
**Depends on:** None.

### Unify the colour system on tokens

**What:** Move the component-level blue, emerald, amber, rose and purple values
onto the semantic custom properties, so dark mode has one definition instead of
hand-authored variants per component.

**Why:** The palette is currently split between `:root` tokens and per-component
Tailwind colours. Every new component re-decides its own dark-mode treatment,
which is how a design system drifts.

**Context:** `src/app/globals.css` line 3 defines the tokens;
`src/components/StatCard.tsx` lines 17-47, `src/components/LeaveBalanceCard.tsx`
line 22 and `src/components/Brand.tsx` line 25 bypass them.

**Effort:** M
**Priority:** P2
**Depends on:** None.

## Completed

### Redesign every screen on a shared design system

Design tokens, an icon set, and a rebuild of sign-in, sign-up, verification,
dashboard, attendance, leave, payroll, profile, the employee directory and all
admin hubs.

**Completed:** v0.2.0.0 (2026-08-22)

### Make the interface usable on a phone

Single-row scrolling navigation, a collapsing profile block, 44px touch targets,
form fields that no longer trigger iOS zoom, and support for the reduced-motion
system setting.

**Completed:** v0.2.0.0 (2026-08-22)

### Close the public administrator sign-up hole

Sign-up now always creates an employee account, and the seeded demo credentials
were removed from the sign-in page.

**Completed:** v0.2.0.0 (2026-08-22)

### Guard the destructive demo seed

Seeding refuses to run against production without an explicit opt-in, requires a
strong password, and no longer prints that password on completion.

**Completed:** v0.2.0.0 (2026-08-22)
