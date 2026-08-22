# System and trade-offs — Dayflow

> [!NOTE]
> This page is kept for backward compatibility. For the updated, complete technical documentation suite, see **[System Architecture & Trade-offs](System-Architecture-and-Trade-offs)**.

---

Dayflow is an HR portal: employees clock in and out, apply for leave, and read their salary; HR approves leave, overrides attendance, and maintains pay.

This page explains **how the system is put together and what each choice costs**.

---

## Contents

- [The system in one picture](#the-system-in-one-picture)
- [Request lifecycle](#request-lifecycle)
- [Architecture decisions](#architecture-decisions)
- [Data model trade-offs](#data-model-trade-offs)
- [Rules that are conventions, not constraints](#rules-that-are-conventions-not-constraints)
- [Scaling profile — where it breaks first](#scaling-profile--where-it-breaks-first)
- [Known risks](#known-risks)
- [What I would change first](#what-i-would-change-first)
- [Deliberately out of scope](#deliberately-out-of-scope)

---

## The system in one picture

```
┌─────────────────────────────────────────────────────────────┐
│ Browser                                                     │
│   server-rendered HTML + a thin layer of client components   │
│   (forms driven by useActionState)                           │
└───────────────┬──────────────────────────┬──────────────────┘
                │ navigation               │ form POST
                ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Next.js 16 App Router — one process, no separate backend     │
│                                                             │
│  (auth) shell            (app) shell → requireUser()         │
│  signin / signup         dashboard, profile, attendance,     │
│  verify-email            leave, payroll, admin/* →           │
│                          requireAdmin()                      │
│                                                             │
│  page.tsx = server component ──── reads ────┐               │
│  actions/*.ts = "use server" ─── writes ────┤               │
│      zod validate → re-authorise → mutate   │               │
│      → logActivity() → revalidatePath()     │               │
└─────────────────────────────────────────────┼───────────────┘
                                              ▼
                                   ┌────────────────────────┐
                                   │ Postgres (Drizzle ORM) │
                                   │ postgres.js, max 5     │
                                   └────────────────────────┘
```

There is no API tier, no cache, no queue, no background worker. Everything the product does happens inside one request against one database.

---

## Technical Documentation Suite

For complete, detailed technical references, please consult:
- **[System Architecture & Technical Trade-offs](System-Architecture-and-Trade-offs)**
- **[Database Schema & ERD Reference](Database-Schema-and-ERD)**
- **[Routing & Pages Catalog](Routing-and-Pages)**
- **[Server Actions API Reference](Server-Actions-and-API)**
- **[Developer Setup & Onboarding](Developer-Setup-and-Onboarding)**
- **[Testing & Quality Assurance](Testing-and-Quality-Assurance)**
