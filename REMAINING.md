# Dayflow — What is NOT done

Audited live against the running app on 2026-08-22 at 16:30. Everything not
listed here was verified working end to end. Gates at time of audit: typecheck
clean, 209 tests passing, production build succeeding.

## 🔴 P0 — one open item

- [ ] **HR / Employee role selection on sign-up.** Absent on purpose. Public
      registration always creates an employee; an admin promotes from
      `/admin/employees/[id]`. A role picker on a public form is a
      privilege-escalation hole that was deliberately closed in v0.2.0.0.
      **Decide:** leave it out and explain the choice, or re-add it for the demo.

Everything else under P0 — sign-up fields, sign-in, wrong-credential error,
role separation, both dashboards, profile view/edit, check-in/out, daily and
weekly attendance, all four statuses, leave apply/approve/reject with comments,
immediate write-through to the employee's view, payroll read-only vs. HR edit —
was clicked through and works.

### Partially done under P0

- [ ] **Documents are display-only.** The profile lists "Offer letter.pdf" and
      "ID proof.pdf", but the rows carry placeholder URLs. Clicking through
      does not fetch a file. Needs a storage target (Vercel Blob or S3), an
      upload action with type/size limits, and per-employee access control.
- [ ] **Profile pictures are initials, not photos.** The avatar URL field works
      and saves; no employee has an image set, so every avatar renders as
      initials.

## 🟠 P1 — before submission

- [ ] Set real avatar images on at least the two demo accounts (or accept
      initials and say so).
- [ ] **Test the demo login against production.** `/signin` on
      https://odoo-dayflow-steel.vercel.app returns 200, but whether the
      production database is seeded — and with which password — is unverified.
      Local credentials are in DEMO.md and do not necessarily match prod.
- [ ] Screenshots of the main screens.
- [ ] Architecture / workflow diagram.
- [ ] 1–2 minute backup demo recording.
- [ ] One full dress rehearsal, run by the presenter rather than by an agent.

Demo data itself is fine: 6 seeded employees, 135 attendance rows, 3 approved
leaves, 1 pending, 1 rejected, 6 salary structures.

## 🟡 P2 — polish

- [ ] **No confirmation before approving or rejecting leave.** One click on
      Approve is final. `src/components/admin/DecideLeave.tsx`.
- [ ] **Logout is an icon with no visible label.** It has `title="Sign out of
      Dayflow"` but no `aria-label` and no text, so it is easy to miss on stage
      and invisible to a screen reader.
      `src/app/(app)/layout.tsx:87`.
- [ ] **Success feedback is an inline alert, not a toast.** "Checked out." and
      the approval confirmation render in place. Works, but does not match the
      "success toast" on the checklist.

Verified clean: no broken buttons, no empty screens, no console errors on a
fresh page load, loading states on every submit button, error states on every
form, consistent nav, Dayflow branding throughout, logout works, and refreshing
a protected page keeps the session.

## 🍒 Cherry on top

### HR analytics — 3 of 4 metrics already exist

- [x] Total Employees (Active Headcount)
- [x] Present Today (Today's Present Staff)
- [x] Pending Leave Requests (Pending Approvals)
- [ ] **Employees on Leave today** — the only missing tile. ~5 minutes:
      count `attendance` rows with `status = 'leave'` for today, next to the
      existing counts in `src/app/(app)/dashboard/page.tsx`.
- [ ] **Company-wide weekly attendance chart.** A per-employee weekly strip
      exists on the dashboard and an admin weekly heatmap exists at
      `/admin/attendance`; a single company-level chart does not.

### Notifications — not started

- [ ] In-app notification to the employee on approve/reject
- [ ] Notification states Approved / Rejected
- [ ] Notification shows the HR comment

The HR comment already reaches the employee — it renders as "HR Decision Note"
on `/leave`. Only the notification surface is missing.

### Salary slip — not started

- [ ] "Download Salary Slip" button
- [ ] PDF generation from payroll data

Note: doing this properly needs a pay-period model first. `salary_structures`
is versioned by effective date, but nothing records that a given month was
paid, so a payslip regenerated after a raise would silently change.

## Open beyond the checklist

- [ ] **Verification email is never delivered.** Sign-up mints a real,
      single-use, 24-hour token; nothing sends it. The link goes to the server
      log, and in development to the confirmation page. A live sign-up demo has
      a visible rough edge here.
- [ ] **CI is not running.** `ci/github-actions-test.yml` is written and green
      but needs a token with `workflow` scope to move into `.github/workflows/`.
- [ ] **Two stray test accounts are visible in the demo.** "Nadia Rahman"
      (EMP206) and "Nitisih kumar" (`VM<ASDF456`, admin role) show "Role not
      set" in the directory and "⚠️ No Structure Configured" in the payroll
      master. Fill in their details or deactivate them.
- [ ] **Nothing is committed.** The dashboard fix and its tests, DEMO.md, and a
      parallel session's in-progress landing page (`src/app/page.tsx`,
      `layout.tsx`, `LandingReveal.tsx`, `landing.module.css`,
      `public/marketing/`) are all uncommitted on `codex/deployment-prep`.
- [ ] `src/components/ProfileForm.tsx` uses `useState` rather than the
      `useFields` hook CLAUDE.md requires for server-action forms. Not currently
      buggy — the hook guards a `<select>` reset and this form has no select —
      but it is a documented convention the file does not follow.
