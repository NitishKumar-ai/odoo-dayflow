# Authentication

All session logic lives in [`src/lib/auth.ts`](../src/lib/auth.ts). Password
rules live in [`src/lib/password.ts`](../src/lib/password.ts) and are re-exported
as `passwordProblems`.

## Sign up

`signUpAction` in `src/actions/auth.ts`:

1. Validates employee code, email, names, and password with Zod.
2. Rejects a duplicate email or employee code.
3. Inserts `users` + `employees` + current-year `leave_balances` (18 paid, 12
   sick) + a verification token in one transaction.
4. Logs the verification URL. In development the confirm page also gets
   `devToken`.

New accounts are role `employee`. Promote someone in the employee editor, or
with SQL on a fresh deploy (`DEPLOYING.md`).

## Verification

Tokens are 32 random bytes, single-use, valid 24 hours. Opening
`/verify-email?token=…` sets `users.email_verified_at` and `used_at`.

Nothing sends the email. The link is written to the server log. That is the
P0 gap in `TODOS.md`.

## Sign in

`signInAction` checks email, password, `email_verified_at`, and `is_active`.
Failures are generic so the form does not leak which check failed, except
where the product already surfaces "verify first" / inactive.

On success it calls `createSession(userId)`.

## Session cookie

| | |
|---|---|
| Name | `dayflow_session` |
| Payload | HS256 JWT, `{ sub: userId }` via `jose` |
| Life | 8 hours (`maxAge` and `exp`) |
| Flags | `httpOnly`, `SameSite=Lax`, `secure` in production |

`getSessionUser()` verifies the JWT, then **re-reads** the user and employee
row. A deactivated or unverified account returns `null` even if the cookie is
still valid. A malformed cookie also returns `null` — it does not throw.

## Guards

```ts
requireUser()   // redirect → /signin
requireAdmin()  // requireUser, then redirect → /dashboard if role !== "admin"
```

Use these in pages **and** in every new server action. The URL is not a
permission.

`SessionUser` carries `userId`, `employeeId`, `employeeCode`, `email`, `role`,
and `name`.

## Password rules

At least 10 characters, with upper case, lower case, a digit, and a symbol.
`passwordProblems` returns the list of failures so the sign-up form can show
them.

## Related

- [Architecture](Architecture.md)
- [Routes and pages](Routes-and-Pages.md)
- [Getting started](Getting-Started.md)
