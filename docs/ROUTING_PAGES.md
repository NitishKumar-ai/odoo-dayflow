# Dayflow HRMS — Routing & Pages Documentation

This document provides a comprehensive overview of the routing architecture, layout hierarchy, page catalogue, access control models, server actions, and URL parameters for **Dayflow HRMS**.

---

## 1. Architecture Overview

Dayflow is built on **Next.js 16 App Router** (with React 19, Server Actions, TypeScript, and Tailwind CSS v4).

### 1.1 Directory Structure & Layout Hierarchy

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

### 1.2 Authorization Model

Unlike traditional middleware-centric authorization, Dayflow enforces authorization at **both the Server Component level and the Server Action level**:

- **Per-Page Access Control**:
  - `requireUser()` (`src/lib/auth.ts`): Applied at the top of all `(app)` pages. Validates JWT session cookie (`dayflow_session`). Redirects unauthenticated users to `/signin`.
  - `requireAdmin()` (`src/lib/auth.ts`): Applied at the top of all `(app)/admin/*` pages. Validates JWT session cookie and checks `user.role === 'admin'`. Redirects non-admin users to `/dashboard`.
- **Per-Action Access Control**:
  - Every Server Action in `src/actions/` invokes `requireUser()` or `requireAdmin()` internally. URL authorization alone never grants access to data mutations.

### 1.3 Routing Mechanics & Next.js 16 Features

- **Dynamic Type Generation**: Next.js 16 generates global page and layout types into `.next/types/` (e.g., `PageProps<"/admin/employees/[employeeId]">`, `LayoutProps<"/">`).
- **Async Route Parameters**: In Next.js 16, `params` and `searchParams` props are Promises and must be awaited inside page components.
- **Form State Management**: Form inputs use `useFields` (`src/components/useFields.ts`) to prevent React 19 controlled form reset glitches upon server action completion.

---

## 2. Complete Catalog of Routing Pages

---

### 2.1 Landing Router — `GET /`

- **File**: [`src/app/page.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/page.tsx)
- **Access Level**: Public (Dynamic session check)
- **Rendering**: Server Component (`export const dynamic = "force-dynamic"`)
- **Purpose**: Evaluates user session and redirects immediately:
  - If authenticated: Redirects to `/dashboard`
  - If unauthenticated: Redirects to `/signin`

---

### 2.2 Sign In Page — `GET /signin`

- **File**: [`src/app/(auth)/signin/page.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(auth)/signin/page.tsx)
- **Layout**: [`src/app/(auth)/layout.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(auth)/layout.tsx)
- **Access Level**: Public
- **Rendering**: Client Component (`"use client"`)
- **Form Component**: Uses `useActionState(signInAction)` and `useFields()`
- **Server Actions**: `signInAction` (`src/actions/auth.ts`)
- **Functionality**: Accepts email and password. On successful authentication, creates an `httpOnly` JWT session cookie (`dayflow_session`) and redirects user to `/dashboard`. Displays error banner on failure or inactive/unverified account.

---

### 2.3 Sign Up Page — `GET /signup`

- **File**: [`src/app/(auth)/signup/page.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(auth)/signup/page.tsx)
- **Layout**: [`src/app/(auth)/layout.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(auth)/layout.tsx)
- **Access Level**: Public
- **Rendering**: Client Component (`"use client"`)
- **Form Component**: Uses `useActionState(signUpAction)` and `useFields()`
- **Server Actions**: `signUpAction` (`src/actions/auth.ts`)
- **Fields**: First Name, Last Name, Employee ID (`employeeCode`), Work Email, Password, Role (`employee` / `admin`).
- **Functionality**: Creates user account, generates 24-hour verification token, and redirects to `/verify-email?sent=<email>&devToken=<token>`.
- **Validation**: Enforces strict password policies (>=10 chars, uppercase, lowercase, number, special char via `passwordProblems` in `src/lib/auth.ts`).

---

### 2.4 Email Verification — `GET /verify-email`

- **File**: [`src/app/verify-email/page.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/verify-email/page.tsx)
- **Access Level**: Public
- **Rendering**: Server Component
- **URL Parameters**:
  - `token` *(optional, string)*: Verification token to activate account.
  - `sent` *(optional, string)*: Email address notification message.
  - `devToken` *(optional, string)*: Development convenience link to verify token locally.
- **Server Actions**: `verifyEmailAction(token)` (`src/actions/auth.ts`)
- **Functionality**: Validates one-time activation token, marks `email_verified_at = NOW()` and `is_active = true`. Displays success alert with link to `/signin`.

---

### 2.5 Main Dashboard — `GET /dashboard`

- **File**: [`src/app/(app)/dashboard/page.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(app)/dashboard/page.tsx)
- **Layout**: [`src/app/(app)/layout.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(app)/layout.tsx)
- **Access Level**: Authenticated User (`requireUser()`)
- **Rendering**: Server Component
- **Key UI Sections**:
  1. **Greeting & Current Date**: Personalized user header.
  2. **Today's Attendance Action (`CheckInOut`)**: Real-time Check-In / Check-Out button.
  3. **HR / Admin Quick Stats (Admin Only)**:
     - Count of leave requests awaiting approval (`/admin/leave`)
     - Total active employee headcount (`/admin/employees`)
  4. **Quick Navigation Cards**: Links to Profile, Attendance, Leave, and Salary.
  5. **Weekly Attendance Summary**: Visual 7-day status grid (Present, Half-day, Leave, Absent).
  6. **Leave Balances**: Paid, Sick, and Unpaid leave usage vs entitlement.
  7. **Recent Activity Feed**: Log of recent user actions (check-ins, leave submissions).
  8. **My Latest Leave Requests**: Table showing recent leave requests and status pills.

---

### 2.6 Employee Attendance — `GET /attendance`

- **File**: [`src/app/(app)/attendance/page.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(app)/attendance/page.tsx)
- **Layout**: [`src/app/(app)/layout.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(app)/layout.tsx)
- **Access Level**: Authenticated User (`requireUser()`)
- **Rendering**: Server Component
- **URL Parameters**:
  - `week` *(optional, `YYYY-MM-DD`)*: Anchor date to calculate the displayed 7-day work week. Defaults to `today()`.
- **Components & Actions**:
  - `CheckInOut` component (`checkInAction`, `checkOutAction` in `src/actions/attendance.ts`)
  - Navigation controls (`← Previous`, `This week`, `Next →`)
- **Data Display**:
  - Today's check-in/out status card.
  - Weekly attendance table with daily check-in time, check-out time, calculated worked hours, and status pill.
  - History log of the last 14 recorded work days.

---

### 2.7 Employee Leave & Time-Off — `GET /leave`

- **File**: [`src/app/(app)/leave/page.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(app)/leave/page.tsx)
- **Layout**: [`src/app/(app)/layout.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(app)/layout.tsx)
- **Access Level**: Authenticated User (`requireUser()`)
- **Rendering**: Server Component
- **Components & Actions**:
  - `LeaveForm` component (`requestLeaveAction` in `src/actions/leave.ts`)
  - `WithdrawLeave` component (`withdrawLeaveAction` in `src/actions/leave.ts`)
- **Data Display**:
  - Annual Leave Balance Cards (Paid: 18 days, Sick: 12 days, Unpaid: uncapped).
  - Leave Application Form with date pickers, leave type selection, and optional remarks.
  - "My Requests" list showing start/end dates, total computed business days, status pill, HR decision comments, and a "Withdraw" button for pending requests.

---

### 2.8 Employee Payroll — `GET /payroll`

- **File**: [`src/app/(app)/payroll/page.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(app)/payroll/page.tsx)
- **Layout**: [`src/app/(app)/layout.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(app)/layout.tsx)
- **Access Level**: Authenticated User (`requireUser()`)
- **Rendering**: Server Component (Read-only)
- **Data Queries**: `getCurrentSalary()`, `getSalaryHistory()` (`src/lib/employee-queries.ts`)
- **Data Display**:
  - Summary KPI cards: Monthly Gross, Monthly Deductions, Monthly Net.
  - Itemized Breakdown: Basic Pay, House Rent Allowance (HRA), Special Allowances, Deductions.
  - Salary Revision History table (if multiple revisions exist).

---

### 2.9 Employee Profile & Self-Service — `GET /profile`

- **File**: [`src/app/(app)/profile/page.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(app)/profile/page.tsx)
- **Layout**: [`src/app/(app)/layout.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(app)/layout.tsx)
- **Access Level**: Authenticated User (`requireUser()`)
- **Rendering**: Server Component
- **Components & Actions**:
  - `ProfileForm` component (`updateProfileSelfAction` in `src/actions/profile.ts`)
  - `Avatar` component (`src/components/Avatar.tsx`)
- **Data Display**:
  - Personal Details (Employee Code, Email, Phone, DOB, Address).
  - Job Details (Job Title, Department, Employment Type, Date of Joining, Role).
  - Salary Structure snapshot (Read-only).
  - Documents list.
  - Self-Edit form to update phone, address, and avatar photo URL.

---

### 2.10 Admin Attendance Management — `GET /admin/attendance`

- **File**: [`src/app/(app)/admin/attendance/page.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(app)/admin/attendance/page.tsx)
- **Layout**: [`src/app/(app)/layout.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(app)/layout.tsx)
- **Access Level**: HR / Admin Only (`requireAdmin()`)
- **Rendering**: Server Component
- **URL Parameters**:
  - `view` *(optional, `"day"` | `"week"`)*: View mode (Defaults to `"day"`).
  - `date` *(optional, `YYYY-MM-DD`)*: Selected anchor date (Defaults to `today()`).
- **Components & Actions**:
  - `AttendanceOverride` modal/component (`adminOverrideAttendanceAction` in `src/actions/attendance.ts`)
- **Data Display**:
  - Daily mode: Staff list table showing check-in/out times, worked hours, derived status, and an HR Override button.
  - Weekly mode: Grid matrix mapping all active employees across 7 week days with status indicators (`P`, `A`, `H`, `L`).

---

### 2.11 Admin Employee Roster — `GET /admin/employees`

- **File**: [`src/app/(app)/admin/employees/page.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(app)/admin/employees/page.tsx)
- **Layout**: [`src/app/(app)/layout.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(app)/layout.tsx)
- **Access Level**: HR / Admin Only (`requireAdmin()`)
- **Rendering**: Server Component
- **URL Parameters**:
  - `q` *(optional, string)*: Search filter query for employee name, ID, or department.
- **Data Queries**: `listEmployees(q)` (`src/lib/employee-queries.ts`)
- **Data Display**:
  - Search input box.
  - Employee list table displaying Avatar, Name, Employee Code, Work Email, Job Title, Department, System Access Role, Active Status, and Pending Leave badge.
  - "Open" button linking to `/admin/employees/[employeeId]`.

---

### 2.12 Admin Employee Detail & Editing — `GET /admin/employees/[employeeId]`

- **File**: [`src/app/(app)/admin/employees/[employeeId]/page.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(app)/admin/employees/[employeeId]/page.tsx)
- **Layout**: [`src/app/(app)/layout.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(app)/layout.tsx)
- **Access Level**: HR / Admin Only (`requireAdmin()`)
- **Rendering**: Server Component
- **Route Parameters**:
  - `employeeId` *(required, UUID string)*: Employee database ID. Triggers `notFound()` if employee does not exist.
- **URL Parameters**:
  - `week` *(optional, `YYYY-MM-DD`)*: Attendance week pagination anchor.
- **Components & Actions**:
  - `EmployeeEditForm` (`adminUpdateEmployeeAction` in `src/actions/profile.ts`)
  - `SalaryForm` (`adminUpdateSalaryAction` in `src/actions/profile.ts`)
  - `AttendanceOverride` (`adminOverrideAttendanceAction` in `src/actions/attendance.ts`)
- **Data Display**:
  - Header profile banner with status pills (Deactivated / Email unverified).
  - HR Employee Edit form (names, phone, address, job title, department, employment type, joining date, DOB, role, active state).
  - Employee leave balance summary.
  - Attendance log for the selected week with HR override action.
  - Salary Structure editor and complete salary revision history table.
  - Employee leave request history.

---

### 2.13 Admin Leave Approvals — `GET /admin/leave`

- **File**: [`src/app/(app)/admin/leave/page.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(app)/admin/leave/page.tsx)
- **Layout**: [`src/app/(app)/layout.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(app)/layout.tsx)
- **Access Level**: HR / Admin Only (`requireAdmin()`)
- **Rendering**: Server Component
- **URL Parameters**:
  - `status` *(optional, `"pending"` | `"approved"` | `"rejected"` | `"all"`)*: Filter tab (Defaults to `"pending"`).
- **Components & Actions**:
  - `DecideLeave` component (`adminReviewLeaveAction` in `src/actions/leave.ts`)
- **Data Display**:
  - KPI counter header (Pending, Approved, Rejected counts).
  - Navigation tab bar.
  - List of leave request cards containing employee info, leave type, date range, computed business days, employee remarks, and HR Approve/Reject form with optional decision notes.

---

### 2.14 Admin Payroll Directory — `GET /admin/payroll`

- **File**: [`src/app/(app)/admin/payroll/page.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(app)/admin/payroll/page.tsx)
- **Layout**: [`src/app/(app)/layout.tsx`](file:///c:/BokaChoda/oodo/odoo-dayflow/src/app/(app)/layout.tsx)
- **Access Level**: HR / Admin Only (`requireAdmin()`)
- **Rendering**: Server Component
- **Data Queries**: `getCurrentSalaries()` batch query across all active employees.
- **Data Display**:
  - Company-wide payroll KPIs: Total Monthly Gross, Total Monthly Net, Count of employees missing salary configuration.
  - Roster payroll table displaying Basic, HRA, Allowances, Deductions, Net Pay, Effective Date, and an "Edit" link targeting `/admin/employees/[employeeId]`.

---

## 3. Requirement Traceability Matrix

The table below maps the functional requirements spec directly to the routing implementation, authorization rules, and backing server actions:

| Requirement Spec Section | Route Path | Access Level | Primary Server Action(s) |
|---|---|---|---|
| **3.1 Authentication & Email Verification** | `/signin`<br>`/signup`<br>`/verify-email` | Public | `signInAction`<br>`signUpAction`<br>`verifyEmailAction` |
| **3.2 Role-Based Dashboards** | `/dashboard` | Authenticated User | Reads `attendance`, `leaveRequests`, `activityLog` |
| **3.3 Profile & Self-Service Management** | `/profile`<br>`/admin/employees`<br>`/admin/employees/[employeeId]` | Employee (Self)<br>HR / Admin | `updateProfileSelfAction`<br>`adminUpdateEmployeeAction`<br>`changePasswordAction` |
| **3.4 Attendance Management** | `/attendance`<br>`/admin/attendance` | Employee (Self)<br>HR / Admin | `checkInAction`<br>`checkOutAction`<br>`adminOverrideAttendanceAction` |
| **3.5 Leave Workflows & Approvals** | `/leave`<br>`/admin/leave` | Employee (Self)<br>HR / Admin | `requestLeaveAction`<br>`withdrawLeaveAction`<br>`adminReviewLeaveAction` |
| **3.6 Payroll Visibility & Structure** | `/payroll`<br>`/admin/payroll` | Employee (Read-only)<br>HR / Admin | `adminUpdateSalaryAction` |

---

## 4. Verification & Testing Standards

To verify that changes to routing pages retain full type integrity and build readiness:

1. **TypeScript Type Safety**:
   ```bash
   npm run typecheck
   ```
   Validates global route component signature types generated in `.next/types/`.

2. **Production Build Compilation**:
   ```bash
   npm run build
   ```
   Compiles Next.js routes, verifies Server Components, and produces optimized static/dynamic page bundles.
