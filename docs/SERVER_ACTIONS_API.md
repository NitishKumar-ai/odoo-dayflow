# Dayflow HRMS — Server Actions API Reference

This document provides a comprehensive developer reference for all Server Actions (`"use server"`) in **Dayflow HRMS**. 

---

## 1. Architecture & Design Conventions

Every mutation in Dayflow executes as a Next.js 16 Server Action inside `src/actions/`.

### 1.1 Action Lifecycle & Conventions

```
Client Form Submit (useActionState)
   │
   ▼
[Server Action Entry]
   │
   ├── 1. Authorisation Check (requireUser() / requireAdmin())
   ├── 2. Input Parsing & Zod Schema Validation
   ├── 3. Database Mutation (Drizzle ORM transaction/query)
   ├── 4. Activity Logging (logActivity() for dashboard feed)
   ├── 5. Cache Revalidation (revalidatePath() across affected views)
   │
   ▼
[Return FormState] ({ ok?: string | boolean; error?: string })
```

### 1.2 Common Types & Signatures

All form-based server actions implement the React 19 `useActionState` contract:

```typescript
export type FormState = {
  error?: string;
  ok?: boolean | string;
};

// Signature:
export async function actionName(
  prevState: FormState,
  formData: FormData
): Promise<FormState>;
```

### 1.3 Security & Authorisation Rule

> [!IMPORTANT]
> **No public mutations.** Every server action must invoke either `requireUser()` (for employee self-service) or `requireAdmin()` (for HR management) at the very beginning of execution.

---

## 2. Server Actions Reference Catalog

---

### 2.1 Authentication Actions (`src/actions/auth.ts`)

#### `signInAction(prevState: FormState, formData: FormData): Promise<FormState>`
- **Access Level**: Public
- **Validation Schema**:
  - `email`: Required email string.
  - `password`: Required non-empty string.
- **Functionality**:
  1. Searches active user records in `users` table by email.
  2. Verifies bcrypt password hash against stored credentials.
  3. Verifies account `is_active === true` and `email_verified_at !== null`.
  4. Signs HS256 JWT session cookie (`dayflow_session`, 8-hour lifetime, `httpOnly`, `sameSite=lax`).
  5. Redirects to `/dashboard`.
- **Error Messages**:
  - `"Incorrect email or password"` (generic security error preventing email enumeration).
  - `"Please verify your email before signing in."`
  - `"Your account is deactivated."`

#### `signUpAction(prevState: FormState, formData: FormData): Promise<FormState>`
- **Access Level**: Public
- **Validation Schema**:
  - `firstName`: Non-empty string.
  - `lastName`: Optional string.
  - `employeeCode`: Uppercase alphanumeric code (e.g. `EMP1042`).
  - `email`: Valid email string.
  - `password`: Enforces policy (>=10 chars, uppercase, lowercase, number, symbol via `passwordProblems`).
  - `role`: `"employee"` | `"admin"`.
- **Functionality**:
  1. Checks for existing email or employee code conflicts.
  2. Hashes password with bcrypt (cost factor 12).
  3. Creates `users` record (`is_active = false`, `email_verified_at = null`).
  4. Creates associated `employees` profile record.
  5. Seeds initial annual leave balances (`leave_balances`) for current calendar year (18 Paid, 12 Sick).
  6. Generates 32-byte crypto verification token valid for 24 hours (`email_verification_tokens`).
  7. Redirects to `/verify-email?sent=<email>&devToken=<token>`.

#### `verifyEmailAction(token: string): Promise<{ ok: boolean; error?: string }>`
- **Access Level**: Public
- **Functionality**:
  1. Looks up token in `email_verification_tokens`.
  2. Validates token has not expired (`expiresAt > NOW()`).
  3. Marks `users.email_verified_at = NOW()` and `users.is_active = true`.
  4. Deletes consumed verification token.
- **Returns**: `{ ok: true }` or `{ ok: false, error: string }`.

#### `signOutAction(): Promise<void>`
- **Access Level**: Authenticated User (`requireUser()`)
- **Functionality**: Deletes `dayflow_session` cookie and redirects user to `/signin`.

---

### 2.2 Attendance Actions (`src/actions/attendance.ts`)

#### `checkInAction(): Promise<FormState>`
- **Access Level**: Authenticated User (`requireUser()`)
- **Functionality**:
  1. Checks if an attendance record exists for today (`work_date = today()`).
  2. Prevents duplicate check-ins if already checked in.
  3. Inserts row into `attendance` with `check_in_at = NOW()`, `status = 'present'`, `is_manual = false`.
  4. Revalidates `/dashboard` and `/attendance`.
  5. Logs activity: `"Checked in at HH:MM"`.

#### `checkOutAction(): Promise<FormState>`
- **Access Level**: Authenticated User (`requireUser()`)
- **Functionality**:
  1. Fetches today's attendance record for employee.
  2. Calculates total worked hours (`check_out_at - check_in_at`).
  3. Derives status: **>=6h -> 'present'**, **>=3h -> 'half_day'**, **<3h -> 'absent'** (unless `is_manual === true`).
  4. Updates `check_out_at = NOW()` and derived status.
  5. Revalidates `/dashboard` and `/attendance`.
  6. Logs activity: `"Checked out at HH:MM"`.

#### `adminOverrideAttendanceAction(prevState: FormState, formData: FormData): Promise<FormState>`
- **Access Level**: HR / Admin Only (`requireAdmin()`)
- **Validation Schema**:
  - `employeeId`: Valid UUID.
  - `workDate`: `YYYY-MM-DD` date string.
  - `status`: `"present"` | `"absent"` | `"half_day"` | `"leave"`.
  - `note`: Optional explanation text.
- **Functionality**:
  1. Upserts `attendance` record for target employee and date.
  2. Sets `is_manual = true` (preventing automated system recalculation).
  3. Revalidates `/admin/attendance`, `/admin/employees/[employeeId]`, `/attendance`, and `/dashboard`.

---

### 2.3 Leave Actions (`src/actions/leave.ts`)

#### `requestLeaveAction(prevState: FormState, formData: FormData): Promise<FormState>`
- **Access Level**: Authenticated User (`requireUser()`)
- **Validation Schema**:
  - `leaveType`: `"paid"` | `"sick"` | `"unpaid"`.
  - `startDate`: `YYYY-MM-DD` string (>= today).
  - `endDate`: `YYYY-MM-DD` string (>= `startDate`).
  - `remarks`: Optional reason.
- **Business Logic Checks**:
  1. Calculates business days in date range (excluding Saturdays & Sundays). Rejects if 0 business days.
  2. Overlap Check: Rejects if range overlaps any existing `pending` or `approved` request.
  3. Quota Check: For paid/sick leave, verifies remaining balance (`entitled - used >= requested_days`).
- **Functionality**:
  1. Inserts row into `leave_requests` (`status = 'pending'`).
  2. Revalidates `/leave` and `/dashboard`.
  3. Logs activity: `"Requested N day(s) of [type] leave"`.

#### `withdrawLeaveAction(prevState: FormState, formData: FormData): Promise<FormState>`
- **Access Level**: Authenticated User (`requireUser()`)
- **Validation Schema**:
  - `requestId`: Valid UUID.
- **Functionality**:
  1. Ensures target leave request belongs to authenticated employee and `status === 'pending'`.
  2. Deletes request from `leave_requests`.
  3. Revalidates `/leave` and `/dashboard`.

#### `adminReviewLeaveAction(prevState: FormState, formData: FormData): Promise<FormState>`
- **Access Level**: HR / Admin Only (`requireAdmin()`)
- **Validation Schema**:
  - `requestId`: Valid UUID.
  - `decision`: `"approved"` | `"rejected"`.
  - `decisionComment`: Optional HR note.
- **Functionality**:
  1. Updates `leave_requests` status, `decision_comment`, `decided_at = NOW()`, `decided_by = admin.id`.
  2. **If Approved**:
     - Updates `leave_balances.used` for employee.
     - Upserts `attendance` records for every weekday in the leave range with `status = 'leave'`.
  3. Revalidates `/admin/leave`, `/leave`, `/dashboard`, `/attendance`, `/admin/attendance`.

---

### 2.4 Profile & Salary Actions (`src/actions/profile.ts`)

#### `updateProfileSelfAction(prevState: FormState, formData: FormData): Promise<FormState>`
- **Access Level**: Authenticated User (`requireUser()`)
- **Validation Schema**:
  - `phone`: Optional phone string.
  - `address`: Optional address string.
  - `photoUrl`: Optional URL string.
- **Functionality**:
  1. Updates `employees` record for current user.
  2. Revalidates `/profile` and `/dashboard`.

#### `adminUpdateEmployeeAction(prevState: FormState, formData: FormData): Promise<FormState>`
- **Access Level**: HR / Admin Only (`requireAdmin()`)
- **Validation Schema**:
  - `employeeId`: Valid UUID.
  - `firstName`, `lastName`, `phone`, `address`, `jobTitle`, `department`, `employmentType`, `dateOfJoining`, `dateOfBirth`, `role`, `isActive`.
- **Self-Lockout Protection**: Prevents admin from removing their own admin role or deactivating their own account.
- **Functionality**: Updates `employees` and `users` tables. Revalidates employee list and detail views.

#### `adminUpdateSalaryAction(prevState: FormState, formData: FormData): Promise<FormState>`
- **Access Level**: HR / Admin Only (`requireAdmin()`)
- **Validation Schema**:
  - `employeeId`: Valid UUID.
  - `effectiveFrom`: `YYYY-MM-DD`.
  - `currency`: ISO code (e.g. `INR`).
  - `basic`, `hra`, `allowances`, `deductions`: Non-negative numeric strings.
- **Validation Rule**: `deductions <= (basic + hra + allowances)`.
- **Functionality**:
  1. Creates or updates effective-dated version in `salary_structures`.
  2. Revalidates `/admin/payroll`, `/admin/employees/[employeeId]`, `/payroll`, `/profile`.

---

## 3. Summary Matrix

| Action Name | File | Access | Main Side Effects |
|---|---|---|---|
| `signInAction` | `auth.ts` | Public | Sets JWT Cookie, redirects to `/dashboard` |
| `signUpAction` | `auth.ts` | Public | Creates `users`, `employees`, `leave_balances`, token |
| `checkInAction` | `attendance.ts` | Employee | Inserts `attendance` row, logs activity |
| `checkOutAction` | `attendance.ts` | Employee | Updates `check_out_at`, derives status |
| `requestLeaveAction` | `leave.ts` | Employee | Inserts `leave_requests`, checks overlap/quotas |
| `adminReviewLeaveAction` | `leave.ts` | Admin | Updates request, updates balance & attendance |
| `adminUpdateSalaryAction` | `profile.ts` | Admin | Inserts versioned `salary_structures` |
