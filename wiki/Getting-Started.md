# Getting started

## Requirements

- Node.js 20+
- PostgreSQL 15 you can reach with a URL
- A `.env.local` in the repo root

## Environment

```
DATABASE_URL=postgres://USER@localhost:5432/dayflow
SESSION_SECRET=<a long random string>
APP_URL=http://localhost:3000
DEMO_SEED_PASSWORD=<a local demo password>
```

| Variable | Used by |
|---|---|
| `DATABASE_URL` | App, `drizzle.config.ts`, seed, migrate |
| `SESSION_SECRET` | JWT signing in `src/lib/auth.ts` (throws if missing) |
| `APP_URL` | Verification link in `signUpAction` |
| `DEMO_SEED_PASSWORD` | Password for seeded demo users |

`SESSION_SECRET` from development must never be reused in production.

## First run

```bash
npm install
createdb dayflow
createdb dayflow_test
npm run db:migrate
npm run db:seed
npm run dev
```

`db:push` still works for a local database you already created that way.
`db:migrate` applies the SQL in `drizzle/` and is what a hosted deploy uses
(`vercel.json` runs it before `next build`).

The seed **deletes every table** then inserts demo rows. It refuses
`NODE_ENV=production` unless `ALLOW_DEMO_SEED=true` is set. Never point it at
data you care about.

## Demo accounts

Password comes from `DEMO_SEED_PASSWORD`.

| Role | Email |
|---|---|
| HR / Admin | `asha@dayflow.test` |
| Employee | `rohan@dayflow.test` |

The seed also creates four more employees, about 30 weekdays of attendance,
and a mix of leave requests including two still pending.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at http://localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` (needs `.next/types/` from a prior `dev`/`build`) |
| `npm test` | Vitest once |
| `npm run db:push` | Diff `schema.ts` onto a live database |
| `npm run db:generate` | Write a new SQL file under `drizzle/` |
| `npm run db:migrate` | Apply committed migrations (`src/db/migrate.ts`) |
| `npm run db:seed` | Wipe and reseed |

## Related

- [Testing](Testing.md)
- [Deploying](Deploying.md)
- [Data model](Data-Model.md)
