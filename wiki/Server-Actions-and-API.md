# Dayflow HRMS — Server Actions API Reference

This document provides a comprehensive developer API reference for all **React Server Actions** (`"use server"`) powering data mutations in **Dayflow HRMS**.

---

## 1. Action Lifecycle Architecture

Every mutation in Dayflow executes server-side inside `src/actions/` following a strict 5-stage lifecycle:

```
Client Form Submission (useActionState)
   │
   ▼
[Server Action Entry]
   │
   ├── 1. Authorisation Verification (requireUser() or requireAdmin())
   ├── 2. Input Parsing & Zod Schema Validation
   ├── 3. Database Mutation Execution (Drizzle ORM query / transaction)
   ├── 4. User Activity Feed Logging (logActivity())
   ├── 5. Client Cache Revalidation (revalidatePath() for all affected views)
   │
   ▼
[Return FormState Payload] ({ ok?: boolean | string; error?: string })
```

---

## 2. Common Types & Action Contract

All form-bound server actions adhere to the React 19 `useActionState` signature contract:

```typescript
export type FormState = {
  error?: string;
  ok?: boolean | string;
};

// Standard Action Signature:
export async function actionName(
  prevState: FormState,
  formData: FormData
): Promise<FormState>;
```

---

## 3. Server Actions Reference Catalog

---

### 3.1 Authentication Actions (`src/actions/auth.ts`)

#### `signInAction(prevState: FormState, formData: FormData): Promise<FormState>`
* **Access Level**: Public
* **Validation Schema**:
  * `email`: Required valid email string.
  * `password`: Required non-empty string.
* **Execution Flow**:
  1. Searches `users` table for matching email.
  2. Verifies bcrypt password hash against stored hash.
  3. Validates account status (`is_active === true`) and activation (`email_verified_at !== null`).
  4. Signs HS256 JWT session cookie (`dayflow_session`, 8-hour duration, `httpOnly`, `sameSite=lax`).
  5. Redirects user to `/dashboard`.
* **Error Messages**:
  * `"Incorrect email or password"` (generic security response to prevent user enumeration).
  * `"Please verify your email before signing in."`
  * `"Your account is deactivated."`

#### `signUpAction(prevState: FormState, formData: FormData): Promise<FormState>`
* **Access Level**: Public
* **Validation Schema**:
  * `firstName`: Non-empty string.
  * `lastName`: Optional string.
  * `employeeCode`: Uppercase alphanumeric string (e.g. `EMP104`).
  * `email`: Valid corporate email string.
  * `password`: Validated against password policy (>=10 chars, uppercase, lowercase, digit, symbol).
  * `role`: `"employee"` \| `"admin"`.
* **Execution Flow**:
  1. Checks `users` table for email or employee code conflicts.
  2. Hashes password using bcrypt (cost factor 12).
  3. Inserts `users` record (`is_active = false`, `email_verified_at = null`).
  4. Inserts associated `employees` profile record.
  5. Seeds annual leave balances (`leave_balances`) for current year (18 Paid, 12 Sick).
  6. Generates 32-byte crypto verification token valid for 24 hours (`email_verification_tokens`).
  7. Redirects to `/verify-email?sent=<email>&devToken=<token>`.

#### `verifyEmailAction(token: string): Promise<{ ok: boolean; error?: string }>`
* **Access Level**: Public
* **Execution Flow**:
  1. Locates token record in `email_verification_tokens`.
  2. Verifies token has not expired (`expiresAt > NOW()`).
  3. Updates `users` record setting `email_verified_at = NOW()` and `is_active = true`.
  4. Deletes consumed verification token.
* **Returns**: `{ ok: true }` or `{ ok: false, error: string }`.

#### `signOutAction(): Promise<void>`
* **Access Level**: Authenticated User (`requireUser()`)
* **Execution Flow**: Clears `dayflow_session` cookie and redirects to `/signin`.

---

### 3.2 Attendance Actions (`src/actions/attendance.ts`)

#### `checkInAction(): Promise<FormState>`
* **Access Level**: Authenticated User (`requireUser()`)
* **Execution Flow**:
  1. Queries today's attendance record for current employee (`work_date = today()`).
  2. Verifies employee has not already checked in today.
  3. Inserts `attendance` row with `check_in_at = NOW()`, `status = 'present'`, `is_manual = false`.
  4. Logs activity: `"Checked in at HH:MM"`.
  5. Revalidates client paths `/dashboard` and `/attendance`.

#### `checkOutAction(): Promise<FormState>`
* **Access Level**: Authenticated User (`requireUser()`)
* **Execution Flow**:
  1. Fetches today's attendance record for employee.
  2. Calculates total worked duration (`check_out_at - check_in_at`).
  3. Derives status (if `is_manual === false`): **>=6.0h -> 'present'**, **>=3.0h -> 'half_day'**, **<3.0h -> 'absent'**.
  4. Updates record setting `check_out_at = NOW()` and derived status.
  5. Logs activity: `"Checked out at HH:MM"`.
  6. Revalidates `/dashboard` and `/attendance`.

#### `adminOverrideAttendanceAction(prevState: FormState, formData: FormData): Promise<FormState>`
* **Access Level**: HR / Admin Only (`requireAdmin()`)
* **Validation Schema**:
  * `employeeId`: Valid UUID string.
  * `workDate`: Date string (`YYYY-MM-DD`).
  * `status`: `"present"` \| `"absent"` \| `"half_day"` \| `"leave"`.
  * `note`: Optional explanation text.
* **Execution Flow**:
  1. Upserts `attendance` record for target employee and date.
  2. Sets `is_manual = true` (preventing automatic check-out status re-derivation).
  3. Revalidates `/admin/attendance`, `/admin/employees/[employeeId]`, `/attendance`, and `/dashboard`.

---

### 3.3 Leave Actions (`src/actions/leave.ts`)

#### `requestLeaveAction(prevState: FormState, formData: FormData): Promise<FormState>`
* **Access Level**: Authenticated User (`requireUser()`)
* **Validation Schema**:
  * `leaveType`: `"paid"` \| `"sick"` \| `"unpaid"`.
  * `startDate`: Date string (`YYYY-MM-DD`, >= today).
  * `endDate`: Date string (`YYYY-MM-DD`, >= `startDate`).
  * `remarks`: Optional reason text.
* **Business Logic Checks**:
  1. Business Days Check: Computes weekdays in range (excluding Saturdays & Sundays). Rejects if 0 business days.
  2. Overlap Check: Rejects if range overlaps any non-rejected existing request.
  3. Quota Check: For paid/sick leave, verifies remaining balance (`entitled - used >= requested_days`).
* **Execution Flow**:
  1. Inserts `leave_requests` row (`status = 'pending'`).
  2. Logs activity: `"Requested N day(s) of [type] leave"`.
  3. Revalidates `/leave` and `/dashboard`.

#### `withdrawLeaveAction(prevState: FormState, formData: FormData): Promise<FormState>`
* **Access Level**: Authenticated User (`requireUser()`)
* **Validation Schema**: `requestId`: Valid UUID string.
* **Execution Flow**:
  1. Verifies request belongs to authenticated user and `status === 'pending'`.
  2. Deletes request from `leave_requests`.
  3. Revalidates `/leave` and `/dashboard`.

#### `adminReviewLeaveAction(prevState: FormState, formData: FormData): Promise<FormState>`
* **Access Level**: HR / Admin Only (`requireAdmin()`)
* **Validation Schema**:
  * `requestId`: Valid UUID string.
  * `decision`: `"approved"` \| `"rejected"`.
  * `decisionComment`: Optional HR note string.
* **Execution Flow**:
  1. Updates `leave_requests` record setting `status`, `decision_comment`, `decided_at = NOW()`, `decided_by = admin.id`.
  2. **If Approved**:
     - Increments `leave_balances.used_days` for target employee.
     - Upserts `attendance` records for every weekday in the leave range with `status = 'leave'`.
  3. Revalidates `/admin/leave`, `/leave`, `/dashboard`, `/attendance`, and `/admin/attendance`.

---

### 3.4 Profile & Salary Actions (`src/actions/profile.ts`)

#### `updateProfileSelfAction(prevState: FormState, formData: FormData): Promise<FormState>`
* **Access Level**: Authenticated User (`requireUser()`)
* **Validation Schema**:
  * `phone`: Optional phone string.
  * `address`: Optional address string.
  * `photoUrl`: Optional URL string.
* **Execution Flow**: Updates `employees` record for current user. Revalidates `/profile` and `/dashboard`.

#### `adminUpdateEmployeeAction(prevState: FormState, formData: FormData): Promise<FormState>`
* **Access Level**: HR / Admin Only (`requireAdmin()`)
* **Validation Schema**: `employeeId`, `firstName`, `lastName`, `phone`, `address`, `jobTitle`, `department`, `employmentType`, `dateOfJoining`, `dateOfBirth`, `role`, `isActive`.
* **Self-Lockout Guard**: Prevents admin from removing their own admin role or deactivating their own user account.
* **Execution Flow**: Updates `employees` and `users` records. Revalidates employee directory and detail views.

#### `adminUpdateSalaryAction(prevState: FormState, formData: FormData): Promise<FormState>`
* **Access Level**: HR / Admin Only (`requireAdmin()`)
* **Validation Schema**: `employeeId`, `effectiveFrom`, `currency`, `basic`, `hra`, `allowances`, `deductions`.
* **Validation Rule**: Enforces `deductions <= (basic + hra + allowances)`.
* **Execution Flow**: Creates or updates effective-dated revision in `salary_structures`. Revalidates `/admin/payroll`, `/admin/employees/[employeeId]`, `/payroll`, and `/profile`.

---

## 4. Summary Matrix

| Action Function | File Path | Access Level | Primary Revalidated Views |
|---|---|---|---|
| `signInAction` | `src/actions/auth.ts` | Public | `/dashboard` |
| `signUpAction` | `src/actions/auth.ts` | Public | `/verify-email` |
| `checkInAction` | `src/actions/attendance.ts` | Employee | `/dashboard`, `/attendance` |
| `checkOutAction` | `src/actions/attendance.ts` | Employee | `/dashboard`, `/attendance` |
| `adminOverrideAttendanceAction` | `src/actions/attendance.ts` | Admin | `/admin/attendance`, `/admin/employees/[id]`, `/attendance`, `/dashboard` |
| `requestLeaveAction` | `src/actions/leave.ts` | Employee | `/leave`, `/dashboard` |
| `withdrawLeaveAction` | `src/actions/leave.ts` | Employee | `/leave`, `/dashboard` |
| `adminReviewLeaveAction` | `src/actions/leave.ts` | Admin | `/admin/leave`, `/leave`, `/dashboard`, `/attendance`, `/admin/attendance` |
| `updateProfileSelfAction` | `src/actions/profile.ts` | Employee | `/profile`, `/dashboard` |
| `adminUpdateEmployeeAction` | `src/actions/profile.ts` | Admin | `/admin/employees`, `/admin/employees/[id]` |
| `adminUpdateSalaryAction` | `src/actions/profile.ts` | Admin | `/admin/payroll`, `/admin/employees/[id]`, `/payroll`, `/profile` |
