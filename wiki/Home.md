# Dayflow HRMS — Developer & System Wiki

Welcome to the official **Dayflow HRMS** technical documentation wiki. Dayflow is a modern, self-contained Human Resource Management System (HRMS) built for small-to-medium organizations. It enables employees to clock in/out, submit leave requests, view attendance calendars, and inspect salary structures, while providing HR administrators with robust tools for attendance overrides, leave approvals, salary structure versioning, and employee profile management.

Dayflow is engineered as a single, zero-external-API **Next.js 16 App Router** application that communicates directly with a **PostgreSQL** database using **Drizzle ORM**. Every mutation is powered by type-safe React Server Actions (`"use server"`), and every page is rendered server-side as a React Server Component.

---

## 📚 Technical Documentation Directory

| Documentation Module | Description | Primary File / Link |
|---|---|---|
| **[System Architecture & Trade-offs](System-Architecture-and-Trade-offs)** | Exhaustive breakdown of system architecture, request lifecycles, Server Action vs REST decisions, security audits, scaling bottlenecks, and technical trade-offs. | `wiki/System-Architecture-and-Trade-offs.md` |
| **[Database Schema & ERD](Database-Schema-and-ERD)** | PostgreSQL 15 schema specification, Mermaid ERD diagrams, table structures, column constraints, unique indexes, cascading rules, and seed mechanics. | `wiki/Database-Schema-and-ERD.md` |
| **[Routing & Pages Catalog](Routing-and-Pages)** | Next.js 16 App Router route catalog, directory layout hierarchy, dual-level authorization model (`requireUser`, `requireAdmin`), and detailed specifications for all 14 pages. | `wiki/Routing-and-Pages.md` |
| **[Server Actions API Reference](Server-Actions-and-API)** | Developer reference for all 12 `"use server"` mutation actions across authentication, attendance, leave workflows, and salary/profile administration with Zod validation. | `wiki/Server-Actions-and-API.md` |
| **[Developer Setup & Onboarding](Developer-Setup-and-Onboarding)** | Local development guide, environment variable setup, Drizzle push/migration workflow, seed execution, scripts catalog, and coding standards. | `wiki/Developer-Setup-and-Onboarding.md` |
| **[Testing & Quality Assurance](Testing-and-Quality-Assurance)** | Complete Vitest test framework guide, unit testing domain logic, integration testing server actions with `dayflow_test`, CI pipeline setup, and manual QA matrix. | `wiki/Testing-and-Quality-Assurance.md` |

---

## ✨ Feature Matrix

### Employee Portal (Self-Service)

| Feature Area | Functionality | Primary Components / Pages |
|---|---|---|
| **Dashboard** | Greeting header, today's attendance check-in/out card, weekly 7-day status grid, annual leave balances, recent activity feed, and latest leave requests. | `/dashboard` |
| **Attendance** | Personal attendance calendar, daily check-in & check-out timestamps, worked hours calculation, status derivation, and 14-day history log. | `/attendance` |
| **Leave Management** | Submit leave applications (Paid, Sick, Unpaid), view live annual entitlements vs used days, inspect application history, and withdraw pending requests. | `/leave` |
| **Salary Visibility** | Read-only view of current monthly gross, basic pay, HRA, special allowances, deductions, net pay, and full effective-dated revision history. | `/payroll` |
| **Profile Self-Edit** | View full job & personal details, update personal phone number, residential address, and avatar photo URL. | `/profile` |

### HR & Administration Portal

| Feature Area | Functionality | Primary Components / Pages |
|---|---|---|
| **Employee Directory** | Real-time SQL search across names, employee codes, departments; view employment type, active status pills, and pending leave indicators. | `/admin/employees` |
| **Employee Management** | Complete profile editing, role assignment (`employee` vs `admin`), employment status toggling (`is_active`), and direct access to personal records. | `/admin/employees/[employeeId]` |
| **Attendance Override** | Daily staff attendance table & weekly status grid; manual status override (`present`, `absent`, `half_day`, `leave`) with mandatory notes (`is_manual`). | `/admin/attendance` |
| **Leave Approvals** | Filter pending, approved, and rejected applications; approve/reject leave with optional decision notes; automatic attendance calendar stamping upon approval. | `/admin/leave` |
| **Payroll Administration** | Company-wide salary directory, total monthly payroll cost metrics, missing salary structure alerts, and effective-dated salary structure creation/editing. | `/admin/payroll` |

---

## 🛠️ Technology Stack

| Layer | Technology Choice | Details & Configuration |
|---|---|---|
| **Framework** | **Next.js 16.3.2** | App Router, React 19, Server Actions (`"use server"`), Server Components |
| **Language** | **TypeScript 5.x** | Strict mode enabled, path alias `@/*` -> `./src/*` |
| **Database** | **PostgreSQL 15+** | Native driver `postgres.js` (`postgres`), max 5 connections |
| **ORM / Migrations** | **Drizzle ORM** | Schema-first (`src/db/schema.ts`), `drizzle-kit` for schema pushing/migrations |
| **Authentication** | **Custom JWT Sessions** | `bcryptjs` (cost factor 12), `jose` HS256 JWT in `httpOnly` cookie (`dayflow_session`) |
| **Validation** | **Zod 4.x** | Schema validation on every server action and client form submission |
| **Styling** | **Tailwind CSS v4** | CSS-first configuration (`@theme inline` in `src/app/globals.css`), no `tailwind.config.js` |
| **Typography** | **Google Fonts** | `Geist` Sans & `Geist Mono` loaded via `next/font/google` |
| **Testing** | **Vitest 4** | Vitest with jsdom, `@testing-library/react`, `@testing-library/jest-dom` |

---

## 🚀 Quickstart & Getting Started

### 1. Prerequisites
- **Node.js**: v20.x or higher
- **PostgreSQL**: Local or remote Postgres database instance

### 2. Environment Configuration
Create `.env.local` in the root directory:

```bash
DATABASE_URL="postgres://postgres:postgres@localhost:5432/dayflow"
SESSION_SECRET="a-long-random-secret-key-at-least-32-characters-long"
APP_URL="http://localhost:3000"
```

### 3. Push Database Schema & Seed Data
```bash
# Push schema definitions directly to PostgreSQL
npx drizzle-kit push

# Seed demo users, attendance history, and leave requests
npx tsx src/db/seed.ts
```

### 4. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Credentials

Seeded demo accounts are already email-verified. Keep their credentials in
local development configuration or a password manager; do not publish them in
project documentation or deploy seeded credentials to production.

| Email | Employee ID | System Role | Job Title | Department |
|---|---|---|---|---|
| `asha@dayflow.test` | `HR001` | **admin** | HR Manager | Human Resources |
| `rohan@dayflow.test` | `EMP101` | **employee** | Backend Engineer | Engineering |
| `priya@dayflow.test` | `EMP102` | **employee** | Product Designer | Product |
| `daniel@dayflow.test` | `EMP103` | **employee** | QA Analyst | Quality Assurance |
| `mei@dayflow.test` | `EMP104` | **employee** | Account Executive | Sales |
| `sam@dayflow.test` | `EMP05` | **employee** | Support Lead | Customer Support |

---

## 🗺️ Application Route Map

```
/                              scaffold landing page (still the create-next-app default)
/signin                        (auth)
/signup                        (auth)  — register a standard employee account
/verify-email                  email verification landing

/dashboard                     (app)   employee home
/profile                       (app)   self-service profile
/attendance                    (app)   own attendance
/leave                         (app)   apply / history / balances
/payroll                       (app)   own salary, read-only

/admin/employees               (app)   directory              — admin only
/admin/employees/[employeeId]  (app)   edit profile + salary  — admin only
/admin/attendance              (app)   override attendance    — admin only
/admin/leave                   (app)   approve / reject       — admin only
/admin/payroll                 (app)   salary structures      — admin only
```

---

## 📊 Data Model & Schema Overview

The database model is defined in `src/db/schema.ts`. Every user account is linked 1:1 with an employee profile, and all domain tables cascade on employee deletion:

```
users ──1:1── employees ─┬──< attendance             (unique per employee + work_date)
  │                      ├──< leave_requests
  │                      ├──< leave_balances         (unique per employee + year + leave_type)
  │                      ├──< salary_structures      (unique per employee + effective_from)
  │                      ├──< documents
  │                      └──< activity_log           (append-only feed)
  └──< email_verification_tokens
```

---

## ⚙️ Core Business Rules Summary

1. **Attendance Status Derivation**:
   - ** Worked Hours >= 6.0h ** -> `present`
   - ** Worked Hours >= 3.0h ** -> `half_day`
   - ** Worked Hours < 3.0h ** -> `absent`
   - HR manual overrides setting `is_manual = true` lock the status from automated re-derivation.

2. **Leave Rules**:
   - Weekends (Saturdays & Sundays) are automatically excluded from leave duration calculations.
   - Entitlements default to **18 Paid** and **12 Sick** days per calendar year.
   - Applications checking overlap with existing pending or approved requests are rejected.
   - Leave approval automatically stamps attendance records with status `leave` for all weekdays in the range.

3. **Salary Structure**:
   - Effective-dated versioning (`effective_from`). Re-saving an existing date updates that revision.
   - `Gross = Basic + HRA + Allowances`. `Net = Gross - Deductions`. Deductions cannot exceed Gross.

4. **Security & Self-Lockout**:
   - Password policy: >=10 characters with uppercase, lowercase, number, and special character.
   - Self-lockout guard: HR administrators cannot revoke their own admin role or deactivate their own user account from the admin form.

---

## ⚙️ Repository Scripts Catalog

| Command | Action |
|---|---|
| `npm run dev` | Starts Next.js development server with Turbopack on `http://localhost:3000` |
| `npm run build` | Compiles production build and generates route type definitions in `.next/types/` |
| `npm run start` | Runs production server build |
| `npm run typecheck` | Executes `tsc --noEmit` to verify type safety across application |
| `npm test` | Runs Vitest test suite once across unit and integration tests |
| `npm run test:watch` | Runs Vitest in watch mode for active test-driven development |
