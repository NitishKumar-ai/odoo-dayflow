import Link from "next/link";
import { and, eq, gte, lte } from "drizzle-orm";
import { db, attendance, employees, users } from "@/db";
import { requireAdmin } from "@/lib/auth";
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
import { Avatar } from "@/components/Avatar";
import { AttendanceOverride } from "@/components/admin/AttendanceOverride";
import {
  IconAttendance,
  IconArrowLeft,
  IconArrowRight,
  IconClock,
} from "@/components/Icons";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminAttendancePage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const view = params.view === "week" ? "week" : "day";
  const anchor = typeof params.date === "string" ? params.date : today();
  const week = weekRange(anchor);

  const staff = await db
    .select({
      id: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      photoUrl: employees.photoUrl,
      department: employees.department,
      jobTitle: employees.jobTitle,
      employeeCode: users.employeeCode,
    })
    .from(employees)
    .innerJoin(users, eq(users.id, employees.userId))
    .where(eq(users.isActive, true))
    .orderBy(employees.firstName);

  const rangeStart = view === "day" ? anchor : week.start;
  const rangeEnd = view === "day" ? anchor : week.end;

  const rows = await db
    .select()
    .from(attendance)
    .where(
      and(gte(attendance.workDate, rangeStart), lte(attendance.workDate, rangeEnd)),
    );

  const byKey = new Map(rows.map((r) => [`${r.employeeId}|${r.workDate}`, r]));

  const dayTotals = {
    present: rows.filter((r) => r.workDate === anchor && r.status === "present").length,
    absent: rows.filter((r) => r.workDate === anchor && r.status === "absent").length,
    half_day: rows.filter((r) => r.workDate === anchor && r.status === "half_day").length,
    leave: rows.filter((r) => r.workDate === anchor && r.status === "leave").length,
  };

  return (
    <div className="space-y-8">
      {/* Title & View Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Company Attendance Master
          </h1>
          <p className="mt-1 text-sm text-muted">
            {view === "day"
              ? `${formatDate(anchor)} · ${dayTotals.present} Present, ${dayTotals.half_day} Half-day, ${dayTotals.leave} On Leave, ${dayTotals.absent} Absent`
              : `Week of ${formatDate(week.start)} – ${formatDate(week.end)}`}
          </p>
        </div>

        {/* View mode & Date Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Day / Week toggle */}
          <div className="rounded-xl border border-line bg-surface p-1 flex items-center shadow-xs">
            <Link
              href={`/admin/attendance?view=day&date=${anchor}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                view === "day"
                  ? "bg-brand text-white shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Daily Matrix
            </Link>
            <Link
              href={`/admin/attendance?view=week&date=${anchor}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                view === "week"
                  ? "bg-brand text-white shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Weekly Heatmap
            </Link>
          </div>

          {/* Previous / Today / Next */}
          <div className="flex items-center gap-1">
            <Link
              href={`/admin/attendance?view=${view}&date=${addDays(anchor, view === "day" ? -1 : -7)}`}
              className="btn-secondary btn-sm"
              title="Previous"
            >
              <IconArrowLeft size={14} />
            </Link>
            <Link
              href={`/admin/attendance?view=${view}`}
              className="btn-secondary btn-sm font-bold"
            >
              Today
            </Link>
            <Link
              href={`/admin/attendance?view=${view}&date=${addDays(anchor, view === "day" ? 1 : 7)}`}
              className="btn-secondary btn-sm"
              title="Next"
            >
              <IconArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Table Matrix */}
      <section className="card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {view === "day" ? (
            <table className="w-full min-w-[840px]">
              <thead className="bg-surface-muted/60">
                <tr>
                  <th className="th">Team Member</th>
                  <th className="th">Clock In / Out</th>
                  <th className="th">Hours Logged</th>
                  <th className="th">Current Status</th>
                  <th className="th">Admin Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {staff.map((s) => {
                  const row = byKey.get(`${s.id}|${anchor}`);
                  const name = `${s.firstName} ${s.lastName}`.trim();

                  return (
                    <tr key={s.id} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <Avatar name={name} photoUrl={s.photoUrl} size={36} />
                          <div>
                            <Link
                              href={`/admin/employees/${s.id}`}
                              className="font-bold text-foreground hover:text-brand hover:underline"
                            >
                              {name}
                            </Link>
                            <p className="text-xs text-muted">
                              {s.employeeCode} · {s.department || "General"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="td tabular-nums text-xs font-semibold text-muted">
                        {row?.checkInAt ? (
                          <span>
                            {formatTime(row.checkInAt)} → {formatTime(row.checkOutAt)}
                          </span>
                        ) : (
                          <span className="text-muted/50">—</span>
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
                          <span className="text-xs text-muted font-medium">No record</span>
                        )}
                      </td>

                      <td className="td">
                        <AttendanceOverride
                          employeeId={s.id}
                          workDate={anchor}
                          status={row?.status ?? "present"}
                          note={row?.note ?? ""}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[840px]">
              <thead className="bg-surface-muted/60">
                <tr>
                  <th className="th">Team Member</th>
                  {week.days.map((d) => (
                    <th key={d} className="th text-center">
                      <div>{formatDay(d)}</div>
                      <div className="text-[10px] font-normal normal-case text-muted">
                        {d.slice(8)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {staff.map((s) => {
                  const name = `${s.firstName} ${s.lastName}`.trim();

                  return (
                    <tr key={s.id} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="td">
                        <Link
                          href={`/admin/employees/${s.id}`}
                          className="font-bold text-foreground hover:text-brand hover:underline"
                        >
                          {name}
                        </Link>
                        <p className="text-[11px] text-muted font-mono">{s.employeeCode}</p>
                      </td>

                      {week.days.map((d) => {
                        const row = byKey.get(`${s.id}|${d}`);
                        const weekend = isWeekend(d);

                        return (
                          <td key={d} className="td text-center">
                            {row ? (
                              <span
                                title={`${formatDate(d)}: ${STATUS_LABEL[row.status]}`}
                                className={`pill ${STATUS_TONE[row.status]} text-[10px] px-2`}
                              >
                                {STATUS_LABEL[row.status].slice(0, 1)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted/50 font-mono">
                                {weekend ? "·" : "—"}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <p className="text-xs text-muted">
        <strong>Legend:</strong> P = Present · A = Absent · H = Half-day · L = On Leave. Weekends are marked with a dot.
      </p>
    </div>
  );
}
