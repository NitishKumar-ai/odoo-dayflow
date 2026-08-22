# Deploying Dayflow to Vercel

The build is ready to deploy. What it still needs is a Postgres database it can
reach from a data centre, and two secrets. Those are yours to create — this
guide never asks you to hand a credential to anyone else.

## What Dayflow needs at runtime

| Variable | What it is | Notes |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | `localhost` will not work from Vercel. Needs a hosted database. |
| `SESSION_SECRET` | Signing key for session cookies | Must be a **new** value. Never reuse the one in `.env.local`. |
| `APP_URL` | Public origin of the deployment | Used to build the email-verification link. |

Eleven of the sixteen routes query Postgres on every request. Without
`DATABASE_URL` the site still serves `/signin` and `/signup`, and everything
behind sign-in returns a server error.

## One-time setup

### 1. Link the repository to a Vercel project

```bash
vercel link
```

### 2. Add a Postgres database

Neon on the Vercel Marketplace is the closest fit — it is serverless Postgres,
so it suits a deployment that scales to zero between requests.

```bash
vercel marketplace add neon
```

This sets `DATABASE_URL` in the project for you. If you would rather bring your
own database, skip this and set the variable by hand:

```bash
vercel env add DATABASE_URL production
```

### 3. Add the session secret

Generate a fresh one and paste it when prompted. Do not reuse the development
secret — anyone holding it can forge a session cookie.

```bash
openssl rand -base64 48
vercel env add SESSION_SECRET production
```

### 4. Add the public URL

```bash
vercel env add APP_URL production
```

Use the production domain, for example `https://dayflow.vercel.app`. If you
attach a custom domain later, update this value or verification links will keep
pointing at the old origin.

## Deploy

```bash
vercel --prod
```

The build command in `vercel.json` runs `npm run db:migrate` before
`next build`, so the schema in `drizzle/` is applied on every deploy. The
migration is idempotent — a deploy with no schema change is a no-op.

## First run

The database starts empty, so nobody can sign in yet. Create the first account
through `/signup`, which always creates an **employee**. Promote it to
administrator directly in the database:

```sql
update users set role = 'admin' where email = 'you@company.com';
```

Do not run `npm run db:seed` against the production database. It deletes every
table before inserting demo data, and refuses to run with `NODE_ENV=production`
unless `ALLOW_DEMO_SEED=true` is also set. That guard exists to stop exactly
this mistake.

## Known gaps at v0.2.0.0

- **Verification email is not sent.** `signUpAction` builds a real single-use
  link and writes it to the server log; nothing delivers it. A new account
  cannot activate itself on a hosted deployment until a mail provider is wired
  in. Tracked as P0 in `TODOS.md`.
- **Document upload has no storage target.** The profile document list renders,
  but there is no upload path. Tracked as P1.
- **CI does not run.** The workflow is written and sitting in `ci/`; moving it
  into `.github/workflows/` needs a token with `workflow` scope. Tracked as P1.
