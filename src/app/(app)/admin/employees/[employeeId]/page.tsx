import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db, attendance, leaveRequests } from "@/db";
import { requireAdmin } from "@/lib/auth";
import {
  getEmployeeDetail,
  getCurrentSalary,
  getSalaryHistory,
  getDocuments,
} from "@/lib/employee-queries";
import { leaveSummary } from "@/lib/leave-queries";
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
import {
  LEAVE_STATUS_LABEL,
  LEAVE_STATUS_TONE,
  LEAVE_TYPE_LABEL,
} from "@/lib/leave";
import { formatMoney, gross, net } from "@/lib/money";
import { Avatar } from "@/components/Avatar";
import { EmployeeEditForm } from "@/components/admin/EmployeeEditForm";
import { SalaryForm } from "@/components/admin/SalaryForm";
import { AttendanceOverride } from "@/components/admin/AttendanceOverride";

export default async function AdminEmployeeDetailPage({
  params,
  searchParams,
}: PageProps<"/admin/employees/[employeeId]">) {
  await requireAdmin();
  const { employeeId } = await params;
  const search = await searchParams;

  const detail = await getEmployeeDetail(employeeId);
  if (!detail) notFound();

  const anchor = typeof search.week === "string" ? search.week : today();
  const week = weekRange(anchor);
  const year = Number(today().slice(0, 4));

  const attendanceRows = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.employeeId, employeeId),
        gte(attendance.workDate, week.start),
        lte(attendance.workDate, week.end),
      ),
    );
  const byDate = new Map(attendanceRows.map((r) => [r.workDate, r]));

  const requests = await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.employeeId, employeeId))
    .orderBy(desc(leaveRequests.createdAt))
    .limit(10);

  const balances = await leaveSummary(employeeId, year);
  const salary = await getCurrentSalary(employeeId);
  const history = await getSalaryHistory(employeeId);
  const docs = await getDocuments(employeeId);
  const name = `${detail.firstName} ${detail.lastName}`.trim();

  return (
    <div className="space-y-6">
      <Link href="/admin/employees" className="text-sm text-muted hover:underline">
        ← All employees
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={name} photoUrl={detail.photoUrl} size={64} />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{name}</h1>
          <p className="text-sm text-muted">
            {detail.employeeCode} · {detail.email} ·{" "}
            {detail.jobTitle || "No job title"}
          </p>
        </div>
        <div className="flex gap-2">
          {!detail.isActive ? (
            <span className="pill bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20">
              Deactivated
            </span>
          ) : null}
          {!detail.emailVerifiedAt ? (
            <span className="pill bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20">
              Email unverified
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Employee details
          </h2>
          <div className="mt-4">
            <EmployeeEditForm
              values={{
                employeeId: detail.id,
                firstName: detail.firstName,
                lastName: detail.lastName,
                phone: detail.phone,
                address: detail.address,
                jobTitle: detail.jobTitle,
                department: detail.department,
                employmentType: detail.employmentType,
                dateOfJoining: detail.dateOfJoining ?? "",
                dateOfBirth: detail.dateOfBirth ?? "",
                role: detail.role,
                isActive: detail.isActive,
              }}
            />
          </div>
        </section>

        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Leave balance {year}
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {balances.map((b) => (
                <li key={b.leaveType} className="flex justify-between">
                  <span>{LEAVE_TYPE_LABEL[b.leaveType]}</span>
                  <span className="tabular-nums font-medium">
                    {b.left} <span className="text-muted">/ {b.entitled}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Current pay
            </h2>
            {salary ? (
              <>
                <p className="mt-2 text-2xl font-semibold tabular-nums">
                  {formatMoney(net(salary), salary.currency)}
                  <span className="text-sm font-normal text-muted"> net</span>
                </p>
                <p className="text-xs text-muted">
                  Gross {formatMoney(gross(salary), salary.currency)} · effective{" "}
                  {formatDate(salary.effectiveFrom)}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">Not set.</p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Documents
            </h2>
            {docs.length === 0 ? (
              <p className="mt-3 text-sm text-muted">None on file.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {docs.map((d) => (
                  <li key={d.id} className="flex justify-between">
                    <span>{d.name}</span>
                    <span className="text-xs text-muted">{d.category}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
          <h2 className="font-medium">
            Attendance · {formatDate(week.start)} – {formatDate(week.end)}
          </h2>
          <div className="flex gap-2">
            <Link
              href={`/admin/employees/${employeeId}?week=${addDays(week.start, -7)}`}
              className="btn-secondary"
            >
              ← Previous
            </Link>
            <Link href={`/admin/employees/${employeeId}`} className="btn-secondary">
              This week
            </Link>
            <Link
              href={`/admin/employees/${employeeId}?week=${addDays(week.start, 7)}`}
              className="btn-secondary"
            >
              Next →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-surface-muted">
              <tr>
                <th className="th">Day</th>
                <th className="th">In / out</th>
                <th className="th">Hours</th>
                <th className="th">Status</th>
                <th className="th">Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {week.days.map((d) => {
                const row = byDate.get(d);
                return (
                  <tr key={d} className={isWeekend(d) ? "bg-surface-muted/50" : undefined}>
                    <td className="td">
                      <span className="font-medium">{formatDay(d)}</span>{" "}
                      <span className="text-muted">{formatDate(d)}</span>
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
                        employeeId={employeeId}
                        workDate={d}
                        status={row?.status ?? "present"}
                        note={row?.note ?? ""}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Salary structure
          </h2>
          <div className="mt-4">
            <SalaryForm
              employeeId={employeeId}
              defaults={{
                effectiveFrom: salary?.effectiveFrom ?? today(),
                currency: salary?.currency ?? "INR",
                basic: salary?.basic ?? "0",
                hra: salary?.hra ?? "0",
                allowances: salary?.allowances ?? "0",
                deductions: salary?.deductions ?? "0",
              }}
            />
          </div>

          {history.length > 0 ? (
            <table className="mt-6 w-full">
              <thead>
                <tr>
                  <th className="th px-0">Effective</th>
                  <th className="th px-0">Gross</th>
                  <th className="th px-0 text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="td px-0">{formatDate(h.effectiveFrom)}</td>
                    <td className="td px-0 tabular-nums">{formatMoney(gross(h), h.currency)}</td>
                    <td className="td px-0 text-right tabular-nums">
                      {formatMoney(net(h), h.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>

        <section className="card overflow-hidden">
          <h2 className="border-b border-line px-5 py-3 font-medium">Leave history</h2>
          {requests.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">No leave requests.</p>
          ) : (
            <ul className="divide-y divide-line">
              {requests.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {LEAVE_TYPE_LABEL[r.leaveType]} · {r.days}d
                    </p>
                    <p className="text-xs text-muted">
                      {formatDate(r.startDate)} – {formatDate(r.endDate)}
                    </p>
                  </div>
                  <span className={`pill ${LEAVE_STATUS_TONE[r.status]}`}>
                    {LEAVE_STATUS_LABEL[r.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-line px-5 py-3">
            <Link href="/admin/leave" className="text-sm font-medium text-brand hover:underline">
              Go to approvals →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
