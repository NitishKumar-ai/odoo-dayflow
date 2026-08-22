import Link from "next/link";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import {
  db,
  attendance,
  leaveRequests,
  activityLog,
  employees,
  users,
} from "@/db";
import { requireUser } from "@/lib/auth";
import { today, weekRange, formatTime, formatDate, formatDay } from "@/lib/dates";
import {
  STATUS_LABEL,
  STATUS_TONE,
  BUSINESS_DAYS_PER_WEEK,
  countPresentBusinessDays,
} from "@/lib/attendance";
import { leaveSummary } from "@/lib/leave-queries";
import { getCurrentSalary } from "@/lib/employee-queries";
import { formatMoney, net } from "@/lib/money";
import { LEAVE_STATUS_LABEL, LEAVE_STATUS_TONE, LEAVE_TYPE_LABEL } from "@/lib/leave";
import { CheckInOut } from "@/components/CheckInOut";
import { StatCard } from "@/components/StatCard";
import {
  IconAttendance,
  IconLeave,
  IconPayroll,
  IconProfile,
  IconEmployees,
  IconApprovals,
  IconArrowRight,
  IconSparkles,
  IconClock,
  IconCheckCircle,
} from "@/components/Icons";

export default async function DashboardPage() {
  const user = await requireUser();
  const key = today();
  const week = weekRange(key);
  const year = Number(key.slice(0, 4));

  const [todayRow] = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.employeeId, user.employeeId), eq(attendance.workDate, key)))
    .limit(1);

  const weekRows = await db
    .select({
      status: attendance.status,
      workDate: attendance.workDate,
      checkInAt: attendance.checkInAt,
      checkOutAt: attendance.checkOutAt,
    })
    .from(attendance)
    .where(
      and(
        eq(attendance.employeeId, user.employeeId),
        gte(attendance.workDate, week.start),
        sql`${attendance.workDate} <= ${week.end}`,
      ),
    );

  const presentThisWeek = countPresentBusinessDays(weekRows);

  const myLeave = await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.employeeId, user.employeeId))
    .orderBy(desc(leaveRequests.createdAt))
    .limit(5);

  const balances = await leaveSummary(user.employeeId, year);
  const salary = await getCurrentSalary(user.employeeId);

  const activity = await db
    .select()
    .from(activityLog)
    .where(eq(activityLog.employeeId, user.employeeId))
    .orderBy(desc(activityLog.createdAt))
    .limit(5);

  let awaitingApproval = 0;
  let headcount = 0;
  let todayPresentCount = 0;

  if (user.role === "admin") {
    const [p] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(leaveRequests)
      .where(eq(leaveRequests.status, "pending"));
    awaitingApproval = p?.n ?? 0;

    const [h] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(employees)
      .innerJoin(users, eq(users.id, employees.userId))
      .where(eq(users.isActive, true));
    headcount = h?.n ?? 0;

    const [tp] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(attendance)
      .where(and(eq(attendance.workDate, key), eq(attendance.status, "present")));
    todayPresentCount = tp?.n ?? 0;
  }

  const paidLeave = balances.find((b) => b.leaveType === "paid");
  const sickLeave = balances.find((b) => b.leaveType === "sick");

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Good day, {user.name.split(" ")[0]} 👋
            </h1>
            {user.role === "admin" && (
              <span className="pill bg-brand-soft text-brand ring-brand/20 font-bold">
                Admin Mode
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            {formatDate(key)} · Have a productive day at work.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/leave" className="btn-secondary text-xs">
            <IconLeave size={14} />
            <span>Apply Leave</span>
          </Link>
          <Link href="/profile" className="btn-secondary text-xs">
            <IconProfile size={14} />
            <span>My Profile</span>
          </Link>
        </div>
      </div>

      {/* Primary Punch Clock Card */}
      <section className="card p-6 shadow-sm">
        <CheckInOut
          checkedInAt={todayRow?.checkInAt ? formatTime(todayRow.checkInAt) : null}
          checkedOutAt={todayRow?.checkOutAt ? formatTime(todayRow.checkOutAt) : null}
          onLeave={todayRow?.status === "leave"}
        />
      </section>

      {/* Admin Quick Action Hub */}
      {user.role === "admin" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <IconSparkles size={14} className="text-brand" />
              <span>HR & Administration Overview</span>
            </h2>
            <span className="text-xs text-muted">Company-wide statistics</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              title="Pending Approvals"
              value={awaitingApproval}
              subtitle="Requests needing your review"
              tone={awaitingApproval > 0 ? "warning" : "neutral"}
              icon={<IconApprovals size={20} />}
              href="/admin/leave"
            />
            <StatCard
              title="Active Headcount"
              value={headcount}
              subtitle="Registered team members"
              tone="brand"
              icon={<IconEmployees size={20} />}
              href="/admin/employees"
            />
            <StatCard
              title="Today's Present Staff"
              value={`${todayPresentCount} / ${headcount}`}
              subtitle={`${headcount > 0 ? Math.round((todayPresentCount / headcount) * 100) : 0}% checked in`}
              tone="success"
              icon={<IconAttendance size={20} />}
              href="/admin/attendance"
            />
          </div>
        </section>
      )}

      {/* Employee Quick Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Days Present"
          value={`${presentThisWeek} / ${BUSINESS_DAYS_PER_WEEK}`}
          subtitle="This work week"
          tone="success"
          icon={<IconAttendance size={20} />}
          href="/attendance"
        />
        <StatCard
          title="Paid Leave Left"
          value={`${paidLeave?.left ?? 0} d`}
          subtitle={`of ${paidLeave?.entitled ?? 0} annual days`}
          tone="brand"
          icon={<IconLeave size={20} />}
          href="/leave"
        />
        <StatCard
          title="Sick Leave Left"
          value={`${sickLeave?.left ?? 0} d`}
          subtitle={`of ${sickLeave?.entitled ?? 0} annual days`}
          tone="warning"
          icon={<IconClock size={20} />}
          href="/leave"
        />
        <StatCard
          title="Net Pay / Month"
          value={salary ? formatMoney(net(salary), salary.currency) : "—"}
          subtitle="Current salary structure"
          tone="neutral"
          icon={<IconPayroll size={20} />}
          href="/payroll"
        />
      </section>

      {/* Middle Grid: Weekly Heatmap & Leave Balances */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Attendance Heatmap */}
        <section className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Weekly Attendance</h2>
              <p className="text-xs text-muted">
                Week of {formatDate(week.start)} – {formatDate(week.end)}
              </p>
            </div>
            <Link
              href="/attendance"
              className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1"
            >
              <span>Full Record</span>
              <IconArrowRight size={12} />
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-2">
            {week.days.map((d) => {
              const row = weekRows.find((r) => r.workDate === d);
              const isCurrentDay = d === key;
              const tone = row
                ? STATUS_TONE[row.status]
                : "bg-surface-muted/80 text-muted/60 ring-line";

              return (
                <div
                  key={d}
                  className={`flex flex-col items-center justify-between rounded-xl p-2.5 text-center ring-1 ring-inset transition-all ${
                    isCurrentDay ? "ring-2 ring-brand" : "ring-line"
                  } ${tone}`}
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {formatDay(d).slice(0, 3)}
                  </span>
                  <span className="my-1 text-sm font-extrabold tabular-nums">
                    {d.slice(8)}
                  </span>
                  <span className="text-[10px] font-semibold truncate w-full">
                    {row ? STATUS_LABEL[row.status] : "—"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-muted">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Present</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Half-day</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                <span>Leave</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>Absent</span>
              </div>
            </div>

            <span className="font-medium text-foreground">
              {presentThisWeek} of {BUSINESS_DAYS_PER_WEEK} business days logged
            </span>
          </div>
        </section>

        {/* Leave Balances Meter */}
        <section className="card p-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <h2 className="text-base font-bold text-foreground">Leave Quota {year}</h2>
            <Link
              href="/leave"
              className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1"
            >
              <span>Apply</span>
              <IconArrowRight size={12} />
            </Link>
          </div>

          <div className="mt-4 space-y-4">
            {balances.length === 0 ? (
              <p className="text-sm text-muted">No entitlement configured for this year.</p>
            ) : (
              balances.map((b) => {
                const percent = b.entitled > 0 ? Math.min(100, Math.round((b.used / b.entitled) * 100)) : 0;
                return (
                  <div key={b.leaveType} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">
                        {LEAVE_TYPE_LABEL[b.leaveType]}
                      </span>
                      <span className="tabular-nums font-bold text-muted">
                        <strong className="text-foreground">{b.left}</strong> / {b.entitled} left
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className={`h-full rounded-full transition-all ${
                          b.leaveType === "paid"
                            ? "bg-brand"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${100 - percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}

            <div className="rounded-xl border border-line bg-surface-muted/40 p-3 text-xs text-muted">
              <span className="font-semibold text-foreground">Unpaid Leave:</span> Available upon HR approval without quota deduction.
            </div>
          </div>
        </section>
      </div>

      {/* Lower Section: My Recent Leave Requests & Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Leave Requests Table */}
        <section className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-foreground">My Leave Requests</h2>
              <p className="text-xs text-muted">Recent applications & status</p>
            </div>
            <Link
              href="/leave"
              className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <IconArrowRight size={12} />
            </Link>
          </div>

          {myLeave.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">
              You have not submitted any leave requests yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-muted/60">
                  <tr>
                    <th className="th">Type</th>
                    <th className="th">Duration</th>
                    <th className="th">Days</th>
                    <th className="th text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {myLeave.map((l) => (
                    <tr key={l.id} className="hover:bg-surface-muted/40 transition-colors">
                      <td className="td font-bold">{LEAVE_TYPE_LABEL[l.leaveType]}</td>
                      <td className="td text-muted text-xs">
                        {formatDate(l.startDate)} – {formatDate(l.endDate)}
                      </td>
                      <td className="td tabular-nums font-semibold">{l.days}d</td>
                      <td className="td text-right">
                        <span className={`pill ${LEAVE_STATUS_TONE[l.status]}`}>
                          {LEAVE_STATUS_LABEL[l.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent Activity Timeline */}
        <section className="card p-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <h2 className="text-base font-bold text-foreground">Activity Timeline</h2>
            <span className="text-xs text-muted">Recent updates</span>
          </div>

          {activity.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No recent activity on file.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start gap-3 text-xs">
                  <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand font-bold">
                    <IconCheckCircle size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground leading-tight">{a.message}</p>
                    <p className="mt-1 text-[11px] text-muted font-mono">
                      {a.createdAt.toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
