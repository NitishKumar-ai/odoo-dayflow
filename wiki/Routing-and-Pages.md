# Dayflow HRMS — Routing & Pages Catalog

This document provides an exhaustive reference for the routing hierarchy, layout boundaries, access control enforcement, dynamic route parameters, and rendering behavior across all pages in **Dayflow HRMS**.

---

## 1. Directory Structure & App Router Hierarchy

Dayflow is built on the **Next.js 16 App Router**. Routes are organized into public and protected route groups:

```
src/app/
├── layout.tsx                # Root layout (loads Geist fonts, HTML metadata)
├── globals.css               # Global Tailwind v4 styles, theme variables, component classes
├── page.tsx                  # Root landing route (force-dynamic redirect controller)
├── verify-email/
│   └── page.tsx              # Email verification page (token handling)
├── (auth)/                   # Authentication Route Group (Public)
│   ├── layout.tsx            # Auth layout (centered card container, Dayflow logo)
│   ├── signin/
│   │   └── page.tsx          # Sign-in page
│   └── signup/
│       └── page.tsx          # Sign-up page
└── (app)/                    # Authenticated Application Group (Protected)
    ├── layout.tsx            # Protected App Shell (Header, Navigation, User Profile, Sign-Out)
    ├── dashboard/
    │   └── page.tsx          # Main Dashboard (Role-aware overview)
    ├── attendance/
    │   └── page.tsx          # Employee Attendance page
    ├── leave/
    │   └── page.tsx          # Employee Leave & Time-off page
    ├── payroll/
    │   └── page.tsx          # Employee Payroll & Salary page
    ├── profile/
    │   └── page.tsx          # Employee Profile & Self-edit page
    └── admin/                # Admin/HR Sub-routes (HR/Admin Access Only)
        ├── attendance/
        │   └── page.tsx      # Daily/Weekly Attendance Management & Overrides
        ├── employees/
        │   ├── page.tsx      # Employee Directory & Search
        │   └── [employeeId]/
        │       └── page.tsx  # Detailed Employee Edit, Attendance & Salary History
        ├── leave/
        │   └── page.tsx      # HR Leave Approvals & Rejections
        └── payroll/
            └── page.tsx      # HR Payroll Directory & Monthly Salary Summary
```

---

## 2. Authorization & Access Control Model

Authorization is enforced at **both the Server Component level and the Server Action level**:

* **Page-Level Protection**:
  * `requireUser()` (`src/lib/auth.ts`): Executed at the top of all `(app)` pages. Inspects the `dayflow_session` cookie, verifies the JWT signature, checks `user.is_active === true`, and redirects unauthenticated users to `/signin`.
  * `requireAdmin()` (`src/lib/auth.ts`): Executed at the top of all `(app)/admin/*` pages. Verifies session AND checks `user.role === 'admin'`. Redirects non-admin users to `/dashboard`.
* **Action-Level Protection**:
  * Every Server Action in `src/actions/` invokes `requireUser()` or `requireAdmin()` internally. URL authorization alone never grants access to data mutations.

---

## 3. Next.js 16 Architectural Conventions

* **Async Route Props**: In Next.js 16, route props `params` and `searchParams` are Promises and MUST be awaited inside Page components (e.g. `const { employeeId } = await params;`).
* **Generated Types**: Running `npm run build` or `npm run dev` generates global route prop types in `.next/types/` (e.g., `PageProps<"/admin/employees/[employeeId]">`).
* **Client Form State Preservation**: Interactive forms use `useFields` (`src/components/useFields.ts`) alongside `useActionState` to prevent form resets on server action response.

---

## 4. Complete Page Catalog

---

### 4.1 Root Landing Router — `GET /`
* **File**: `src/app/page.tsx`
* **Access Level**: Public (Dynamic session check)
* **Rendering**: Server Component (`export const dynamic = "force-dynamic"`)
* **Behavior**: Evaluates user session. Redirects authenticated users to `/dashboard` and unauthenticated visitors to `/signin`.

---

### 4.2 Sign In Page — `GET /signin`
* **File**: `src/app/(auth)/signin/page.tsx`
* **Layout**: `src/app/(auth)/layout.tsx`
* **Access Level**: Public
* **Rendering**: Client Component (`"use client"`)
* **Server Action**: `signInAction` (`src/actions/auth.ts`)
* **Behavior**: Accepts email and password credentials. On success, creates `dayflow_session` cookie and redirects to `/dashboard`. On error, displays security error message.

---

### 4.3 Sign Up Page — `GET /signup`
* **File**: `src/app/(auth)/signup/page.tsx`
* **Layout**: `src/app/(auth)/layout.tsx`
* **Access Level**: Public
* **Rendering**: Client Component (`"use client"`)
* **Server Action**: `signUpAction` (`src/actions/auth.ts`)
* **Fields**: First Name, Last Name, Employee Code, Email, Password, Role (`employee` \| `admin`).
* **Behavior**: Creates `users` & `employees` records, initializes annual leave balances, generates 24-hour verification token, and redirects to `/verify-email`.

---

### 4.4 Email Verification — `GET /verify-email`
* **File**: `src/app/verify-email/page.tsx`
* **Access Level**: Public
* **Rendering**: Server Component
* **URL Search Parameters**: `token` *(optional)*, `sent` *(optional)*, `devToken` *(optional)*
* **Server Action**: `verifyEmailAction` (`src/actions/auth.ts`)
* **Behavior**: Validates activation token, marks account `email_verified_at = NOW()` and `is_active = true`, then displays confirmation alert.

---

### 4.5 Employee Dashboard — `GET /dashboard`
* **File**: `src/app/(app)/dashboard/page.tsx`
* **Access Level**: Authenticated User (`requireUser()`)
* **Rendering**: Server Component
* **Key Modules**: Greeting header, today's Check-In/Out action card, HR admin stats banner (if admin), weekly 7-day status grid, leave balance summary, activity log feed, and latest leave request list.

---

### 4.6 Employee Attendance — `GET /attendance`
* **File**: `src/app/(app)/attendance/page.tsx`
* **Access Level**: Authenticated User (`requireUser()`)
* **Rendering**: Server Component
* **URL Search Parameters**: `week` *(optional YYYY-MM-DD anchor date)*
* **Server Actions**: `checkInAction`, `checkOutAction` (`src/actions/attendance.ts`)
* **Key Modules**: Real-time Check-In / Check-Out card, weekly attendance table with worked hours, status pills, and 14-day history log.

---

### 4.7 Employee Leave & Time-Off — `GET /leave`
* **File**: `src/app/(app)/leave/page.tsx`
* **Access Level**: Authenticated User (`requireUser()`)
* **Rendering**: Server Component
* **Server Actions**: `requestLeaveAction`, `withdrawLeaveAction` (`src/actions/leave.ts`)
* **Key Modules**: Annual entitlement cards (Paid, Sick, Unpaid), leave submission form with weekday auto-calculator, request history table with HR decision comments, and pending withdrawal trigger.

---

### 4.8 Employee Payroll — `GET /payroll`
* **File**: `src/app/(app)/payroll/page.tsx`
* **Access Level**: Authenticated User (`requireUser()`)
* **Rendering**: Server Component (Read-only)
* **Queries**: `getCurrentSalary()`, `getSalaryHistory()` (`src/lib/employee-queries.ts`)
* **Key Modules**: Monthly Net Pay KPI card, itemized breakdown (Basic, HRA, Special Allowances, Deductions), and effective-dated salary revision history.

---

### 4.9 Employee Profile — `GET /profile`
* **File**: `src/app/(app)/profile/page.tsx`
* **Access Level**: Authenticated User (`requireUser()`)
* **Rendering**: Server Component
* **Server Action**: `updateProfileSelfAction` (`src/actions/profile.ts`)
* **Key Modules**: Personal & job information cards, read-only salary structure snapshot, avatar image renderer, and self-edit form (phone, address, photo URL).

---

### 4.10 Admin Employee Directory — `GET /admin/employees`
* **File**: `src/app/(app)/admin/employees/page.tsx`
* **Access Level**: HR / Admin Only (`requireAdmin()`)
* **Rendering**: Server Component
* **URL Search Parameters**: `q` *(optional search string)*
* **Key Modules**: Search filter box, employee roster table with avatars, names, employee codes, emails, titles, departments, roles, active badges, and links to detail edit pages.

---

### 4.11 Admin Employee Detail & Editing — `GET /admin/employees/[employeeId]`
* **File**: `src/app/(app)/admin/employees/[employeeId]/page.tsx`
* **Access Level**: HR / Admin Only (`requireAdmin()`)
* **Rendering**: Server Component
* **Route Parameter**: `employeeId` *(UUID string)*
* **Server Actions**: `adminUpdateEmployeeAction`, `adminUpdateSalaryAction`, `adminOverrideAttendanceAction`
* **Key Modules**: Profile banner, full profile editor with self-lockout protection, leave summary, weekly attendance log with override trigger, salary structure editor, and revision history.

---

### 4.12 Admin Attendance Management — `GET /admin/attendance`
* **File**: `src/app/(app)/admin/attendance/page.tsx`
* **Access Level**: HR / Admin Only (`requireAdmin()`)
* **Rendering**: Server Component
* **URL Search Parameters**: `view` *("day" \| "week")*, `date` *(YYYY-MM-DD)*
* **Server Action**: `adminOverrideAttendanceAction` (`src/actions/attendance.ts`)
* **Key Modules**: View mode switcher, daily staff table with check-in/out timestamps, weekly 7-day attendance status grid, and HR override modal.

---

### 4.13 Admin Leave Approvals — `GET /admin/leave`
* **File**: `src/app/(app)/admin/leave/page.tsx`
* **Access Level**: HR / Admin Only (`requireAdmin()`)
* **Rendering**: Server Component
* **URL Search Parameters**: `status` *("pending" \| "approved" \| "rejected" \| "all")*
* **Server Action**: `adminReviewLeaveAction` (`src/actions/leave.ts`)
* **Key Modules**: Status tab bar, pending count badges, leave request cards with applicant details, date ranges, business days count, remarks, and HR approve/reject form.

---

### 4.14 Admin Payroll Directory — `GET /admin/payroll`
* **File**: `src/app/(app)/admin/payroll/page.tsx`
* **Access Level**: HR / Admin Only (`requireAdmin()`)
* **Rendering**: Server Component
* **Key Modules**: Total monthly gross metrics, total net metrics, missing salary configuration count, company payroll directory table, and direct edit links.

---

## 5. Requirement Traceability Matrix

| Functional Requirement Area | Route Path | Access Level | Backing Server Action(s) |
|---|---|---|---|
| **Auth & Verification** | `/signin`, `/signup`, `/verify-email` | Public | `signInAction`, `signUpAction`, `verifyEmailAction` |
| **Dashboard** | `/dashboard` | Authenticated | Reads `attendance`, `leaveRequests`, `activityLog` |
| **Profile & Self-Edit** | `/profile`, `/admin/employees/[employeeId]` | Self / Admin | `updateProfileSelfAction`, `adminUpdateEmployeeAction` |
| **Attendance & Overrides** | `/attendance`, `/admin/attendance` | Self / Admin | `checkInAction`, `checkOutAction`, `adminOverrideAttendanceAction` |
| **Leave Workflows** | `/leave`, `/admin/leave` | Self / Admin | `requestLeaveAction`, `withdrawLeaveAction`, `adminReviewLeaveAction` |
| **Payroll Management** | `/payroll`, `/admin/payroll` | Self / Admin | `adminUpdateSalaryAction` |
