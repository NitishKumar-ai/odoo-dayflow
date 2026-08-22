# Deploying

The full Vercel walkthrough is [`DEPLOYING.md`](../DEPLOYING.md). This page
is the checklist.

## Runtime env

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Hosted Postgres. `localhost` will not work from Vercel |
| `SESSION_SECRET` | New value. Never reuse `.env.local` |
| `APP_URL` | Public origin, used for the verification link |

Eleven of the sixteen routes query Postgres on every request. Without
`DATABASE_URL`, `/signin` and `/signup` still render; everything behind
sign-in errors.

The `postgres.js` pool is `max: 5`. On serverless that multiplies by
instance count — use a pooler (Neon / PgBouncer) before traffic grows.

## Schema on deploy

`vercel.json` runs `npm run db:migrate` before `next build`. Migrations in
`drizzle/` are idempotent. A deploy with no schema change is a no-op.

Do not run `db:seed` against a real company database. The script wipes every
table and is blocked in production unless `ALLOW_DEMO_SEED=true`.

## First admin

Signup always creates an employee. Promote in SQL:

```sql
update users set role = 'admin' where email = 'you@company.com';
```

Or create the account locally, then change role from
`/admin/employees/[id]`.

## Gaps that affect a host

- Verification mail is not sent. A new user cannot activate without the
  server log (or a mail provider).
- Document upload has no storage backend.
- CI is not on GitHub Actions yet.

## Related

- [Getting started](Getting-Started.md)
- [Authentication](Authentication.md)
- [System and trade-offs](System_and_trade_of-Day-FLow.md)
