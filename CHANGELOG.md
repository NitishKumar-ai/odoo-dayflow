# Changelog

All notable changes to Dayflow are recorded here.

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
