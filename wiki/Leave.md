# Leave

Rules: [`src/lib/leave.ts`](../src/lib/leave.ts).
Queries: [`src/lib/leave-queries.ts`](../src/lib/leave-queries.ts).
Writes: [`src/actions/leave.ts`](../src/actions/leave.ts).

## Types and quotas

| Type | Entitlement | Stored on `leave_balances` |
|---|---|---|
| Paid | 18 weekdays / calendar year | Yes |
| Sick | 12 weekdays / calendar year | Yes |
| Unpaid | None | No — skip the balance check |

The spec had no quota model. Change the numbers in `DEFAULT_ENTITLEMENT`.

Weekends never count. `countLeaveDays` walks the local date range and drops
Saturday and Sunday.

## Apply

`applyLeaveAction`:

1. Rejects `end < start` and weekend-only ranges.
2. Locks the employee row (`FOR UPDATE`) so two submits cannot both pass.
3. Rejects overlap with any pending or approved request.
4. For paid/sick, compares `days + daysUsed` to entitlement. `daysUsed` sums
   **approved and still-pending** days so queued requests reserve the balance.
5. Inserts `leave_requests` with `status = pending`.

Withdraw (`cancelLeaveAction`) deletes only the caller's own pending row.

## Approve / reject

`decideLeaveAction` is admin-only. Approve:

- sets status, comment, decider, timestamp
- upserts `attendance` as `leave` for each weekday in the range

Reject frees the reserved days because `daysUsed` ignores `rejected`.

## Year rows

Signup and seed insert balances for the current calendar year.
`ensureLeaveBalances` in `src/lib/leave-queries.ts` inserts the defaults on
first `leaveSummary` or paid/sick apply for a later year. Existing custom
entitlements are left alone (`onConflictDoNothing`).

## Views

- `/leave` — balances, apply form, own history, withdraw
- `/admin/leave?status=` — queue with `DecideLeave`
- Dashboard shows remaining paid/sick and recent requests

## Related

- [Attendance](Attendance.md)
- [Data model](Data-Model.md)
- [System and trade-offs](System_and_trade_of-Day-FLow.md)
