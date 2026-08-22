# System Architecture & Technical Trade-offs — Dayflow HRMS

Dayflow is a self-contained HR management portal: employees clock in and out, submit leave applications, and view salary structures; HR administrators manage profiles, override attendance, approve leave, and update salary revisions.

This document provides a comprehensive technical overview of **how the system is constructed, why specific architectural choices were made, and what technical debt or trade-offs each choice incurs**.

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Browser Client                                                          │
│   Server-rendered HTML + Lightweight Client Components (useActionState) │
└────────────────────────────┬────────────────────────────┬───────────────┘
                             │ Navigation                 │ Form POST
                             ▼                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Next.js 16 App Router (Single Node.js Process, No External API)         │
│                                                                         │
│  (auth) Route Group             (app) Route Group                       │
│  Public layout                  Protected layout → requireUser()        │
│  /signin, /signup,              /dashboard, /attendance, /leave,        │
│  /verify-email                  /payroll, /profile                      │
│                                 /admin/* → requireAdmin()               │
│                                                                         │
│  Page Components (page.tsx) ────── Read Queries ──────┐                 │
│  Server Actions (src/actions/*) ── Write Mutations ───┤                 │
│      Zod Validation -> Re-authorise -> Transaction   │                 │
│      -> logActivity() -> revalidatePath()             │                 │
└───────────────────────────────────────────────────────┼─────────────────┘
                                                        ▼
                                       ┌──────────────────────────────────┐
                                       │ PostgreSQL 15 Database           │
                                       │ Driver: postgres.js (max: 5)     │
                                       │ ORM: Drizzle ORM                 │
                                       └──────────────────────────────────┘
```

Dayflow operates entirely within **a single Next.js 16 process**. There are no external microservices, background job queues (Redis/BullMQ), caching layers (Redis/Memcached), or separate API gateways. Everything happens synchronously inside incoming HTTP request lifecycles.

---

## 2. Request Lifecycle Mechanics

### 2.1 Read Request Lifecycle (Data Fetching)
1. **Routing & Guards**: Incoming request targets a route under `(app)` (e.g. `/dashboard` or `/admin/leave`).
2. **Session Verification**: The parent layout `(app)/layout.tsx` or route page invokes `requireUser()` or `requireAdmin()`.
3. **Cookie Inspection**: Reads the `dayflow_session` cookie, verifies the HS256 JWT signature using `SESSION_SECRET`, and queries the database for user state (`is_active`, `email_verified_at`).
4. **Direct SQL Querying**: Server Component pages directly execute typed Drizzle ORM queries against Postgres.
5. **HTML Streaming**: Next.js streams the rendered React Server Component tree directly to the client browser. No client-side JSON fetch cascades occur.

### 2.2 Write Request Lifecycle (Mutations)
1. **Form Dispatch**: Client form submits payload via React 19 `useActionState` targeting a `"use server"` action in `src/actions/`.
2. **Re-Authorization**: The action re-derives the caller's session using `requireUser()` or `requireAdmin()`. It never relies on client-provided user IDs.
3. **Zod Validation**: Input parameters are parsed and validated against strict Zod schemas.
4. **Database Mutation**: The action executes Drizzle queries or transactions.
5. **Activity Logging**: User-visible actions trigger `logActivity()` to write an entry to `activity_log`.
6. **Path Revalidation**: The action calls `revalidatePath()` for all affected client route caches.
7. **Response Return**: Returns a standardized `{ error?: string; ok?: boolean | string }` payload to update client UI state.

---

## 3. Core Architectural Decisions

### 3.1 React Server Actions vs. REST / GraphQL API Layer
* **Decision**: All mutations are executed via React Server Actions in `src/actions/`. No REST endpoints (`/api/*`) or GraphQL endpoints are exposed.
* **Benefits**:
  * Eliminates API boilerplate, routing handlers, client fetch hooks, and manual JSON serialization.
  * Shared TypeScript types across client and server without code generation steps.
  * Progressively enhanced forms function even before client JavaScript hydrates.
  * Co-located authorization checks ensure security next to data mutation logic.
* **Trade-offs**:
  * Prevents external integrations (mobile apps, Slack bots, external payroll providers) from consuming Dayflow data.
  * Server actions are bound to Next.js HTTP contexts (`cookies()`, `redirect()`), making isolated unit testing harder without full request mocks.
* **Revisit Signal**: When a second client consumer (e.g., mobile app or public API integration) is required, extract core business logic into domain modules in `src/lib/` and expose Route Handlers.

### 3.2 Direct Database Queries in Server Components
* **Decision**: Pages directly import `db` from `src/db` and execute Drizzle queries inside `page.tsx`. Reusable queries are isolated in `src/lib/*-queries.ts` only when shared across multiple pages.
* **Benefits**:
  * Zero-abstraction database access results in fast development iteration.
  * High visibility of SQL queries directly inside page components.
* **Trade-offs**:
  * Query logic is dispersed across the route tree.
  * Modifications to schema or query shapes require searching across multiple page files.
* **Revisit Signal**: Promote inline queries to `src/lib/*-queries.ts` as soon as the same query structure is repeated twice.

### 3.3 Custom JWT Cookie Sessions vs. Auth Frameworks
* **Decision**: Authentication is implemented via custom `bcryptjs` hashing (cost factor 12) and `jose` HS256 JWT tokens stored in `httpOnly` `sameSite=lax` cookies (`dayflow_session`).
* **Benefits**:
  * Zero external authentication dependencies (e.g., NextAuth, Auth0, Supabase Auth).
  * Complete control over token payload, session duration, and revocation rules.
* **Trade-offs**:
  * Requires custom implementation for session revocation, password reset, rate limiting, and multi-factor authentication (MFA).
  * Changing `SESSION_SECRET` invalidates all active user sessions simultaneously.
* **Security Implementation**: JWT carries only `sub` (User ID). `getSessionUser()` queries the database on every request to verify `is_active = true` and `email_verified_at != null`, ensuring instant account revocation.

### 3.4 In-Route Authorization vs. Middleware Guards
* **Decision**: Access control is executed in layout files (`(app)/layout.tsx`) and at the top of every Server Action via `requireUser()` and `requireAdmin()`. Next.js `middleware.ts` is omitted.
* **Benefits**:
  * Authorization runs in Node.js with direct database access, enabling full user account state verification.
  * Middleware runs on Edge runtimes where database queries would require connection pooling or HTTP-based drivers.
* **Trade-offs**:
  * Missing a `requireAdmin()` call on a new admin page leaves the route exposed.
* **Mitigation**: Add a route-group layout `admin/layout.tsx` invoking `requireAdmin()` to provide a centralized fallback.

### 3.5 PostgreSQL Infrastructure & Driver Pool
* **Decision**: Powered by a single PostgreSQL database via `postgres.js` with `max: 5` connections, cached on `globalThis` in development to prevent connection leaks during hot reloads.
* **Benefits**:
  * ACID transaction support across user creation, leave approvals, and attendance overrides.
  * Single service architecture simplifies local development and deployment.
* **Trade-offs**:
  * Deploying on serverless platforms (Vercel, AWS Lambda) multiplies pool instances, potentially exhausting PostgreSQL connection limits.
* **Requirement for Serverless**: Use a database proxy/pooler (PgBouncer, Supabase Pooling, Neon Tech) when deploying serverless.

### 3.6 Schema-First ORM with Drizzle ORM
* **Decision**: `src/db/schema.ts` is the single source of truth. Schema pushing in development is handled via `drizzle-kit push`.
* **Benefits**:
  * Type-safe SQL builder with minimal runtime overhead.
  * Native TypeScript definitions derived directly from schema tables.
* **Trade-offs**:
  * `drizzle-kit push` compares live database state against schema files directly, which is suitable for development but unsafe for production databases where column drops could occur.
* **Production Requirement**: Transition to version-controlled migration files via `drizzle-kit generate` and `drizzle-kit migrate` prior to production releases.

---

## 4. Data Model Technical Trade-offs

### 4.1 Attendance Absence via Row Non-Existence
* **Design**: `attendance` table contains rows only for explicit actions (check-in, admin override, leave approval).
* **Consequence**: An absent day is represented by the **absence of a database row**.
* **Impact**: Querying attendance requires checking date gaps. Aggregating absence counts requires scanning calendar date ranges against existing records.
* **Alternative**: A nightly cron job inserting explicit `status = 'absent'` rows for unrecorded weekdays.

### 4.2 Single Sentinel Override (`is_manual`)
* **Design**: Admin attendance overrides set `is_manual = true`, locking status from automated check-out recalculations.
* **Consequence**: Only the latest status survives. Historic override records are stored only in `activity_log` text feeds rather than structured audit tables.

### 4.3 Denormalized Approved Leave Stamping
* **Design**: Approving leave executes a transaction that updates `leave_requests` AND upserts individual weekday rows into `attendance` with `status = 'leave'`.
* **Consequence**: Fast attendance queries without joining leave tables on every read. However, reversing an approved leave request requires explicit compensation logic to restore attendance states.

### 4.4 Effective-Dated Salary Structures
* **Design**: `salary_structures` uses unique constraint `(employee_id, effective_from)`. Editing pay for an existing date updates that record.
* **Consequence**: Maintains complete historical pay revisions, but does not capture granular line-item audit logs for single-day correction edits.

### 4.5 Annual Leave Balance Rollover & First-Day Vulnerability
* **Design**: `leave_balances` stores entitlements per `(employee_id, year, leave_type)`.
* **Vulnerability**: New year transitions require initializing balance rows for the new calendar year. Without an automated rollover script or lazy balance creation, leave applications in a new year fail validation due to missing entitlement rows.

---

## 5. Rules: Conventions vs. Database Constraints

| Rule Description | Enforced Location | Mechanism Type | Trade-off / Risk |
|---|---|---|---|
| Status Derivation (>=6h Present, >=3h Half-day) | `src/lib/attendance.ts` | Code Convention | Simple logic; does not account for flexible shifts or overtime rules. |
| Weekend Leave Excluded | `src/lib/leave.ts` | Code Convention | Assumes Monday-Friday work week; non-standard work schedules require updates. |
| Non-Overlapping Leave | `src/actions/leave.ts` | Code Convention | Checks pending/approved ranges; prevents multi-part split leave applications within single ranges. |
| Strict Password Rules | `src/lib/auth.ts` | Code Convention | Enforces length and character sets; missing breach database lookup. |
| Generic Auth Errors | `src/actions/auth.ts` | Code Convention | Prevents user enumeration; does not specify whether email or password was wrong. |
| Local Date Handling (`YYYY-MM-DD`) | `src/lib/dates.ts` | Code Convention | Prevents UTC timezone off-by-one errors; assumes single corporate timezone. |

---

## 6. Scaling & Performance Bottlenecks

1. **In-Memory Employee Directory Filtering**: `listEmployees()` queries all employee rows and applies string filtering in Node.js memory. This works well for small teams, but requires SQL `WHERE` clauses and `LIMIT/OFFSET` pagination for larger organizations.
2. **O(Staff × Days) Attendance Grid**: Admin weekly attendance views load all staff and range rows into memory before executing array filtering.
3. **Synchronous Bcrypt Processing**: Password hashing (cost factor 12) runs synchronously on the main Node.js event loop (~200ms per request), which can contend with rendering under high login concurrency.
4. **Database Connection Limits**: Default connection pool (`max: 5`) is tuned for single long-lived Node.js server instances.

---

## 7. Security & Risk Audit Surface

* **Self-Service Admin Registration**: The public `/signup` form allows selection of the `admin` role. This is designed for demo setup convenience, but must be restricted to invite-only or first-user-only flows before public deployment.
* **Server Timezone Dependency**: Dates are derived from the host server's local clock (`today()`). Distributed teams across multiple timezones require timezone-aware user context.
* **External Photo URL Rendering**: User profile photo URLs are rendered directly without proxying or domain whitelist validation.
