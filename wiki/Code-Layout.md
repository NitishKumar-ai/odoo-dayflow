# Code layout

```
src/
  app/
    (auth)/           signin, signup
    (app)/            signed-in shell + admin/*
    verify-email/
    layout.tsx  page.tsx  globals.css
  actions/            "use server" mutations
  components/         client UI; admin/ for HR forms
  lib/                auth, dates, attendance, leave, money, activity, *-queries
  db/                 schema, client, migrate, seed, load-env
test/                 one file per module
wiki/                 this code wiki
docs/ROUTING_PAGES.md long-form route catalogue
drizzle/              committed SQL migrations
ci/                   GitHub Actions YAML, not yet under .github/workflows/
```

Path alias: `@/*` → `./src/*`.

## Conventions

**Pages are server components.** They query Drizzle. Forms are client
components that call actions through `useActionState`.

**Every action returns** `{ error?: string; ok?: string }` and calls
`requireUser()` or `requireAdmin()`. Never trust the client.

**Zod** parses `FormData` inside the action. Show the first issue message.

**`useFields`** (`src/components/useFields.ts`) is required on any form that
posts to a server action. React 19 resets the form when the action settles
and will not re-apply an unchanged controlled value, so a plain `<select>`
snaps back to the first option. The hook also adopts password-manager
autofill. Both behaviours have regression tests.

**`revalidatePath`** every view the mutation touches, including the other
role. Approving leave refreshes `/admin/leave`, `/leave`, `/attendance`, and
`/admin/attendance`.

**Dates** are local `YYYY-MM-DD` strings. Use `src/lib/dates.ts`. Do not
construct `new Date(key)` for a date-only value.

**Money** goes through `src/lib/money.ts`. Do not add numeric columns as
numbers.

**Server-only** modules import `server-only` (`lib/auth.ts`, `lib/activity.ts`,
query modules).

**`logActivity`** writes the dashboard feed for user-visible changes.

**Tokens** live in `src/app/globals.css` on `:root` and in `@theme inline`.
Do not add `tailwind.config.js`. Tailwind v4 cannot `@apply` one component
class from another — shared button rules are declared once across selectors
(`.btn-primary`, etc.).

**Fonts** are Geist / Geist Mono via `next/font/google` in the root layout.

## Adding a mutation

1. Put the function in `src/actions/*.ts` with `"use server"`.
2. Call `requireUser()` or `requireAdmin()` first.
3. Parse with Zod.
4. Write through Drizzle.
5. `revalidatePath` every page that shows the data.
6. Add a test in `test/*-actions.test.ts` for both success and the rejection
   you just coded.

## Related

- [Architecture](Architecture.md)
- [Testing](Testing.md)
- [`AGENTS.md`](../AGENTS.md) — Next.js 16 notice
- [`CLAUDE.md`](../CLAUDE.md) — commands and project rules
