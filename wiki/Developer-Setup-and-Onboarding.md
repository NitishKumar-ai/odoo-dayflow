# Dayflow HRMS — Developer Setup & Onboarding Guide

Welcome to the Dayflow HRMS developer guide! This document provides step-by-step instructions for configuring your local environment, setting up PostgreSQL, pushing database schemas, seeding demo accounts, and following established codebase conventions.

---

## 1. Environment Prerequisites

Before setting up Dayflow locally, ensure your system has the following software installed:

* **Node.js**: v20.0.0 or higher
* **npm**: v10.0.0 or higher
* **PostgreSQL**: v15.0 or higher (Local installation, Docker container, or remote database instance like Supabase/Neon)

---

## 2. Environment Configuration

1. Clone the repository and navigate into the root directory:
   ```bash
   git clone https://github.com/NitishKumar-ai/odoo-dayflow.git
   cd odoo-dayflow
   ```

2. Create a `.env.local` configuration file in the project root:
   ```bash
   DATABASE_URL="postgres://postgres:postgres@localhost:5432/dayflow"
   SESSION_SECRET="your-32-character-random-session-secret-key"
   APP_URL="http://localhost:3000"
   ```

> [!IMPORTANT]
> `SESSION_SECRET` is required for JWT cookie signing. `src/lib/auth.ts` will throw a runtime error if it is missing or empty.

---

## 3. Database Initialization & Seeding

### 3.1 Push Database Schema
Since database migration files are generated on demand, push the schema directly from `src/db/schema.ts` to your PostgreSQL database:

```bash
npx drizzle-kit push
```

### 3.2 Seed Demo Accounts & Data
Populate the database with realistic demo accounts, attendance logs, and leave requests:

```bash
npx tsx src/db/seed.ts
```

> [!WARNING]
> The seed script clears all database tables before inserting demo records. **Never run the seed script against a production database.**

---

## 4. Running the Application

### 4.1 Development Mode (Turbopack)
Start the Next.js development server with Turbopack fast refreshing:

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4.2 Typechecking
Verify TypeScript types across pages, server actions, and generated route types:

```bash
npm run typecheck
```

> [!NOTE]
> `npm run typecheck` requires `.next/types/` to exist. Run `npm run dev` or `npm run build` at least once before executing typecheck.

### 4.3 Production Build & Execution
```bash
# Build production bundles and compile route types
npm run build

# Start production server
npm run start
```

---

## 5. Pre-Configured Demo Accounts

All seeded accounts share the default password **`Dayflow#2026`**:

| Email Address | Employee Code | System Role | Job Title |
|---|---|---|---|
| `asha@dayflow.test` | `HR001` | **admin** | HR Manager |
| `rohan@dayflow.test` | `EMP101` | **employee** | Backend Engineer |
| `priya@dayflow.test` | `EMP102` | **employee** | Product Designer |
| `daniel@dayflow.test` | `EMP103` | **employee** | QA Analyst |
| `mei@dayflow.test` | `EMP104` | **employee** | Account Executive |
| `sam@dayflow.test` | `EMP105` | **employee** | Support Lead |

---

## 6. Codebase Architecture & Conventions

```
src/
├── app/             # App Router pages, layouts, and route groups
│   ├── (auth)/      # Signed-out login and registration pages
│   └── (app)/       # Signed-in protected employee and admin pages
├── actions/         # "use server" mutation actions (auth, attendance, leave, profile)
├── components/      # Reusable UI components & React hooks
├── lib/             # Core business rules, auth logic, date utilities, and queries
└── db/              # Drizzle schema, DB client connection, and seed script
```

### Key Development Rules:
1. **Pages are Server Components**: Pages in `src/app/` query Drizzle ORM directly. Mutations are encapsulated in `src/actions/`.
2. **Standard Action Returns**: Every server action returns `{ error?: string; ok?: boolean | string }` and invokes `requireUser()` or `requireAdmin()`.
3. **Zod Input Validation**: Validate incoming `FormData` using Zod schemas inside the action function.
4. **Cache Revalidation**: Always call `revalidatePath()` for all affected client routes after a mutation.
5. **Local Date Formatting**: Dates are stored and processed as local `YYYY-MM-DD` strings to align with PostgreSQL `date` columns.
6. **Tailwind v4 Styling**: Design tokens are configured in `src/app/globals.css` under `@theme inline`.
