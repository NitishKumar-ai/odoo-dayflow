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
import { today, weekRange, formatTime, formatDate } from "@/lib/dates";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/attendance";
import { leaveSummary } from "@/lib/leave-queries";
import { LEAVE_STATUS_LABEL, LEAVE_STATUS_TONE, LEAVE_TYPE_LABEL } from "@/lib/leave";
import { CheckInOut } from "@/components/CheckInOut";

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
    .select({ status: attendance.status, workDate: attendance.workDate })
    .from(attendance)
    .where(
      and(
        eq(attendance.employeeId, user.employeeId),
        gte(attendance.workDate, week.start),
        sql`${attendance.workDate} <= ${week.end}`,
      ),
    );

  const presentThisWeek = weekRows.filter((r) => r.status === "present").length;

  const myLeave = await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.employeeId, user.employeeId))
    .orderBy(desc(leaveRequests.createdAt))
    .limit(4);

  const pendingCount = myLeave.filter((l) => l.status === "pending").length;
  const balances = await leaveSummary(user.employeeId, year);

  const activity = await db
    .select()
    .from(activityLog)
    .where(eq(activityLog.employeeId, user.employeeId))
    .orderBy(desc(activityLog.createdAt))
    .limit(6);

  let awaitingApproval = 0;
  let headcount = 0;
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
  }

  const cards = [
    { href: "/profile", label: "Profile", hint: "Personal & job details" },
    { href: "/attendance", label: "Attendance", hint: "Daily and weekly view" },
    { href: "/leave", label: "Leave requests", hint: `${pendingCount} pending` },
    { href: "/payroll", label: "Salary", hint: "Your current structure" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Good to see you, {user.name.split(" ")[0]}</h1>
        <p className="text-sm text-muted">{formatDate(key)}</p>
      </div>

      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Today
        </h2>
        <CheckInOut
          checkedInAt={todayRow?.checkInAt ? formatTime(todayRow.checkInAt) : null}
          checkedOutAt={todayRow?.checkOutAt ? formatTime(todayRow.checkOutAt) : null}
          onLeave={todayRow?.status === "leave"}
        />
      </section>

      {user.role === "admin" ? (
        <section className="grid gap-4 sm:grid-cols-2">
          <Link href="/admin/leave" className="card p-5 transition-colors hover:bg-surface-muted">
            <p className="text-sm text-muted">Leave requests awaiting you</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{awaitingApproval}</p>
          </Link>
          <Link href="/admin/employees" className="card p-5 transition-colors hover:bg-surface-muted">
            <p className="text-sm text-muted">Active employees</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{headcount}</p>
          </Link>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="card p-5 transition-colors hover:bg-surface-muted"
          >
            <p className="font-medium">{c.label}</p>
            <p className="mt-1 text-sm text-muted">{c.hint}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            This week
          </h2>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {presentThisWeek}
            <span className="text-base font-normal text-muted"> days present</span>
          </p>
          <div className="mt-4 grid grid-cols-7 gap-1">
            {week.days.map((d) => {
              const row = weekRows.find((r) => r.workDate === d);
              const tone = row ? STATUS_TONE[row.status] : "bg-surface-muted text-muted ring-line";
              return (
                <div
                  key={d}
                  title={`${formatDate(d)}: ${row ? STATUS_LABEL[row.status] : "No record"}`}
                  className={`h-8 rounded ring-1 ring-inset ${tone}`}
                />
              );
            })}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Leave balance {year}
          </h2>
          <ul className="mt-3 space-y-2">
            {balances.length === 0 ? (
              <li className="text-sm text-muted">No entitlement configured.</li>
            ) : (
              balances.map((b) => (
                <li key={b.leaveType} className="flex items-center justify-between text-sm">
                  <span>{LEAVE_TYPE_LABEL[b.leaveType]}</span>
                  <span className="tabular-nums font-medium">
                    {b.left} <span className="text-muted">/ {b.entitled} left</span>
                  </span>
                </li>
              ))
            )}
          </ul>
          <Link href="/leave" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
            Apply for leave →
          </Link>
        </section>

        <section className="card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Recent activity
          </h2>
          {activity.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nothing yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="text-sm">
                  <p>{a.message}</p>
                  <p className="text-xs text-muted">
                    {a.createdAt.toLocaleString(undefined, {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {myLeave.length ? (
        <section className="card overflow-hidden">
          <h2 className="border-b border-line px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted">
            My latest leave requests
          </h2>
          <table className="w-full">
            <tbody className="divide-y divide-line">
              {myLeave.map((l) => (
                <tr key={l.id}>
                  <td className="td">{LEAVE_TYPE_LABEL[l.leaveType]}</td>
                  <td className="td text-muted">
                    {formatDate(l.startDate)} – {formatDate(l.endDate)}
                  </td>
                  <td className="td tabular-nums text-muted">{l.days}d</td>
                  <td className="td text-right">
                    <span className={`pill ${LEAVE_STATUS_TONE[l.status]}`}>
                      {LEAVE_STATUS_LABEL[l.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
