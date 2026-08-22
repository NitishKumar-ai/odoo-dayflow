# Routes and pages

This page is the map. On `main`, `docs/ROUTING_PAGES.md` has the same facts
with longer tables.

## Public

| Path | File | Notes |
|---|---|---|
| `/` | `src/app/page.tsx` | `force-dynamic`. Session → `/dashboard`, else `/signin` |
| `/signin` | `(auth)/signin/page.tsx` | Client form, `signInAction` |
| `/signup` | `(auth)/signup/page.tsx` | Client form, `signUpAction` |
| `/verify-email` | `verify-email/page.tsx` | `token`, `sent`, optional `devToken` |

## Signed in (`requireUser`)

| Path | File | Query |
|---|---|---|
| `/dashboard` | `(app)/dashboard/page.tsx` | — |
| `/profile` | `(app)/profile/page.tsx` | Self-edit phone / address / photo |
| `/attendance` | `(app)/attendance/page.tsx` | `week=YYYY-MM-DD` |
| `/leave` | `(app)/leave/page.tsx` | Apply and withdraw |
| `/payroll` | `(app)/payroll/page.tsx` | Read-only salary |

## HR only (`requireAdmin`)

| Path | File | Query |
|---|---|---|
| `/admin/employees` | `admin/employees/page.tsx` | `q` search |
| `/admin/employees/[employeeId]` | `admin/employees/[employeeId]/page.tsx` | `week` |
| `/admin/attendance` | `admin/attendance/page.tsx` | `view=day\|week`, `date` |
| `/admin/leave` | `admin/leave/page.tsx` | `status=pending\|approved\|rejected\|all` |
| `/admin/payroll` | `admin/payroll/page.tsx` | Company salary table |
| `/admin/project` | `admin/project/page.tsx` | Delivery / roadmap (not in the spec) |

`[employeeId]` is the employee UUID. Unknown ids call `notFound()`.

## Server actions

| Module | Actions | Guard |
|---|---|---|
| `src/actions/auth.ts` | `signUpAction`, `signInAction`, `verifyEmailAction`, `signOutAction` | Public except sign-out (destroys cookie) |
| `src/actions/attendance.ts` | `checkInAction`, `checkOutAction`, `setAttendanceStatusAction` | User / user / admin |
| `src/actions/leave.ts` | `applyLeaveAction`, `cancelLeaveAction`, `decideLeaveAction` | User / user / admin |
| `src/actions/profile.ts` | `updateOwnProfileAction`, `adminUpdateEmployeeAction`, `updateSalaryAction` | User / admin / admin |

## Layouts

- `src/app/layout.tsx` — fonts, metadata, `globals.css`
- `src/app/(auth)/layout.tsx` — signed-out shell
- `src/app/(app)/layout.tsx` — nav. Admin links appear only for `role === "admin"`

Next.js 16: `params` and `searchParams` are promises. Route prop types
(`PageProps<…>`, `LayoutProps<…>`) appear after `npm run dev` or `npm run build`.

## Related

- [Architecture](Architecture.md)
- [Authentication](Authentication.md)
- [Code layout](Code-Layout.md)
