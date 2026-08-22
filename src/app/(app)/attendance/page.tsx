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
import {
  IconAttendance,
  IconArrowLeft,
  IconArrowRight,
  IconClock,
  IconCheckCircle,
} from "@/components/Icons";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AttendancePage({ searchParams }: Props) {
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
    <div className="space-y-8">
      {/* Title & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My Attendance Record
          </h1>
          <p className="mt-1 text-sm text-muted">
            Daily clock-in logs, weekly worked hours, and 14-day history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="pill bg-emerald-50 text-emerald-700 ring-emerald-600/20 font-bold">
            {counts.present} Present This Week
          </span>
        </div>
      </div>

      {/* Primary CheckInOut Punch Clock */}
      <section className="card p-6 shadow-sm">
        <CheckInOut
          checkedInAt={todayRow?.checkInAt ? formatTime(todayRow.checkInAt) : null}
          checkedOutAt={todayRow?.checkOutAt ? formatTime(todayRow.checkOutAt) : null}
          onLeave={todayRow?.status === "leave"}
        />
      </section>

      {/* Weekly View Table */}
      <section className="card overflow-hidden shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Week of {formatDate(week.start)} – {formatDate(week.end)}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {counts.present} present · {counts.half_day} half-day · {counts.leave} leave ·{" "}
              {counts.absent} absent
            </p>
          </div>

          {/* Week Switcher Navigation */}
          <div className="flex items-center gap-2">
            <Link
              href={`/attendance?week=${addDays(week.start, -7)}`}
              className="btn-secondary btn-sm"
            >
              <IconArrowLeft size={14} />
              <span>Previous</span>
            </Link>
            <Link href="/attendance" className="btn-secondary btn-sm font-bold">
              This Week
            </Link>
            <Link
              href={`/attendance?week=${addDays(week.start, 7)}`}
              className="btn-secondary btn-sm"
            >
              <span>Next</span>
              <IconArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-muted/60">
              <tr>
                <th className="th">Day & Date</th>
                <th className="th">Clock In</th>
                <th className="th">Clock Out</th>
                <th className="th">Hours Logged</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {week.days.map((d) => {
                const row = byDate.get(d);
                const weekend = isWeekend(d);
                const isCurrent = d === key;

                return (
                  <tr
                    key={d}
                    className={`transition-colors ${
                      isCurrent
                        ? "bg-brand-soft/30 font-medium"
                        : weekend
                          ? "bg-surface-muted/30 opacity-70"
                          : "hover:bg-surface-muted/40"
                    }`}
                  >
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{formatDay(d)}</span>
                        <span className="text-xs text-muted">{formatDate(d)}</span>
                        {isCurrent && (
                          <span className="pill bg-brand text-white text-[9px] px-1.5 py-0">
                            Today
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="td tabular-nums font-semibold">
                      {row?.checkInAt ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {formatTime(row.checkInAt)}
                        </span>
                      ) : (
                        <span className="text-muted/60">—</span>
                      )}
                    </td>

                    <td className="td tabular-nums font-semibold">
                      {row?.checkOutAt ? (
                        <span className="text-blue-600 dark:text-blue-400">
                          {formatTime(row.checkOutAt)}
                        </span>
                      ) : (
                        <span className="text-muted/60">—</span>
                      )}
                    </td>

                    <td className="td tabular-nums text-xs font-mono text-muted">
                      {workedHours(row?.checkInAt ?? null, row?.checkOutAt ?? null)}
                    </td>

                    <td className="td">
                      {row ? (
                        <span className={`pill ${STATUS_TONE[row.status]}`}>
                          {STATUS_LABEL[row.status]}
                        </span>
                      ) : (
                        <span className="text-xs text-muted font-medium">
                          {weekend ? "Weekend Off" : "No punch recorded"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 14-Day History Table */}
      <section className="card overflow-hidden shadow-xs">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-base font-bold text-foreground">Recent Punch Logs (Last 14 Days)</h2>
          <p className="text-xs text-muted">Chronological attendance trail</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody className="divide-y divide-line">
              {recent.map((r) => (
                <tr key={r.id} className="hover:bg-surface-muted/30 transition-colors">
                  <td className="td font-bold text-foreground">{formatDate(r.workDate)}</td>
                  <td className="td tabular-nums text-xs text-muted font-semibold">
                    {formatTime(r.checkInAt)} → {formatTime(r.checkOutAt)}
                  </td>
                  <td className="td tabular-nums text-xs text-muted font-mono">
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
                  <td className="td text-center text-muted p-8" colSpan={4}>
                    No attendance recorded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
