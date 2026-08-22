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

export default async function AdminAttendancePage({
  searchParams,
}: PageProps<"/admin/attendance">) {
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Attendance</h1>
          <p className="text-sm text-muted">
            {view === "day"
              ? `${formatDate(anchor)} · ${dayTotals.present} present, ${dayTotals.half_day} half-day, ${dayTotals.leave} on leave, ${dayTotals.absent} absent`
              : `Week of ${formatDate(week.start)} – ${formatDate(week.end)}`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/attendance?view=day&date=${anchor}`}
            className={view === "day" ? "btn-primary" : "btn-secondary"}
          >
            Daily
          </Link>
          <Link
            href={`/admin/attendance?view=week&date=${anchor}`}
            className={view === "week" ? "btn-primary" : "btn-secondary"}
          >
            Weekly
          </Link>
          <Link
            href={`/admin/attendance?view=${view}&date=${addDays(anchor, view === "day" ? -1 : -7)}`}
            className="btn-secondary"
          >
            ←
          </Link>
          <Link href={`/admin/attendance?view=${view}`} className="btn-secondary">
            Today
          </Link>
          <Link
            href={`/admin/attendance?view=${view}&date=${addDays(anchor, view === "day" ? 1 : 7)}`}
            className="btn-secondary"
          >
            →
          </Link>
        </div>
      </div>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          {view === "day" ? (
            <table className="w-full min-w-[820px]">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="th">Employee</th>
                  <th className="th">In / out</th>
                  <th className="th">Hours</th>
                  <th className="th">Status</th>
                  <th className="th">Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {staff.map((s) => {
                  const row = byKey.get(`${s.id}|${anchor}`);
                  const name = `${s.firstName} ${s.lastName}`.trim();
                  return (
                    <tr key={s.id}>
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <Avatar name={name} photoUrl={s.photoUrl} size={32} />
                          <div>
                            <Link
                              href={`/admin/employees/${s.id}`}
                              className="font-medium hover:underline"
                            >
                              {name}
                            </Link>
                            <p className="text-xs text-muted">{s.department || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="td tabular-nums text-muted">
                        {formatTime(row?.checkInAt ?? null)} – {formatTime(row?.checkOutAt ?? null)}
                      </td>
                      <td className="td tabular-nums text-muted">
                        {workedHours(row?.checkInAt ?? null, row?.checkOutAt ?? null)}
                      </td>
                      <td className="td">
                        {row ? (
                          <span className={`pill ${STATUS_TONE[row.status]}`}>
                            {STATUS_LABEL[row.status]}
                          </span>
                        ) : (
                          <span className="text-xs text-muted">No record</span>
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
            <table className="w-full min-w-[820px]">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="th">Employee</th>
                  {week.days.map((d) => (
                    <th key={d} className="th text-center">
                      <div>{formatDay(d)}</div>
                      <div className="font-normal normal-case text-muted">
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
                    <tr key={s.id}>
                      <td className="td">
                        <Link
                          href={`/admin/employees/${s.id}`}
                          className="font-medium hover:underline"
                        >
                          {name}
                        </Link>
                        <p className="text-xs text-muted">{s.employeeCode}</p>
                      </td>
                      {week.days.map((d) => {
                        const row = byKey.get(`${s.id}|${d}`);
                        return (
                          <td key={d} className="td text-center">
                            {row ? (
                              <span
                                title={`${formatDate(d)}: ${STATUS_LABEL[row.status]}`}
                                className={`pill ${STATUS_TONE[row.status]}`}
                              >
                                {STATUS_LABEL[row.status].slice(0, 1)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted">
                                {isWeekend(d) ? "·" : "—"}
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
        Legend: P present · A absent · H half-day · L leave. Weekends show a dot.
      </p>
    </div>
  );
}
