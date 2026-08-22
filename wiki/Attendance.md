# Attendance

Rules: [`src/lib/attendance.ts`](../src/lib/attendance.ts).
Writes: [`src/actions/attendance.ts`](../src/actions/attendance.ts).

## One row per person per day

`attendance` is unique on `(employee_id, work_date)`. Check-in inserts today's
row. A second check-in on the same day reports "already checked in" instead of
hitting the unique constraint.

## How status is earned

At check-out, hours worked decide the status:

| Hours | Status |
|---|---|
| ≥ 6 | `present` |
| ≥ 3 and < 6 | `half_day` |
| < 3 | `absent` |

An open day (checked in, not out) reads as `present`.

Approved leave and an HR override beat the derived value. Override sets
`is_manual` so a later check-out does not overwrite it.

## Employee view

`/attendance` shows today, a week table (`?week=`), and the last 14 recorded
days. `CheckInOut` posts `checkInAction` / `checkOutAction`.

## HR view

`/admin/attendance`:

- `view=day` — roster with times, hours, and `AttendanceOverride`
- `view=week` — company grid (`P` / `A` / `H` / `L`)

`setAttendanceStatusAction` requires admin, writes status + note, sets
`is_manual`.

Two admins saving the same cell use an upsert on `(employee_id, work_date)` so
the second write wins instead of failing.

## Leave write-through

Approving a request stamps every **weekday** in the range as `leave`. Weekends
are skipped. An existing attendance row is updated, not duplicated.

## Related

- [Leave](Leave.md)
- [Data model](Data-Model.md)
- [Routes and pages](Routes-and-Pages.md)
