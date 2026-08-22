# Changelog

All notable changes to Dayflow are recorded here.

## [0.2.1.0] - 2026-08-22

A public landing page, payroll runs that freeze pay at the end of a period, and
a migration fix that would otherwise have left a deployed database without its
payroll tables.

### Added

- **A landing page for people who are not signed in yet.** The site root now
  explains what Dayflow is instead of bouncing straight to the sign-in form.
  Anyone already signed in still goes directly to their dashboard.
- **Payroll runs and payslips.** A pay period can now be opened, filled with a
  payslip per employee, and finalised. Each payslip stores the salary figures as
  they stood when the run was finalised, so a later raise cannot quietly rewrite
  what someone was already paid. This is the data model and the helpers only;
  there is no screen for it yet, and payslip documents are still future work.
- **Leave balances create themselves.** An employee who reads or applies for
  leave in a year that has no balance rows gets the default paid and sick
  entitlements provisioned on the spot, instead of seeing a zero quota until an
  administrator intervened.
- **A documentation set.** Architecture, data model and ERD, a server-actions
  reference, routing, attendance, authentication, leave, payroll, testing, and
  a project wiki.
- **A presenter guide and an outstanding-work audit.** `DEMO.md` carries the
  demo accounts and a run-through of both roles; `REMAINING.md` records what a
  live audit of the running application found still missing, by priority.

### Fixed

- **Payroll tables were never created on a deployed database.** Two competing
  first migrations existed: the one on the migration run list did not contain
  `payroll_runs` or `payslips`, and the one that did was orphaned and never
  applied. Because a production build runs the migrations, the payroll helpers
  and the seed reset both referred to tables that did not exist. The payroll
  tables now ship as their own migration, added on top of the one already
  applied rather than by rewriting it, and the schema snapshots were re-paired
  so the next generated migration diffs against the truth.
- **"6 / 5 days present" on the dashboard.** Checking in at the weekend counted
  towards a total that was measured against five business days, so anyone who
  worked a Saturday saw a figure larger than its own maximum.
- **The seed script no longer fails the type check.** Its reset block deleted
  the two payroll tables without importing either of them.

### Security

- **The demo password is no longer written into the repository.** `DEMO.md` now
  points at `DEMO_SEED_PASSWORD` in the git-ignored `.env.local`. The repository
  is public, so the previously committed value must be treated as exposed and
  must never be reused on a deployed environment.
- **Large media is kept out of version control.** A source video, its build
  script, and unused logo artwork are ignored; nothing in the application
  referenced any of them.


## [0.2.0.1] - 2026-08-22

Deployment groundwork. No change to how the application behaves.

### Added

- **Versioned database migrations.** The schema is now applied from reviewable
  SQL files rather than diffed onto the database in place, so a deployment can
  no longer drop a column without anyone having seen it. `npm run db:generate`
  writes a migration, `npm run db:migrate` applies it.
- **Vercel configuration and a deployment guide.** `DEPLOYING.md` covers the
  environment variables a hosted deployment needs, how to create the first
  administrator without the demo seed, and what is still missing.

### Fixed

- The admin project page is now listed in the README's spec-to-code map.


## [0.2.0.0] - 2026-08-22

A visual rebuild of every screen, a new delivery-progress page for HR, and fixes
for two ways leave records could quietly contradict each other.

### Added

- **Project progress page for HR.** A new admin-only page showing what has
  shipped, what is next, and what each remaining item is waiting on. Reachable
  from "Project" in the admin navigation.
- **Live figures while you type.** Applying for leave shows the working days it
  will consume as the dates change, and editing a salary shows gross and net
  updating alongside the fields.
- **Balances and pay you can read at a glance.** Leave balances show remaining
  days as a meter, and salary shows the split between basic, HRA and allowances
  as a single bar with the deductions and take-home spelled out beneath it.
- **A running clock and punch-state card.** The attendance widget shows the
  current time and, once you are clocked in, how long you have been working.
- **One-look dashboard.** Headline figures, a week-at-a-glance attendance strip,
  leave meters, and, for HR, a command centre with pending approvals and
  headcount.

### Changed

- **Every screen was redesigned** on a shared set of design tokens: sign-in,
  sign-up, verification, dashboard, attendance, leave, payroll, profile, the
  employee directory, the employee detail view and all admin hubs.
- **Sign-up now checks your password as you type**, listing each rule as it is
  met rather than rejecting the form afterwards.
- **The header works on a phone.** Navigation scrolls as one row instead of
  wrapping into a tall stack, and the profile block collapses to the avatar on
  narrow screens.
- **Controls are easier to hit.** Buttons and navigation links now meet a 44px
  touch target, and form fields no longer shrink below the size that makes iOS
  Safari zoom in when you tap them.
- **Movement respects your system setting.** Card lifts, the pulsing status dot
  and hover transitions stop for anyone who has asked for reduced motion.
- **Seeding demo data no longer prints the password** and refuses to run with a
  weak one.

### Fixed

- **Withdrawing leave can no longer erase an approval.** Withdrawing a request
  at the same moment HR approved it used to delete the request while leaving the
  approved days marked as leave, which blocked the employee from clocking in with
  nothing on record to explain why. The withdrawal is now refused with a message.
- **Two approvers can no longer both decide the same request.** Simultaneous
  decisions used to overwrite each other, which could leave days marked as leave
  behind a request that ended up rejected. The second decision is now told the
  request was already decided.
- **Text no longer sits underneath the icon in form fields.** Shared component
  styles were overriding the per-field spacing, affecting sign-in, sign-up and
  the employee search.
- **Administrator accounts can no longer be created from public sign-up.**
- **Demo credentials were removed from the sign-in page.**
- **The status dropdown in HR attendance overrides keeps its selection** after
  the change is saved.


## [0.1.0.0] - 2026-08-22

First working release of the Dayflow HRMS, covering sections 3.1 through 3.6 of
the requirements document.

### Added

- **Accounts and sign-in.** Register with an employee ID, work email, password,
  and role. Passwords must be at least 10 characters with mixed case, a number,
  and a symbol. A single-use verification link, valid for 24 hours, has to be
  opened before the account will sign in. Sessions last 8 hours and are held in
  an httpOnly cookie.
- **Two kinds of access.** Employees see only their own records. HR and admins
  see everyone, and can act on their own records through the same screens. Every
  page and every action checks the caller, so a URL alone never grants access.
- **Employee dashboard.** Today's check-in and check-out, the week at a glance,
  remaining leave balance, recent activity, and quick links to profile,
  attendance, leave, and salary. Admins additionally see how many leave requests
  are waiting and the active headcount.
- **Profile.** View personal details, job details, salary, and documents.
  Employees may change their own phone, address, and profile picture; HR may
  change everything, including access level and whether the account is active.
- **Attendance.** Check in and out, and see the day and the week. Status follows
  from hours worked — six or more is present, three to six is a half-day, less
  is absent — and HR can override any day with a note. HR gets a daily roster and
  a weekly grid across the whole company.
- **Leave and time off.** Apply for paid, sick, or unpaid leave over a date
  range with remarks, and withdraw a request while it is still pending. Weekends
  never count against a balance, requests that overlap an existing one are
  refused, and paid and sick leave are capped by an annual entitlement (18 and 12
  days). HR approves or rejects with a comment, and approving marks every weekday
  in the range as leave on the attendance calendar straight away.
- **Salary.** Employees see their own structure, read-only, with the monthly
  gross, deductions, and net. HR sees the whole company, edits any structure, and
  every save is kept as a dated revision rather than overwriting the last one.
- **Tests and CI.** 148 tests: unit tests for the business rules, component tests
  for the forms, and integration tests that run the real server actions against a
  real Postgres database. A GitHub Actions workflow covering typecheck, tests,
  and build is written and parked in `ci/`, but is not active yet — committing
  it needs a token with `workflow` scope.

### Fixed

- Choosing a leave type, an access level, or an attendance status and then
  hitting a validation error no longer silently reverts the dropdown to its
  first option — which previously meant a resubmit could file the wrong kind of
  leave, or set the wrong access level, without anyone noticing.
- A rejected form no longer discards what was typed into it.
- Credentials filled by a browser or password manager are no longer wiped when
  the sign-in page finishes loading.
- Double-clicking "Check in" now reports that you are already checked in,
  instead of showing a database error.
- Two leave requests submitted at the same moment can no longer both slip past
  the balance and overlap checks.
- Two admins saving the same attendance cell at once no longer fail.

### Changed

- The payroll table reads every employee's salary in a single query. It
  previously ran one to two queries per employee and grew with salary history.

### Security

- `.gitignore` again excludes all environment files, private keys, and
  `.vercel`. A narrowed version could have let a production env file or a
  private key be committed. Nothing sensitive was ever tracked.
- The test suite refuses to run against a database whose name does not mark it
  as a test database, since it force-pushes schema and truncates every table.
- CI runs with read-only repository permissions.

### Known gaps

- No email is actually sent. The verification link is real and single-use, but
  it is written to the server log; in development it is also offered on the
  confirmation page.
- Documents are modelled and listed, but files cannot be uploaded yet.
- No end-to-end tests, and no payslip or reporting screens.
