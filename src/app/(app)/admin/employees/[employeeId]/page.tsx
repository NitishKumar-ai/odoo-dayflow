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
import {
  IconArrowLeft,
  IconBriefcase,
  IconLeave,
  IconPayroll,
  IconAttendance,
  IconFileText,
} from "@/components/Icons";

type Props = {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminEmployeeDetailPage({
  params,
  searchParams,
}: Props) {
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
  const byDate = new Map<string, (typeof attendanceRows)[number]>(
    attendanceRows.map((r: (typeof attendanceRows)[number]) => [r.workDate, r]),
  );

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
    <div className="space-y-8">
      {/* Back Navigation & Breadcrumb */}
      <div>
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-brand transition-colors"
        >
          <IconArrowLeft size={14} />
          <span>Back to Employee Directory</span>
        </Link>
      </div>

      {/* Header Profile Banner */}
      <div className="card p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <Avatar name={name} photoUrl={detail.photoUrl} size={64} />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                {name}
              </h1>
              <span className="pill bg-brand-soft text-brand font-mono text-xs font-bold">
                {detail.employeeCode}
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              {detail.jobTitle || "Role not set"} · {detail.department || "General"} · {detail.email}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {detail.role === "admin" ? (
            <span className="pill bg-purple-50 text-purple-700 ring-purple-600/20 font-bold text-xs">
              🛡️ HR Admin
            </span>
          ) : (
            <span className="pill bg-blue-50 text-blue-700 ring-blue-600/20 font-bold text-xs">
              👤 Employee
            </span>
          )}

          {detail.isActive ? (
            <span className="pill bg-emerald-50 text-emerald-700 ring-emerald-600/20 font-bold text-xs">
              Active Status
            </span>
          ) : (
            <span className="pill bg-rose-50 text-rose-700 ring-rose-600/20 font-bold text-xs">
              Deactivated
            </span>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Edit Form */}
        <section className="card p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-line pb-4 mb-5">
            <IconBriefcase size={18} className="text-brand" />
            <div>
              <h2 className="text-base font-bold text-foreground">
                Employee Profile & Access Control
              </h2>
              <p className="text-xs text-muted">Update job designation, department, and role privileges</p>
            </div>
          </div>

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
        </section>

        {/* Right Column: Leave Quota & Salary Snapshot */}
        <div className="space-y-6">
          {/* Leave Quota Card */}
          <section className="card p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-line pb-4 mb-4">
              <IconLeave size={18} className="text-brand" />
              <h2 className="text-base font-bold text-foreground">
                Leave Balances ({year})
              </h2>
            </div>

            <ul className="space-y-3 text-xs">
              {balances.map((b) => (
                <li key={b.leaveType} className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">
                    {LEAVE_TYPE_LABEL[b.leaveType]}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold tabular-nums text-foreground">
                      {b.left} left
                    </span>
                    <span className="text-muted">/ {b.entitled} days</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Documents Card */}
          <section className="card p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-line pb-4 mb-4">
              <IconFileText size={18} className="text-brand" />
              <h2 className="text-base font-bold text-foreground">Documents on File</h2>
            </div>

            {docs.length === 0 ? (
              <p className="text-xs text-muted">No documents uploaded.</p>
            ) : (
              <ul className="divide-y divide-line text-xs">
                {docs.map((d: (typeof docs)[number]) => (
                  <li key={d.id} className="py-2 flex justify-between items-center">
                    <span className="font-medium text-foreground">{d.name}</span>
                    <span className="pill bg-surface-muted text-muted font-mono">{d.category}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Attendance History Section */}
      <section className="card overflow-hidden shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4">
          <div className="flex items-center gap-2">
            <IconAttendance size={18} className="text-brand" />
            <div>
              <h2 className="text-base font-bold text-foreground">
                Attendance Log: {formatDate(week.start)} – {formatDate(week.end)}
              </h2>
              <p className="text-xs text-muted">Review worked hours and perform manual overrides</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href={`/admin/employees/${employeeId}?week=${addDays(week.start, -7)}`}
              className="btn-secondary btn-sm text-xs font-bold"
            >
              Previous Week
            </Link>
            <Link
              href={`/admin/employees/${employeeId}`}
              className="btn-secondary btn-sm text-xs font-bold"
            >
              This Week
            </Link>
            <Link
              href={`/admin/employees/${employeeId}?week=${addDays(week.start, 7)}`}
              className="btn-secondary btn-sm text-xs font-bold"
            >
              Next Week
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-surface-muted/60">
              <tr>
                <th className="th">Day & Date</th>
                <th className="th">Clock In / Out</th>
                <th className="th">Hours Logged</th>
                <th className="th">Current Status</th>
                <th className="th">Admin Override Tool</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {week.days.map((d: string) => {
                const row = byDate.get(d);
                const weekend = isWeekend(d);

                return (
                  <tr
                    key={d}
                    className={`transition-colors hover:bg-surface-muted/30 ${
                      weekend ? "bg-surface-muted/20 opacity-70" : ""
                    }`}
                  >
                    <td className="td">
                      <span className="font-bold text-foreground">{formatDay(d)}</span>{" "}
                      <span className="text-xs text-muted">{formatDate(d)}</span>
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
                        <span className="text-xs text-muted font-medium">
                          {weekend ? "Weekend Off" : "No punch"}
                        </span>
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

      {/* Salary & Leave History Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Salary Structure Configuration Form */}
        <section className="card p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-line pb-4 mb-5">
            <IconPayroll size={18} className="text-brand" />
            <div>
              <h2 className="text-base font-bold text-foreground">
                Salary Structure Configuration
              </h2>
              <p className="text-xs text-muted">Set or revise itemized compensation components</p>
            </div>
          </div>

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

          {history.length > 1 && (
            <div className="mt-6 border-t border-line pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                Revision Trail
              </h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted text-left border-b border-line/60">
                    <th className="pb-1.5">Effective</th>
                    <th className="pb-1.5">Gross</th>
                    <th className="pb-1.5 text-right">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {history.map((h: (typeof history)[number]) => (
                    <tr key={h.id} className="py-1.5">
                      <td className="py-2 font-medium">{formatDate(h.effectiveFrom)}</td>
                      <td className="py-2 tabular-nums">{formatMoney(gross(h), h.currency)}</td>
                      <td className="py-2 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(net(h), h.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Leave Requests Feed */}
        <section className="card overflow-hidden shadow-xs">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <div className="flex items-center gap-2">
              <IconLeave size={18} className="text-brand" />
              <h2 className="text-base font-bold text-foreground">Leave Requests History</h2>
            </div>
            <Link
              href="/admin/leave"
              className="text-xs font-bold text-brand hover:underline"
            >
              Approvals Queue →
            </Link>
          </div>

          {requests.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted">
              No leave requests submitted by this employee.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {requests.map((r: (typeof requests)[number]) => (
                <li key={r.id} className="p-4 hover:bg-surface-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {LEAVE_TYPE_LABEL[r.leaveType]}
                        </span>
                        <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[11px] font-bold tabular-nums">
                          {r.days}d
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        📅 {formatDate(r.startDate)} → {formatDate(r.endDate)}
                      </p>
                      {r.remarks && (
                        <p className="text-xs text-foreground bg-surface-muted/50 rounded p-1.5 mt-1.5">
                          “{r.remarks}”
                        </p>
                      )}
                    </div>
                    <span className={`pill ${LEAVE_STATUS_TONE[r.status]}`}>
                      {LEAVE_STATUS_LABEL[r.status]}
                    </span>
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
