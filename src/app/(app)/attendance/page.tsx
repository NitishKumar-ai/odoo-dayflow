import Link from "next/link";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db, attendance } from "@/db";
import { requireUser } from "@/lib/auth";
import {
  today,
  weekRange,
  addDays,
  formatDate,
  formatDay,
  formatTime,
  isWeekend,
} from "@/lib/dates";
import { STATUS_LABEL, STATUS_TONE, workedHours } from "@/lib/attendance";
import { CheckInOut } from "@/components/CheckInOut";

export default async function AttendancePage({ searchParams }: PageProps<"/attendance">) {
  const user = await requireUser();
  const params = await searchParams;
  const anchor = typeof params.week === "string" ? params.week : today();
  const week = weekRange(anchor);
  const key = today();

  const rows = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.employeeId, user.employeeId),
        gte(attendance.workDate, week.start),
        lte(attendance.workDate, week.end),
      ),
    );

  const byDate = new Map(rows.map((r) => [r.workDate, r]));
  const todayRow = byDate.get(key) ?? null;

  const recent = await db
    .select()
    .from(attendance)
    .where(eq(attendance.employeeId, user.employeeId))
    .orderBy(desc(attendance.workDate))
    .limit(14);

  const counts = {
    present: rows.filter((r) => r.status === "present").length,
    half_day: rows.filter((r) => r.status === "half_day").length,
    leave: rows.filter((r) => r.status === "leave").length,
    absent: rows.filter((r) => r.status === "absent").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">My attendance</h1>
          <p className="text-sm text-muted">Daily and weekly view of your own record.</p>
        </div>
      </div>

      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          {formatDate(key)}
        </h2>
        <CheckInOut
          checkedInAt={todayRow?.checkInAt ? formatTime(todayRow.checkInAt) : null}
          checkedOutAt={todayRow?.checkOutAt ? formatTime(todayRow.checkOutAt) : null}
          onLeave={todayRow?.status === "leave"}
        />
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
          <div>
            <h2 className="font-medium">
              Week of {formatDate(week.start)} – {formatDate(week.end)}
            </h2>
            <p className="text-xs text-muted">
              {counts.present} present · {counts.half_day} half-day · {counts.leave} leave ·{" "}
              {counts.absent} absent
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/attendance?week=${addDays(week.start, -7)}`} className="btn-secondary">
              ← Previous
            </Link>
            <Link href="/attendance" className="btn-secondary">This week</Link>
            <Link href={`/attendance?week=${addDays(week.start, 7)}`} className="btn-secondary">
              Next →
            </Link>
          </div>
        </div>

        <table className="w-full">
          <thead className="bg-surface-muted">
            <tr>
              <th className="th">Day</th>
              <th className="th">Check-in</th>
              <th className="th">Check-out</th>
              <th className="th">Hours</th>
              <th className="th">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {week.days.map((d) => {
              const row = byDate.get(d);
              const weekend = isWeekend(d);
              return (
                <tr key={d} className={weekend ? "bg-surface-muted/50" : undefined}>
                  <td className="td">
                    <span className="font-medium">{formatDay(d)}</span>{" "}
                    <span className="text-muted">{formatDate(d)}</span>
                  </td>
                  <td className="td tabular-nums">{formatTime(row?.checkInAt ?? null)}</td>
                  <td className="td tabular-nums">{formatTime(row?.checkOutAt ?? null)}</td>
                  <td className="td tabular-nums text-muted">
                    {workedHours(row?.checkInAt ?? null, row?.checkOutAt ?? null)}
                  </td>
                  <td className="td">
                    {row ? (
                      <span className={`pill ${STATUS_TONE[row.status]}`}>
                        {STATUS_LABEL[row.status]}
                      </span>
                    ) : (
                      <span className="text-xs text-muted">
                        {weekend ? "Weekend" : "No record"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card overflow-hidden">
        <h2 className="border-b border-line px-5 py-3 font-medium">Last 14 recorded days</h2>
        <table className="w-full">
          <tbody className="divide-y divide-line">
            {recent.map((r) => (
              <tr key={r.id}>
                <td className="td">{formatDate(r.workDate)}</td>
                <td className="td tabular-nums text-muted">
                  {formatTime(r.checkInAt)} – {formatTime(r.checkOutAt)}
                </td>
                <td className="td tabular-nums text-muted">
                  {workedHours(r.checkInAt, r.checkOutAt)}
                </td>
                <td className="td text-right">
                  <span className={`pill ${STATUS_TONE[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
              </tr>
            ))}
            {recent.length === 0 ? (
              <tr>
                <td className="td text-muted" colSpan={4}>
                  No attendance recorded yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
